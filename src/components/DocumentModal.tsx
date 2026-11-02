import { useEffect } from 'react'
import { Download, X } from 'lucide-react'
import type { OnboardingDoc } from '@/pages/OnboardingList'

export default function DocumentModal({
  doc,
  onClose,
}: {
  doc: OnboardingDoc
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-title"
        className="flex h-[92svh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-line bg-[#0b0b0d] shadow-2xl sm:h-[85svh] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <h2
            id="document-title"
            className="truncate text-base font-semibold text-fg"
          >
            {doc.name}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-line/60 hover:text-fg"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 bg-white">
          <iframe
            src={doc.viewUrl}
            title={doc.name}
            className="h-full w-full border-0"
            allow="autoplay"
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
          <a
            href={doc.downloadUrl}
            className="inline-flex items-center gap-2 rounded-full border-2 border-brand px-6 py-2 text-sm font-medium text-brand transition-colors hover:border-brand/50 hover:bg-line/10 active:bg-line/20"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download
          </a>
        </div>
      </div>
    </div>
  )
}
