import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Ban, RefreshCw, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useSheetRefresh } from '@/lib/useSheetRefresh'

type BlockedCompany = { company: string; reason: string }
type Response = { companies: BlockedCompany[]; updatedAt: string }

export default function DoNotApply() {
  const [query, setQuery] = useState('')

  const { data, error, isLoading } = useQuery({
    queryKey: ['do-not-apply'],
    queryFn: async () => (await api.get<Response>('/do-not-apply')).data,
    refetchInterval: 60_000,
    retry: 1,
  })

  const { refresh, spinning, refreshCount } = useSheetRefresh('do-not-apply', '/do-not-apply')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data?.companies ?? []).filter(
      (c) => !q || `${c.company} ${c.reason}`.toLowerCase().includes(q),
    )
  }, [data, query])

  const sheetPrivate =
    (error as { response?: { data?: { error?: string } } } | null)?.response
      ?.data?.error === 'sheet_private'

  return (
    <div className="space-y-8">
      <div>
        <Link to="/services" className="text-sm text-muted hover:text-fg">
          ← Services
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-fg">
          Do Not Apply List
        </h1>
        <p className="mt-2 text-muted">
          Companies to skip, and why. Check here before you send an
          application.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company or reason"
            className="w-full rounded-full border border-line bg-transparent py-2 pr-4 pl-10 text-sm text-fg placeholder:text-muted focus:border-brand focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3 text-sm text-muted sm:ml-auto">
          {data && (
            <span>
              {visible.length} {visible.length === 1 ? 'company' : 'companies'}
            </span>
          )}
          <button
            onClick={refresh}
            aria-label="Refresh list"
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
          <div className="grid gap-4 sm:grid-cols-2" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-line p-8 text-center">
            <p className="font-medium text-fg">
              {sheetPrivate ? "Can't read the sheet" : "Couldn't load the list"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {sheetPrivate
                ? 'Set the Google Sheet to “Anyone with the link can view”, then refresh.'
                : 'Something went wrong. Please try again in a moment.'}
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-line p-12 text-center">
            <Ban className="h-8 w-8 text-brand" strokeWidth={1.5} aria-hidden="true" />
            <p className="font-medium text-fg">
              {query ? 'No matches' : 'The list is empty'}
            </p>
            <p className="text-sm text-muted">
              {query
                ? 'Nothing matches your search.'
                : 'Companies to avoid will appear here.'}
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {visible.map((c) => (
              <li
                key={c.company}
                className="flex gap-4 rounded-xl border border-line bg-white/[0.02] p-5 transition-colors hover:bg-white/[0.04]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-lg font-semibold text-brand">
                  {c.company.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-medium text-fg">{c.company}</h2>
                  <p
                    className={[
                      'mt-1 text-sm',
                      c.reason ? 'text-muted' : 'text-muted/60 italic',
                    ].join(' ')}
                  >
                    {c.reason || 'No reason given'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
