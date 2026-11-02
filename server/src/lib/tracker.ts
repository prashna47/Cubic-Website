import { env } from '../env.js'
import { getTable } from './sheet.js'

export type Candidate = {
  fullName: string
  status: string // immigration status: OPT EAD, OPT, GC, USC, STEM...
  stage: string // e.g. "Active - Marketing", "Resume Waiting"
  mktStartDate: string
  eadEndDate: string
  marketingLocation: string // Onsite / Remote
  poc: string
  currentLocation: string
}

const word = (w: string) => (h: string) =>
  new RegExp(`(^|[^a-z])${w}($|[^a-z])`).test(h)

/**
 * The "Application Tracker" tab. Columns are matched by header keyword, so
 * order and extra columns don't matter. "Marketing Location" and "Current
 * Location" are told apart by the word "marketing"/"current" in the header.
 */
export async function getApplicationTracker(fresh = false): Promise<Candidate[]> {
  const table = await getTable(env.TRACKER_SHEET_GID, fresh)
  const header = table[0]?.map((h) => h.trim().toLowerCase()) ?? []
  const find = (...tests: ((h: string) => boolean)[]) =>
    header.findIndex((h) => tests.some((t) => t(h)))
  const col = {
    fullName: find(word('name')),
    status: find(word('status')),
    stage: find(word('stage')),
    mktStart: find((h) => h.includes('mkt') || h.includes('marketing start')),
    eadEnd: find((h) => h.includes('ead')),
    marketingLocation: find((h) => h.includes('marketing') && h.includes('location')),
    poc: find((h) => h.includes('poc')),
    currentLocation: find((h) => h.includes('current')),
  }
  const cell = (r: string[], i: number) => (i >= 0 ? (r[i] ?? '').trim() : '')

  return table
    .slice(1)
    .map(
      (r): Candidate => ({
        fullName: cell(r, col.fullName),
        status: cell(r, col.status),
        stage: cell(r, col.stage),
        mktStartDate: cell(r, col.mktStart),
        eadEndDate: cell(r, col.eadEnd),
        marketingLocation: cell(r, col.marketingLocation),
        poc: cell(r, col.poc),
        currentLocation: cell(r, col.currentLocation),
      }),
    )
    .filter((c) => c.fullName)
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
}
