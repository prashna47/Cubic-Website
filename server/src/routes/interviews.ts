import express, { Router } from 'express'
import { z } from 'zod'
import { env } from '../env.js'
import { clerkClient } from '@clerk/express'
import {
  findSlot,
  getCandidateData,
  getSchedule,
  TIMEZONE_LABEL,
} from '../lib/interviews.js'
import { clerkUserId, requireAuth } from '../middleware/auth.js'

export const interviewsRouter = Router()

// Dropdown choices shared with the booking form.
// Stage, mode and location come from the Information sheet; these are used when it has none.
const DEFAULT_STAGES = ['Screening', 'Technical', 'Behavioral', 'Managerial', 'Panel', 'Final']
const DEFAULT_MODES = ['Video call', 'Phone call', 'On-site']
const DEFAULT_LOCATIONS = ['Remote', 'Hybrid', 'On-site']

export const OPTIONS = {
  durations: ['15 min', '30 min', '45 min', '1 Hr', '1.5 Hr', '2 Hr', '3 Hr', '3+ Hr'],
} as const

function formatTime(hhmm: string) {
  const h = Number(hhmm.slice(0, 2))
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 === 0 ? 12 : h % 12}:${hhmm.slice(3)} ${suffix} ${TIMEZONE_LABEL}`
}

const MAX_RESUME_BYTES = 5 * 1024 * 1024
const RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const requestSchema = z.object({
  candidateName: z.string().trim().min(1).max(120),
  stage: z.string().trim().min(1).max(120),
  mode: z.string().trim().min(1).max(120),
  location: z.string().trim().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotId: z.string().regex(/^(\d{2}:00|emergency)$/),
  time: z.string().regex(/^\d{2}:(00|15|30|45)$/), // start time, 15-min steps
  duration: z.enum(OPTIONS.durations),
  client: z.string().trim().min(1).max(120),
  vendor: z.string().trim().max(120).default(''),
  panel: z.string().trim().max(120).default(''),
  note: z.string().trim().max(2000).default(''),
  jobDescription: z.string().trim().min(1).max(20000),
  resume: z
    .object({
      name: z.string().max(200),
      mimeType: z.string(),
      base64: z.string(),
    })
    .nullable()
    .default(null),
})

interviewsRouter.get('/interview-slots', async (req, res, next) => {
  try {
    res.json({
      days: await getSchedule(req.query.fresh === '1'),
      timezone: TIMEZONE_LABEL,
      updatedAt: new Date().toISOString(),
    })
  } catch (err) {
    next(err)
  }
})

// Candidate names are not public: signed-in users only.
interviewsRouter.get('/candidates', requireAuth(), async (req, res, next) => {
  try {
    const { names, stages, modes, locations } = await getCandidateData(
      req.query.fresh === '1',
    )
    res.json({
      candidates: names,
      options: {
        ...OPTIONS,
        stages: stages.length ? stages : DEFAULT_STAGES,
        modes: modes.length ? modes : DEFAULT_MODES,
        locations: locations.length ? locations : DEFAULT_LOCATIONS,
      },
    })
  } catch (err) {
    next(err)
  }
})

// Resume uploads arrive as base64 JSON, so this route needs a bigger body
// limit than the default (mounted before the global parser).
interviewsRouter.post(
  '/interview-requests',
  express.json({ limit: '9mb' }),
  requireAuth(),
  async (req, res, next) => {
    try {
      if (!env.BOOKING_WEBHOOK_URL) {
        res.status(503).json({
          error: 'booking_not_configured',
          message: 'Booking requests are not set up yet.',
        })
        return
      }
      const parsed = requestSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          error: 'invalid_request',
          message: 'Please complete all required fields.',
        })
        return
      }
      const data = parsed.data

      // Stage, mode and location must be one of the sheet's current options.
      const { stages, modes, locations } = await getCandidateData()
      const okStages = stages.length ? stages : DEFAULT_STAGES
      const okModes = modes.length ? modes : DEFAULT_MODES
      const okLocations = locations.length ? locations : DEFAULT_LOCATIONS
      if (
        !okStages.includes(data.stage) ||
        !okModes.includes(data.mode) ||
        !okLocations.includes(data.location)
      ) {
        res.status(400).json({
          error: 'invalid_request',
          message: 'Please choose a valid stage, mode and location.',
        })
        return
      }

      if (data.resume) {
        const bytes = Buffer.byteLength(data.resume.base64, 'base64')
        if (!RESUME_TYPES.includes(data.resume.mimeType) || bytes > MAX_RESUME_BYTES) {
          res.status(400).json({
            error: 'invalid_resume',
            message: 'Resume must be a PDF or Word file under 5 MB.',
          })
          return
        }
      }

      // The start time must sit inside the chosen slot (any working hour
      // for the emergency slot).
      const hour = Number(data.time.slice(0, 2))
      const slotHour = data.slotId === 'emergency' ? null : Number(data.slotId.slice(0, 2))
      const inSlot =
        slotHour === null
          ? hour >= 8 && hour <= 16 && hour !== 12
          : hour === slotHour
      if (!inSlot) {
        res.status(400).json({
          error: 'invalid_request',
          message: 'Pick a meeting time within the chosen slot.',
        })
        return
      }

      // Re-check against the live sheet: someone may have taken the seat.
      const found = await findSlot(data.date, data.slotId)
      if (!found || found.slot.past || (found.slot.open !== null && found.slot.open < 1)) {
        res.status(409).json({
          error: 'slot_unavailable',
          message: 'That slot is no longer available. Please pick another.',
        })
        return
      }

      // Straight from Clerk: the submission doesn't need our database, which
      // can be asleep (Neon free tier) and would otherwise fail the request.
      const clerkUser = await clerkClient.users.getUser(clerkUserId(req))
      const requestedBy =
        clerkUser.primaryEmailAddress?.emailAddress ??
        clerkUser.emailAddresses[0]?.emailAddress ??
        ''
      const upstream = await fetch(env.BOOKING_WEBHOOK_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'content-type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          token: env.BOOKING_WEBHOOK_TOKEN,
          submittedAt: new Date().toISOString(),
          requestedBy,
          slotLabel: found.slot.label,
          timeLabel: formatTime(data.time),
          timezone: TIMEZONE_LABEL,
          ...data,
        }),
        signal: AbortSignal.timeout(30_000),
      })
      const result = (await upstream.json().catch(() => null)) as {
        ok?: boolean
      } | null
      if (!upstream.ok || !result?.ok) {
        console.error('Booking webhook failed', upstream.status, result)
        res.status(502).json({
          error: 'webhook_failed',
          message: "Couldn't save your request. Please try again.",
        })
        return
      }
      res.status(201).json({ ok: true })
    } catch (err) {
      next(err)
    }
  },
)
