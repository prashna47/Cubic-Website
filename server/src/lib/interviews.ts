import { env } from '../env.js'
import { getTable } from './sheet.js'

// All slot times are Central time (the sheet and the site call it "CST").
const TZ = 'America/Chicago'
const TZ_LABEL = 'CST'
const SEATS_PER_SLOT = 3
const WEEKS_SHOWN = 2 // this week and next, Monday to Friday

// Hourly slots as [startHour, endHour] in 24h time. Friday finishes early.
const WEEKDAY_SLOTS: [number, number][] = [
  [8, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [13, 14],
  [14, 15],
  [15, 16],
  [16, 17],
]
const FRIDAY_SLOTS = WEEKDAY_SLOTS.slice(0, 6)

export type Slot = {
  /** Start time "HH:MM" (24h); "emergency" for the emergency slot. */
  id: string
  label: string
  capacity: number | null // null = emergency slot (no seat count)
  open: number | null
  past: boolean
}

export type Day = {
  date: string // yyyy-mm-dd
  past: boolean // before today: no longer bookable
  label: string
  seatsOpen: number
  seatsTotal: number
  slots: Slot[]
}

const pad = (n: number) => String(n).padStart(2, '0')

function hourLabel(h: number) {
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 === 0 ? 12 : h % 12} ${suffix}`
}

/** Current date and minutes-since-midnight in Central time. */
function nowInTz() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  return {
    y: get('year'),
    m: get('month'),
    d: get('day'),
    minutes: (get('hour') % 24) * 60 + get('minute'),
  }
}

/** Parses yyyy-mm-dd, m/d/yyyy or anything `Date` understands, to yyyy-mm-dd. */
function toDay(raw: string): string | null {
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) return `${iso[1]}-${pad(Number(iso[2]))}-${pad(Number(iso[3]))}`
  const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (us) return `${us[3]}-${pad(Number(us[1]))}-${pad(Number(us[2]))}`
  const d = new Date(raw)
  return Number.isNaN(d.getTime())
    ? null
    : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Minutes since midnight for "1:30 PM CST", "10:00 AM", "14:30"; null if unknown. */
function toMinutes(raw: string): number | null {
  const m = raw.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]m)?/i)
  if (!m) return null
  let h = Number(m[1])
  const mer = m[3]?.toLowerCase()
  if (mer) h = (h % 12) + (mer === 'pm' ? 12 : 0)
  return h * 60 + Number(m[2] ?? 0)
}

/** How many interviews the sheet already holds per "yyyy-mm-dd|hour". */
async function bookedByHour(fresh: boolean) {
  const table = await getTable({ name: env.INTERVIEWS_SHEET_NAME }, fresh)
  const header = table[0]?.map((h) => h.trim().toLowerCase()) ?? []
  const dateCol = header.findIndex((h) => h.includes('date'))
  const timeCol = header.findIndex((h) => h.includes('time'))
  const counts = new Map<string, number>()
  if (dateCol < 0 || timeCol < 0) return counts
  for (const row of table.slice(1)) {
    const day = toDay((row[dateCol] ?? '').trim())
    const mins = toMinutes(row[timeCol] ?? '')
    if (!day || mins === null) continue
    const key = `${day}|${Math.floor(mins / 60)}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

/** The next business days, each with its slots and seats left. */
export async function getSchedule(fresh = false): Promise<Day[]> {
  const booked = await bookedByHour(fresh)
  const now = nowInTz()
  const todayStr = `${now.y}-${pad(now.m)}-${pad(now.d)}`

  // Monday of the current week. On a weekend the week is over, so roll to
  // the coming Monday; the window then advances by itself each week.
  const cursor = new Date(Date.UTC(now.y, now.m - 1, now.d))
  const dow0 = cursor.getUTCDay() // 0 = Sunday
  cursor.setUTCDate(
    cursor.getUTCDate() + (dow0 === 6 ? 2 : dow0 === 0 ? 1 : 1 - dow0),
  )

  const days: Day[] = []
  for (let week = 0; week < WEEKS_SHOWN; week++) {
    for (let i = 0; i < 5; i++) {
      const date = `${cursor.getUTCFullYear()}-${pad(cursor.getUTCMonth() + 1)}-${pad(cursor.getUTCDate())}`
      const dow = cursor.getUTCDay()
      const isPast = date < todayStr
      const isToday = date === todayStr
      const grid = dow === 5 ? FRIDAY_SLOTS : WEEKDAY_SLOTS
      const slots: Slot[] = isPast
        ? []
        : [
            ...grid.map(([start, end]): Slot => ({
              id: `${pad(start)}:00`,
              label: `${hourLabel(start)} – ${hourLabel(end)} ${TZ_LABEL}`,
              capacity: SEATS_PER_SLOT,
              open: Math.max(
                0,
                SEATS_PER_SLOT - (booked.get(`${date}|${start}`) ?? 0),
              ),
              past: isToday && now.minutes >= start * 60,
            })),
            {
              id: 'emergency',
              label: 'Emergency Slot',
              capacity: null,
              open: null,
              past: false,
            },
          ]
      days.push({
        date,
        past: isPast,
        label: cursor
          .toLocaleDateString('en-US', {
            timeZone: 'UTC',
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })
          .replace(',', ''),
        seatsOpen: slots.reduce(
          (sum, s) => sum + (s.open !== null && !s.past ? s.open : 0),
          0,
        ),
        seatsTotal: grid.length * SEATS_PER_SLOT,
        slots,
      })
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    cursor.setUTCDate(cursor.getUTCDate() + 2) // skip the weekend
  }
  return days
}

/** Looks up one slot for a date, for validating a booking request. */
export async function findSlot(date: string, slotId: string, fresh = true) {
  const day = (await getSchedule(fresh)).find((d) => d.date === date)
  const slot = day?.slots.find((s) => s.id === slotId)
  return day && slot ? { day, slot } : null
}

export type CandidateData = {
  names: string[]
  stages: string[]
  modes: string[]
  locations: string[]
}

/**
 * The "Candidates" tab. Each column is an independent list, matched by header:
 * "Candidates", "Interview Stage", "Mode of Interview" and "Location" (the
 * form's drop-down options, one per row). Blank cells are skipped.
 */
export async function getCandidateData(fresh = false): Promise<CandidateData> {
  const table = await getTable(env.CANDIDATES_SHEET_GID, fresh)
  const header = table[0]?.map((h) => h.trim().toLowerCase()) ?? []
  const column = (match: (h: string) => boolean, fallback = -1) => {
    const i = header.findIndex(match)
    if (i < 0 && fallback < 0) return []
    const col = i >= 0 ? i : fallback
    const values = table
      .slice(i >= 0 || header.length === 0 ? 1 : 0)
      .map((r) => (r[col] ?? '').trim())
      .filter(Boolean)
    return [...new Set(values)]
  }
  return {
    // Falls back to the first column if there's no "Name" header.
    names: column((h) => h.includes('candidate') || h.includes('name'), 0).sort((a, b) =>
      a.localeCompare(b),
    ),
    stages: column((h) => h.includes('stage')),
    modes: column((h) => h.includes('mode')),
    locations: column((h) => h.includes('location')),
  }
}

export const TIMEZONE_LABEL = TZ_LABEL
