import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Copy, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'

type Response = { prompt: string; updatedAt: string }

/**
 * Opens as a popup over the Services page (the route itself renders full-
 * bleed, like a modal): loads the prompt text from the sheet, and lets the
 * user copy it in one click.
 */
export default function ResumePrompt() {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')

  const { data, error, isLoading } = useQuery({
    queryKey: ['resume-prompt'],
    queryFn: async () => (await api.get<Response>('/resume-prompt')).data,
    staleTime: 60_000,
    retry: 1,
  })
  const prompt = (data?.prompt ?? '').replace(/\r\n/g, '\n')

  const close = useCallback(() => navigate('/services'), [navigate])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [close])

  async function copyPrompt() {
    setCopyError('')
    try {
      await navigator.clipboard.writeText(prompt)
    } catch {
      // Clipboard API blocked (older browser, insecure context, denied
      // permission) — fall back to the classic select-and-copy trick.
      try {
        const area = document.createElement('textarea')
        area.value = prompt
        area.style.position = 'fixed'
        area.style.opacity = '0'
        document.body.appendChild(area)
        area.focus()
        area.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(area)
        if (!ok) throw new Error('execCommand failed')
      } catch {
        setCopyError('Could not copy automatically — select the text and copy it.')
        return
      }
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sheetPrivate =
    (error as { response?: { data?: { error?: string } } } | null)?.response
      ?.data?.error === 'sheet_private'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-prompt-title"
        className="flex max-h-[92svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-line bg-[#0b0b0d] shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h1 id="resume-prompt-title" className="text-lg font-semibold text-fg">
              Resume Tailoring Prompt
            </h1>
            <p className="mt-1 text-sm text-muted">
              Paste this into your AI assistant of choice, along with your resume.
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-line/60 hover:text-fg"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 animate-pulse rounded bg-white/5" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-line p-8 text-center">
              <p className="font-medium text-fg">
                {sheetPrivate ? "Can't read the sheet" : "Couldn't load the prompt"}
              </p>
              <p className="mt-2 text-sm text-muted">
                {sheetPrivate
                  ? 'Set the Google Sheet to “Anyone with the link can view”, then reopen this.'
                  : 'Something went wrong. Please try again in a moment.'}
              </p>
            </div>
          ) : !prompt ? (
            <p className="py-8 text-center text-sm text-muted">
              The prompt hasn't been added to the sheet yet.
            </p>
          ) : (
            <pre className="font-sans text-sm whitespace-pre-wrap text-fg/90">
              {prompt}
            </pre>
          )}
        </div>

        <div className="border-t border-line px-6 py-4">
          {copyError && (
            <p role="alert" className="mb-3 text-sm text-red-400">
              {copyError}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <Link to="/services" className="text-sm text-muted hover:text-fg">
              ← Services
            </Link>
            <button
              onClick={copyPrompt}
              disabled={!prompt}
              className="inline-flex items-center gap-2 rounded-full border-2 border-brand px-6 py-2 text-sm font-medium text-brand transition-colors hover:border-brand/50 hover:bg-line/10 active:bg-line/20 disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copy prompt
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
