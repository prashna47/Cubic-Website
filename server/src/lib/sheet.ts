import { env } from '../env.js'

export class SheetAccessError extends Error {}
export class SheetTabMissingError extends Error {}

/** A tab of the sheet, addressed by numeric gid (a bare string) or by name. */
export type SheetTab = { gid: string } | { name: string }

const tabQuery = (tab: SheetTab) =>
  'gid' in tab
    ? `gid=${tab.gid}`
    : `sheet=${encodeURIComponent(tab.name)}`

const SHEET_TTL_MS = 60_000
const FRESH_MIN_AGE_MS = 3_000
const tableCache = new Map<
  string,
  { at: number; rows?: string[][]; inflight?: Promise<string[][]> }
>()

/** Minimal RFC-4180 CSV parser (quoted fields, escaped quotes, newlines). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

async function fetchTable(tab: SheetTab): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${env.JOBS_SHEET_ID}/gviz/tq?tqx=out:csv&${tabQuery(tab)}`
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  const type = res.headers.get('content-type') ?? ''
  if (!res.ok || !type.includes('csv')) {
    throw new SheetAccessError(
      'Cannot read the Google Sheet. Share it as "Anyone with the link can view".',
    )
  }
  return parseCsv(await res.text()).filter((r) => r.some((cell) => cell.trim()))
}

/** One tab of the sheet as rows of cells (header row included), cached briefly. */
export async function getTable(
  tabRef: SheetTab | string,
  fresh = false,
): Promise<string[][]> {
  const tab: SheetTab = typeof tabRef === 'string' ? { gid: tabRef } : tabRef
  const key = tabQuery(tab)
  const hit = tableCache.get(key)
  // A manual refresh skips the cache, but not if it was filled moments ago.
  const ttl = fresh ? FRESH_MIN_AGE_MS : SHEET_TTL_MS
  if (hit?.rows && Date.now() - hit.at < ttl) return hit.rows
  if (hit?.inflight) return hit.inflight
  const inflight = fetchTable(tab)
    .then((rows) => {
      tableCache.set(key, { at: Date.now(), rows })
      return rows
    })
    .catch((err) => {
      tableCache.delete(key)
      throw err
    })
  tableCache.set(key, { at: hit?.at ?? 0, rows: hit?.rows, inflight })
  return inflight
}
