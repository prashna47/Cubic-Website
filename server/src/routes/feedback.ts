import { Router } from 'express'
import { z } from 'zod'
import { env } from '../env.js'

export const feedbackRouter = Router()

// Shown on the form; kept here so the frontend and the validation agree.
export const BLOCKER_OPTIONS = [
  'Not enough interview calls',
  'Resume/profile not getting shortlisted',
  "Job roles don't match my resume",
  'Lack of feedback after interviews',
  'Other',
] as const

const rating = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
])

const feedbackSchema = z.object({
  supportRating: rating,
  supportComplaint: z.string().trim().min(1).max(4000),
  responsivenessRating: rating,
  supportSuggestions: z.string().trim().max(4000).default(''),
  biggestBlocker: z.string().trim().max(200).default(''), // free text if "Other"
  otherSuggestions: z.string().trim().max(4000).default(''),
  overallRating: rating.optional(),
  // Honeypot: real visitors never see or fill this field. No length limit
  // here — a bot that fills it in should still pass validation, so the
  // handler below can quietly no-op instead of returning a validation error
  // that would tip it off.
  website: z.string().optional(),
})

feedbackRouter.post('/feedback', async (req, res, next) => {
  try {
    if (!env.BOOKING_WEBHOOK_URL) {
      res.status(503).json({
        error: 'not_configured',
        message: 'Feedback submission is not set up yet.',
      })
      return
    }
    const parsed = feedbackSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: 'invalid_request',
        message: 'Please complete the required fields.',
      })
      return
    }
    if (parsed.data.website) {
      // Honeypot tripped — pretend success without writing anything.
      res.status(201).json({ ok: true })
      return
    }

    const upstream = await fetch(env.BOOKING_WEBHOOK_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'content-type': 'text/plain;charset=utf-8' },
      // No name, email, or user id is included — the form is anonymous.
      body: JSON.stringify({
        token: env.BOOKING_WEBHOOK_TOKEN,
        form: 'feedback',
        submittedAt: new Date().toISOString(),
        ...parsed.data,
      }),
      signal: AbortSignal.timeout(30_000),
    })
    const result = (await upstream.json().catch(() => null)) as { ok?: boolean } | null
    if (!upstream.ok || !result?.ok) {
      console.error('Feedback webhook failed', upstream.status, result)
      res.status(502).json({
        error: 'webhook_failed',
        message: "Couldn't submit your feedback. Please try again.",
      })
      return
    }
    res.status(201).json({ ok: true })
  } catch (err) {
    next(err)
  }
})
