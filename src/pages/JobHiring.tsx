import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, Briefcase, RefreshCw, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useSheetRefresh } from '@/lib/useSheetRefresh'

type Job = {
  url: string
  company: string
  title: string
  site: string
  dateAdded: string | null
}

type JobsResponse = { jobs: Job[]; updatedAt: string }

const RANGES = [
  { key: '5d', label: 'Last 5 days', days: 5 },
  { key: 'all', label: 'All', days: null },
] as const

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate())

function dayLabel(iso: string | null) {
  if (!iso) return 'Undated'
  const day = startOfDay(new Date(iso))
  const diff = Math.round(
    (startOfDay(new Date()).getTime() - day.getTime()) / 86_400_000,
  )
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return day.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function ApplyLink({ url, company }: { url: string; company: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Apply to ${company}`}
      className="group inline-flex items-center gap-1.5 rounded-full border border-brand px-4 py-1.5 text-sm font-medium text-brand transition-colors hover:border-brand/50 hover:bg-line/10 active:bg-line/20"
    >
      Apply
      <ArrowUpRight
        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        aria-hidden="true"
      />
    </a>
  )
}

function JobRow({ job }: { job: Job }) {
  return (
    <li className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-white/[0.03] sm:grid sm:grid-cols-[1.2fr_2fr_0.8fr_auto] sm:items-center sm:gap-6">
      <div className="font-medium text-fg">{job.company}</div>
      <div className="text-fg/90">{job.title}</div>
      <div>
        <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">
          {job.site}
        </span>
      </div>
      <div className="sm:text-right">
        <ApplyLink url={job.url} company={job.company} />
      </div>
    </li>
  )
}

export default function JobHiring() {
  const [range, setRange] = useState<(typeof RANGES)[number]['key']>('5d')
  const [query, setQuery] = useState('')

  const { data, error, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => (await api.get<JobsResponse>('/jobs')).data,
    refetchInterval: 60_000,
    retry: 1,
  })

  const days = RANGES.find((r) => r.key === range)!.days
  const { refresh, spinning, refreshCount } = useSheetRefresh('jobs', '/jobs')

  const groups = useMemo(() => {
    const cutoff =
      days === null ? null : startOfDay(new Date()).getTime() - (days - 1) * 86_400_000
    const q = query.trim().toLowerCase()
    const visible = (data?.jobs ?? []).filter((j) => {
      if (cutoff !== null) {
        if (!j.dateAdded || new Date(j.dateAdded).getTime() < cutoff) return false
      }
      return (
        !q || `${j.company} ${j.title} ${j.site}`.toLowerCase().includes(q)
      )
    })
    const byDay = new Map<string, Job[]>()
    for (const j of visible) {
      const label = dayLabel(j.dateAdded)
      byDay.set(label, [...(byDay.get(label) ?? []), j])
    }
    return { entries: [...byDay], total: visible.length }
  }, [data, days, query])

  const sheetPrivate =
    (error as { response?: { data?: { error?: string } } } | null)?.response
      ?.data?.error === 'sheet_private'

  return (
    <div className="space-y-8">
      <div>
        <Link to="/services" className="text-sm text-muted hover:text-fg">
          ← Services
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-fg">Job Hiring</h1>
        <p className="mt-2 text-muted">
          Fresh openings, updated as new links are added. Pick a role and apply
          directly on the company's site.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          role="tablist"
          aria-label="Date range"
          className="inline-flex self-start rounded-full border border-line p-1"
        >
          {RANGES.map((r) => (
            <button
              key={r.key}
              role="tab"
              aria-selected={range === r.key}
              onClick={() => setRange(r.key)}
              className={[
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                range === r.key
                  ? 'bg-brand text-brand-fg'
                  : 'text-muted hover:text-fg',
              ].join(' ')}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company or title"
            className="w-full rounded-full border border-line bg-transparent py-2 pr-4 pl-10 text-sm text-fg placeholder:text-muted focus:border-brand focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 text-sm text-muted sm:ml-auto">
          {data && (
            <span>
              {groups.total} {groups.total === 1 ? 'job' : 'jobs'}
            </span>
          )}
          <button
            onClick={refresh}
            aria-label="Refresh jobs"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line transition-colors hover:bg-line/60 hover:text-fg"
          >
            <RefreshCw
              className={['h-4 w-4', spinning ? 'animate-spin' : ''].join(' ')}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Dims while refreshing, then replays its entrance (new key). */}
      <div
        key={refreshCount}
        className={[
          'transition-[opacity,filter] duration-300',
          spinning ? 'opacity-40 blur-[1px]' : 'motion-safe:animate-list-in',
        ].join(' ')}
      >
        {isLoading ? (
          <div className="space-y-2" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-line p-8 text-center">
            <p className="font-medium text-fg">
              {sheetPrivate ? "Can't read the job sheet" : "Couldn't load jobs"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {sheetPrivate
                ? 'Set the Google Sheet to “Anyone with the link can view”, then refresh.'
                : 'Something went wrong. Please try again in a moment.'}
            </p>
          </div>
        ) : groups.total === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-line p-12 text-center">
            <Briefcase className="h-8 w-8 text-brand" strokeWidth={1.5} aria-hidden="true" />
            <p className="font-medium text-fg">No jobs to show</p>
            <p className="text-sm text-muted">
              {query
                ? 'Nothing matches your search.'
                : range === '5d'
                  ? 'No links added in the last 5 days. Try “All”.'
                  : 'New openings will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.entries.map(([label, jobs]) => (
              <section key={label}>
                <h2 className="mb-3 text-xs font-semibold tracking-wider text-muted uppercase">
                  {label}
                  <span className="ml-2 font-normal">{jobs.length}</span>
                </h2>
                <div className="overflow-hidden rounded-xl border border-line bg-white/[0.02]">
                  <div className="hidden grid-cols-[1.2fr_2fr_0.8fr_auto] gap-6 border-b border-line px-5 py-3 text-xs font-semibold tracking-wider text-muted uppercase sm:grid">
                    <span>Company</span>
                    <span>Job title</span>
                    <span>Job site</span>
                    <span className="w-[5.5rem] text-right">Link</span>
                  </div>
                  <ul className="divide-y divide-line">
                    {jobs.map((job) => (
                      <JobRow key={job.url} job={job} />
                    ))}
                  </ul>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
