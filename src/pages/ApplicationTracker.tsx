import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Search, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import CandidateModal from '@/components/CandidateModal'
import { api } from '@/lib/api'
import { useSheetRefresh } from '@/lib/useSheetRefresh'

export type Candidate = {
  fullName: string
  status: string
  stage: string
  mktStartDate: string
  eadEndDate: string
  marketingLocation: string
  poc: string
  currentLocation: string
}

type Response = { candidates: Candidate[]; updatedAt: string }

/** Rough color for a stage's pill: green while active, blue while onboarding,
 *  amber while waiting on something else. */
function stageTone(stage: string) {
  const s = stage.toLowerCase()
  if (s.includes('not active')) return 'border-line text-muted'
  if (s.includes('active')) return 'border-emerald-400/30 text-emerald-300'
  if (s.includes('onboarding')) return 'border-blue-400/30 text-blue-300'
  if (/waiting|left|first contact/.test(s))
    return 'border-amber-400/30 text-amber-300'
  return 'border-line text-muted'
}

function StagePill({ stage }: { stage: string }) {
  if (!stage) return <span className="text-muted">—</span>
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs whitespace-nowrap ${stageTone(stage)}`}
    >
      {stage}
    </span>
  )
}

export default function ApplicationTracker() {
  const [query, setQuery] = useState('')
  const [poc, setPoc] = useState<string>('')
  const [selected, setSelected] = useState<Candidate | null>(null)

  const { data, error, isLoading } = useQuery({
    queryKey: ['application-tracker'],
    queryFn: async () =>
      (await api.get<Response>('/application-tracker')).data,
    refetchInterval: 60_000,
    retry: 1,
  })
  const { refresh, spinning, refreshCount } = useSheetRefresh(
    'application-tracker',
    '/application-tracker',
  )

  const pocs = useMemo(
    () => [...new Set((data?.candidates ?? []).map((c) => c.poc).filter(Boolean))].sort(),
    [data],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data?.candidates ?? []).filter((c) => {
      if (poc && c.poc !== poc) return false
      return (
        !q ||
        `${c.fullName} ${c.status} ${c.stage} ${c.currentLocation}`
          .toLowerCase()
          .includes(q)
      )
    })
  }, [data, poc, query])

  const errData = (
    error as { response?: { data?: { error?: string; message?: string } } } | null
  )?.response?.data
  const status = (error as { response?: { status?: number } } | null)?.response
    ?.status
  const unauthenticated = status === 401
  const forbidden = status === 403
  const sheetPrivate = errData?.error === 'sheet_private'

  return (
    <div className="space-y-8 px-4 sm:px-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/services" className="text-sm text-muted hover:text-fg">
            ← Services
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-fg">
            Candidate Directory
          </h1>
          <p className="mt-2 text-muted">
            Live roster of candidates currently in the market.
          </p>
        </div>
        <button
          onClick={refresh}
          aria-label="Refresh candidates"
          className="mt-8 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:bg-line/60 hover:text-fg"
        >
          <RefreshCw
            className={['h-4 w-4', spinning ? 'animate-spin' : ''].join(' ')}
            aria-hidden="true"
          />
        </button>
      </div>

      {!error && !isLoading && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {pocs.length > 0 && (
            <div
              role="tablist"
              aria-label="Filter candidates by POC"
              className="flex flex-wrap gap-1 self-start rounded-full border border-line p-1"
            >
              <button
                role="tab"
                aria-selected={poc === ''}
                onClick={() => setPoc('')}
                className={[
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  poc === '' ? 'bg-brand text-brand-fg' : 'text-muted hover:text-fg',
                ].join(' ')}
              >
                All candidates
              </button>
              {pocs.map((p) => (
                <button
                  key={p}
                  role="tab"
                  aria-selected={poc === p}
                  onClick={() => setPoc(p)}
                  className={[
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    poc === p ? 'bg-brand text-brand-fg' : 'text-muted hover:text-fg',
                  ].join(' ')}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <div className="relative flex-1 sm:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search candidates"
              className="w-full rounded-full border border-line bg-transparent py-2 pr-4 pl-10 text-sm text-fg placeholder:text-muted focus:border-brand focus:outline-none"
            />
          </div>

          <span className="inline-flex items-center gap-1.5 text-sm text-muted sm:ml-auto">
            <Users className="h-4 w-4" aria-hidden="true" />
            {visible.length} {visible.length === 1 ? 'candidate' : 'candidates'}
          </span>
        </div>
      )}

      <div
        key={refreshCount}
        className={[
          'transition-[opacity,filter] duration-300',
          spinning ? 'opacity-40 blur-[1px]' : 'motion-safe:animate-list-in',
        ].join(' ')}
      >
        {isLoading ? (
          <div className="space-y-2" aria-busy="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-line p-8 text-center">
            <p className="font-medium text-fg">
              {unauthenticated
                ? 'Sign in required'
                : forbidden
                  ? 'Admin access only'
                  : sheetPrivate
                    ? "Can't read the sheet"
                    : "Couldn't load candidates"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {unauthenticated ? (
                <>
                  <Link to="/login" className="text-brand hover:underline">
                    Sign in
                  </Link>{' '}
                  to view the directory.
                </>
              ) : forbidden ? (
                'This directory is restricted to the team.'
              ) : sheetPrivate ? (
                'Set the Google Sheet to “Anyone with the link can view”, then refresh.'
              ) : (
                'Something went wrong. Please try again in a moment.'
              )}
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-line p-12 text-center">
            <Users className="h-8 w-8 text-brand" strokeWidth={1.5} aria-hidden="true" />
            <p className="font-medium text-fg">No candidates to show</p>
            <p className="text-sm text-muted">
              {query || poc ? 'Nothing matches your filters.' : 'The roster is empty.'}
            </p>
          </div>
        ) : (
          <>
            {/* Table, sm and up */}
            <div className="hidden overflow-x-auto rounded-xl border border-line bg-white/[0.02] sm:block">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-xs font-semibold tracking-wider text-muted uppercase">
                    <th className="px-5 py-3 text-left">Full Name</th>
                    <th className="px-3 py-3 text-left">Status</th>
                    <th className="px-3 py-3 text-left">Stage</th>
                    <th className="px-3 py-3 text-left">MKT Start</th>
                    <th className="px-3 py-3 text-left">EAD End</th>
                    <th className="px-3 py-3 text-left">Mkt Location</th>
                    <th className="px-3 py-3 text-left">Nepal POC</th>
                    <th className="px-3 py-3 text-left">Current Location</th>
                    <th className="px-5 py-3 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.map((c) => (
                    <tr key={c.fullName} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-5 py-3 font-medium whitespace-nowrap text-fg">
                        {c.fullName}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted">
                        {c.status || '—'}
                      </td>
                      <td className="px-3 py-3">
                        <StagePill stage={c.stage} />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted tabular-nums">
                        {c.mktStartDate || '—'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted tabular-nums">
                        {c.eadEndDate || '—'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted">
                        {c.marketingLocation || '—'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted">
                        {c.poc || '—'}
                      </td>
                      <td className="max-w-64 truncate px-3 py-3 text-muted" title={c.currentLocation}>
                        {c.currentLocation || '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setSelected(c)}
                          className="rounded-full border border-brand px-4 py-1 text-xs font-medium text-brand transition-colors hover:border-brand/50 hover:bg-line/10 active:bg-line/20"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stacked cards, below sm */}
            <ul className="space-y-3 sm:hidden">
              {visible.map((c) => (
                <li
                  key={c.fullName}
                  className="rounded-xl border border-line bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-fg">{c.fullName}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {c.status || '—'} · {c.poc || 'No POC'}
                      </p>
                    </div>
                    <StagePill stage={c.stage} />
                  </div>
                  <button
                    onClick={() => setSelected(c)}
                    className="mt-3 w-full rounded-full border border-brand py-1.5 text-sm font-medium text-brand transition-colors hover:border-brand/50 hover:bg-line/10 active:bg-line/20"
                  >
                    View
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {selected && (
        <CandidateModal candidate={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
