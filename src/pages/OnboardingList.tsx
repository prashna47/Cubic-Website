import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Download,
  Eye,
  File,
  FileSpreadsheet,
  FileText,
  FolderDown,
  Presentation,
  RefreshCw,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import DocumentModal from '@/components/DocumentModal'
import { useSheetRefresh } from '@/lib/useSheetRefresh'

export type OnboardingDoc = {
  id: string
  name: string
  extension: string
  viewUrl: string
  downloadUrl: string
}

type Response = { documents: OnboardingDoc[]; updatedAt: string }

const DOC_EXTS = new Set(['doc', 'docx'])
const SHEET_EXTS = new Set(['xls', 'xlsx', 'csv'])
const SLIDE_EXTS = new Set(['ppt', 'pptx'])

function fileMeta(extension: string): { label: string; icon: LucideIcon } {
  if (extension === 'pdf') return { label: 'PDF', icon: FileText }
  if (DOC_EXTS.has(extension)) return { label: 'DOCX', icon: FileText }
  if (SHEET_EXTS.has(extension)) return { label: 'XLSX', icon: FileSpreadsheet }
  if (SLIDE_EXTS.has(extension)) return { label: 'PPTX', icon: Presentation }
  return { label: extension ? extension.toUpperCase() : 'FILE', icon: File }
}

function DocCard({
  doc,
  onView,
}: {
  doc: OnboardingDoc
  onView: () => void
}) {
  const { label, icon: Icon } = fileMeta(doc.extension)
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-line bg-white/[0.02] p-5 transition-colors hover:border-brand/50 hover:bg-white/[0.04]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line text-brand">
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="line-clamp-2 font-medium text-fg">{doc.name}</h2>
          <span className="mt-1 inline-block rounded-full border border-line px-2 py-0.5 text-xs text-muted">
            {label}
          </span>
        </div>
      </div>
      <div className="mt-auto flex gap-2 pt-1">
        <button
          onClick={onView}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-brand px-3 py-1.5 text-sm font-medium text-brand transition-colors hover:border-brand/50 hover:bg-line/10 active:bg-line/20"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          View
        </button>
        <a
          href={doc.downloadUrl}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-brand/50 hover:text-fg"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Download
        </a>
      </div>
    </li>
  )
}

export default function OnboardingList() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<OnboardingDoc | null>(null)

  const { data, error, isLoading } = useQuery({
    queryKey: ['onboarding-docs'],
    queryFn: async () => (await api.get<Response>('/onboarding-docs')).data,
    refetchInterval: 60_000,
    retry: 1,
  })
  const { refresh, spinning, refreshCount } = useSheetRefresh(
    'onboarding-docs',
    '/onboarding-docs',
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data?.documents ?? []).filter(
      (d) => !q || d.name.toLowerCase().includes(q),
    )
  }, [data, query])

  const driveMissing =
    (error as { response?: { data?: { error?: string } } } | null)?.response
      ?.data?.error === 'drive_private'

  return (
    <div className="space-y-8 px-4 sm:px-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/services" className="text-sm text-muted hover:text-fg">
            ← Services
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-fg">
            Onboarding List
          </h1>
          <p className="mt-2 text-muted">
            Guides, prompts, and reference documents. View them here or
            download the original file.
          </p>
        </div>
        <button
          onClick={refresh}
          aria-label="Refresh documents"
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
          <div className="relative flex-1 sm:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents"
              className="w-full rounded-full border border-line bg-transparent py-2 pr-4 pl-10 text-sm text-fg placeholder:text-muted focus:border-brand focus:outline-none"
            />
          </div>
          <span className="text-sm text-muted sm:ml-auto">
            {visible.length} {visible.length === 1 ? 'document' : 'documents'}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-line p-8 text-center">
            <p className="font-medium text-fg">
              {driveMissing ? "Can't read the Drive folder" : "Couldn't load documents"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {driveMissing
                ? 'Set the Drive folder to “Anyone with the link can view”, then refresh.'
                : 'Something went wrong. Please try again in a moment.'}
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-line p-12 text-center">
            <FolderDown
              className="h-8 w-8 text-brand"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <p className="font-medium text-fg">No documents to show</p>
            <p className="text-sm text-muted">
              {query ? 'Nothing matches your search.' : 'The folder is empty.'}
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((doc) => (
              <DocCard key={doc.id} doc={doc} onView={() => setSelected(doc)} />
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <DocumentModal doc={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
