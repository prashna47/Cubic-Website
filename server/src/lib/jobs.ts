import { env } from '../env.js'

export type Job = {
  url: string
  company: string
  title: string
  site: string
  /** ISO timestamp, or null if the sheet row has no usable date. */
  dateAdded: string | null
}

export class SheetAccessError extends Error {}

// ---------------------------------------------------------------- sheet

const SHEET_TTL_MS = 60_000
const tableCache = new Map<
  string,
  { at: number; rows?: string[][]; inflight?: Promise<string[][]> }
>()

type SheetRow = {
  url: string
  date: string
  company: string
  title: string
  site: string
}

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

async function fetchTable(gid: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${env.JOBS_SHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`
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
async function getTable(gid: string): Promise<string[][]> {
  const hit = tableCache.get(gid)
  if (hit?.rows && Date.now() - hit.at < SHEET_TTL_MS) return hit.rows
  if (hit?.inflight) return hit.inflight
  const inflight = fetchTable(gid)
    .then((rows) => {
      tableCache.set(gid, { at: Date.now(), rows })
      return rows
    })
    .catch((err) => {
      tableCache.delete(gid)
      throw err
    })
  tableCache.set(gid, { at: hit?.at ?? 0, rows: hit?.rows, inflight })
  return inflight
}

async function getSheetRows(): Promise<SheetRow[]> {
  const table = await getTable(env.JOBS_SHEET_GID)

  // Columns are found by header name so extra/reordered columns are fine.
  // With no header row, column A is the link and column B the date.
  const header = table[0]?.map((h) => h.trim().toLowerCase()) ?? []
  const has = (name: string) => header.findIndex((h) => h.includes(name))
  let idx = { url: 0, date: 1, company: -1, title: -1, site: -1 }
  let body = table
  if (header.some((h) => h.includes('link') || h.includes('url'))) {
    const link = has('link') >= 0 ? has('link') : has('url')
    idx = {
      url: link,
      date: has('date'),
      company: has('company'),
      title: has('title'),
      site: has('site'),
    }
    body = table.slice(1)
  }
  const cell = (r: string[], i: number) => (i >= 0 ? (r[i] ?? '').trim() : '')
  return body
    .map((r) => ({
      url: cell(r, idx.url),
      date: cell(r, idx.date),
      company: cell(r, idx.company),
      title: cell(r, idx.title),
      site: cell(r, idx.site),
    }))
    .filter((r) => /^https?:\/\//i.test(r.url))
}

export type BlockedCompany = { company: string; reason: string }

/** The "Do not apply list" tab: Company + Reason columns. */
export async function getDoNotApply(): Promise<BlockedCompany[]> {
  const table = await getTable(env.BLOCKLIST_SHEET_GID)
  const header = table[0]?.map((h) => h.trim().toLowerCase()) ?? []
  const hasHeader = header.some((h) => h.includes('company'))
  const col = (name: string, fallback: number) => {
    const i = header.findIndex((h) => h.includes(name))
    return hasHeader && i >= 0 ? i : fallback
  }
  const c = col('company', 0)
  const r = col('reason', 1)
  return (hasHeader ? table.slice(1) : table)
    .map((row) => ({
      company: (row[c] ?? '').trim(),
      reason: (row[r] ?? '').trim(),
    }))
    .filter((row) => row.company)
    .sort((a, b) => a.company.localeCompare(b.company))
}

function parseDate(raw: string): string | null {
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

// ----------------------------------------------------------- enrichment

type Meta = { company: string; title: string; site: string }

const META_TTL_MS = 24 * 60 * 60 * 1000
const META_FAIL_TTL_MS = 10 * 60 * 1000
const metaCache = new Map<string, { at: number; ttl: number; meta: Meta }>()

const SITE_NAMES: Record<string, string> = {
  'linkedin.com': 'LinkedIn',
  'indeed.com': 'Indeed',
  'glassdoor.com': 'Glassdoor',
  'ziprecruiter.com': 'ZipRecruiter',
  'wellfound.com': 'Wellfound',
  'greenhouse.io': 'Greenhouse',
  'lever.co': 'Lever',
  'ashbyhq.com': 'Ashby',
  'myworkdayjobs.com': 'Workday',
  'workable.com': 'Workable',
  'smartrecruiters.com': 'SmartRecruiters',
  'icims.com': 'iCIMS',
  'bamboohr.com': 'BambooHR',
  'jobvite.com': 'Jobvite',
  'dice.com': 'Dice',
  'monster.com': 'Monster',
  'builtin.com': 'Built In',
  'careerpuck.com': 'CareerPuck',
}

function rootDomain(host: string) {
  const parts = host.replace(/^www\./, '').split('.')
  return parts.slice(-2).join('.')
}

function siteFromUrl(u: URL): string {
  const root = rootDomain(u.hostname)
  if (SITE_NAMES[root]) return SITE_NAMES[root]
  const name = root.split('.')[0]
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function prettifySlug(slug: string) {
  return decodeURIComponent(slug)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

/** Company name implied by well-known applicant-tracking-system URLs. */
function companyFromUrl(u: URL): string {
  const host = u.hostname
  const first = u.pathname.split('/').filter(Boolean)[0] ?? ''
  if (
    /(^|\.)greenhouse\.io$|(^|\.)lever\.co$|(^|\.)ashbyhq\.com$|^apply\.workable\.com$|^(www\.)?smartrecruiters\.com$/.test(
      host,
    )
  ) {
    return first ? prettifySlug(first) : ''
  }
  if (/(^|\.)careerpuck\.com$/.test(host)) {
    const board = u.pathname.match(/\/job-board\/([^/]+)/)?.[1]
    return board ? prettifySlug(board) : ''
  }
  const sub = host.match(/^([^.]+)\.(myworkdayjobs|bamboohr|jobvite)\.com$/)
  return sub ? prettifySlug(sub[1]) : ''
}

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .trim()
}

function metaContent(html: string, key: string): string {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? []
  for (const tag of tags) {
    const name = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1]
    if (name?.toLowerCase() === key) {
      const content = tag.match(/content=["']([^"']*)["']/i)?.[1]
      if (content) return decodeEntities(content)
    }
  }
  return ''
}

function findJobPosting(node: unknown): Record<string, unknown> | null {
  if (Array.isArray(node)) {
    for (const n of node) {
      const hit = findJobPosting(n)
      if (hit) return hit
    }
  } else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    const type = obj['@type']
    if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) {
      return obj
    }
    return findJobPosting(obj['@graph'])
  }
  return null
}

function jsonLdJob(html: string): { title: string; company: string } {
  const blocks =
    html.match(/<script[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) ??
    []
  for (const block of blocks) {
    try {
      const json = JSON.parse(block.replace(/^<script[^>]*>|<\/script>$/gi, ''))
      const job = findJobPosting(json)
      if (!job) continue
      const org = job.hiringOrganization as { name?: string } | string | undefined
      return {
        title: typeof job.title === 'string' ? decodeEntities(job.title) : '',
        company:
          typeof org === 'string' ? org : org?.name ? decodeEntities(org.name) : '',
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return { title: '', company: '' }
}

/** Splits titles like "Job Application for Engineer at Stripe". */
function splitTitle(raw: string): { title: string; company: string } {
  const cleaned = raw.replace(/^Job Application for\s+/i, '')
  const at = cleaned.match(/^(.+?)\s+(?:at|@)\s+(.+?)(?:\s+[|\-–].*)?$/i)
  if (at) return { title: at[1].trim(), company: at[2].trim() }
  const pipe = cleaned.split(/\s+[|\-–]\s+/)
  return { title: pipe[0].trim(), company: '' }
}

function isPrivateHost(host: string) {
  return (
    host === 'localhost' ||
    /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/.test(host) ||
    host === '[::1]'
  )
}

async function fetchMeta(rawUrl: string): Promise<{ meta: Meta; ok: boolean }> {
  const u = new URL(rawUrl)
  const meta: Meta = {
    site: siteFromUrl(u),
    company: companyFromUrl(u),
    title: '',
  }
  if (isPrivateHost(u.hostname)) return { meta, ok: false }
  try {
    const res = await fetch(rawUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(6_000),
      headers: {
        'user-agent':
          'Mozilla/5.0 (compatible; CubicJobsBot/1.0; +https://cubic-data.com)',
        accept: 'text/html,application/xhtml+xml',
      },
    })
    if (!res.ok) return { meta, ok: false }
    const html = (await res.text()).slice(0, 600_000)

    const ld = jsonLdJob(html)
    const pageTitle = decodeEntities(
      metaContent(html, 'og:title') ||
        html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
        '',
    )
    const split = splitTitle(ld.title || pageTitle)

    meta.title = ld.title || split.title
    meta.company =
      ld.company ||
      meta.company ||
      split.company ||
      metaContent(html, 'og:site_name')
    return { meta, ok: Boolean(meta.title) }
  } catch {
    return { meta, ok: false }
  }
}

async function getMeta(url: string): Promise<Meta> {
  const hit = metaCache.get(url)
  if (hit && Date.now() - hit.at < hit.ttl) return hit.meta
  const { meta, ok } = await fetchMeta(url)
  metaCache.set(url, {
    at: Date.now(),
    ttl: ok ? META_TTL_MS : META_FAIL_TTL_MS,
    meta,
  })
  return meta
}

/** Runs `fn` over `items` with at most `limit` in flight. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>) {
  const out: R[] = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await fn(items[i])
      }
    }),
  )
  return out
}

// --------------------------------------------------------------- public

export async function getJobs(): Promise<Job[]> {
  const rows = await getSheetRows()
  const jobs = await mapLimit(rows, 8, async (row): Promise<Job> => {
    // Values typed into the sheet always win over what we scraped.
    const needsLookup = !(row.company && row.title && row.site)
    const meta = needsLookup
      ? await getMeta(row.url)
      : { company: '', title: '', site: '' }
    return {
      url: row.url,
      company: row.company || meta.company || '—',
      title: row.title || meta.title || 'Job posting',
      site: row.site || meta.site,
      dateAdded: parseDate(row.date),
    }
  })
  // Newest first; rows without a date sink to the bottom.
  return jobs.sort((a, b) => (b.dateAdded ?? '').localeCompare(a.dateAdded ?? ''))
}
