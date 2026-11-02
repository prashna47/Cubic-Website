import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { Candidate } from '@/pages/ApplicationTracker'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-fg">
        {value || '—'}
      </span>
    </div>
  )
}

export default function CandidateModal({
  candidate,
  onClose,
}: {
  candidate: Candidate
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
        aria-labelledby="candidate-title"
        className="flex max-h-[85svh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-line bg-[#0b0b0d] shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 id="candidate-title" className="text-lg font-semibold text-fg">
              {candidate.fullName}
            </h2>
            <p className="mt-1 text-sm text-muted">Candidate tracker</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-line/60 hover:text-fg"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          <div className="divide-y divide-line">
            <Row label="Status" value={candidate.status} />
            <Row label="Stage" value={candidate.stage} />
            <Row label="MKT Start Date" value={candidate.mktStartDate} />
            <Row label="EAD End Date" value={candidate.eadEndDate} />
            <Row label="Marketing Location" value={candidate.marketingLocation} />
            <Row label="Nepal POC" value={candidate.poc} />
            <Row label="Current Location" value={candidate.currentLocation} />
          </div>
        </div>

        <div className="border-t border-line px-6 py-4">
          <p className="text-center text-sm text-muted">
            The full tracker view is coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
