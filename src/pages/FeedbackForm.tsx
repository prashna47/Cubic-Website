import { type FormEvent, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'

const BLOCKER_OPTIONS = [
  'Not enough interview calls',
  'Resume/profile not getting shortlisted',
  "Job roles don't match my resume",
  'Lack of feedback after interviews',
  'Other',
] as const

const inputClass =
  'w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-brand focus:outline-none'

function Field({
  label,
  required = false,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-fg">
        {label}
        {required && <span className="ml-1 text-brand">*</span>}
      </p>
      {children}
    </div>
  )
}

function RatingInput({
  value,
  onChange,
}: {
  value: number | null
  onChange: (n: number) => void
}) {
  return (
    <div role="radiogroup" className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          onClick={() => onChange(n)}
          className={[
            'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-colors',
            value === n
              ? 'border-brand bg-brand text-brand-fg'
              : 'border-line text-muted hover:border-brand/50 hover:text-fg',
          ].join(' ')}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} className={`${inputClass} resize-y`} {...props} />
}

export default function FeedbackForm() {
  const [supportRating, setSupportRating] = useState<number | null>(null)
  const [supportComplaint, setSupportComplaint] = useState('')
  const [responsivenessRating, setResponsivenessRating] = useState<number | null>(
    null,
  )
  const [supportSuggestions, setSupportSuggestions] = useState('')
  const [blocker, setBlocker] = useState('')
  const [blockerOther, setBlockerOther] = useState('')
  const [otherSuggestions, setOtherSuggestions] = useState('')
  const [overallRating, setOverallRating] = useState<number | null>(null)
  const [website, setWebsite] = useState('') // honeypot
  const [formError, setFormError] = useState('')

  const submit = useMutation({
    mutationFn: async () => {
      await api.post('/feedback', {
        supportRating,
        supportComplaint,
        responsivenessRating,
        supportSuggestions,
        biggestBlocker: blocker === 'Other' ? blockerOther || 'Other' : blocker,
        otherSuggestions,
        overallRating: overallRating ?? undefined,
        website,
      })
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supportRating) return setFormError('Rate the interview support you received.')
    if (!supportComplaint.trim())
      return setFormError('Please describe your concern, even briefly.')
    if (!responsivenessRating) return setFormError('Rate your point of contact’s responsiveness.')
    setFormError('')
    submit.mutate()
  }

  const apiMessage = (
    submit.error as { response?: { data?: { message?: string } } } | null
  )?.response?.data?.message

  if (submit.isSuccess) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-0">
        <CheckCircle2 className="h-10 w-10 text-emerald-400" strokeWidth={1.5} />
        <h1 className="text-2xl font-semibold text-fg">Thank you</h1>
        <p className="text-muted">
          Your anonymous feedback has been submitted. We read every response.
        </p>
        <Link to="/services" className="mt-2 text-sm text-brand hover:underline">
          ← Back to Services
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 sm:px-0">
      <div>
        <Link to="/services" className="text-sm text-muted hover:text-fg">
          ← Services
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-fg">
          Anonymous Feedback and Suggestions
        </h1>
        <p className="mt-2 text-muted">
          Share your experience with Cubic's interview and job-placement
          support. This helps us improve communication, interview
          preparation, response time, and workflows.
        </p>
        <p className="mt-3 rounded-lg border border-line bg-white/[0.02] px-4 py-2.5 text-sm text-muted">
          This form is anonymous. We do not collect or store your name or
          email address.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-7">
        <Field label="How satisfied are you with the interview support you received?" required>
          <RatingInput value={supportRating} onChange={setSupportRating} />
        </Field>

        <Field
          label="Name the support person you were not satisfied with and explain your concern. You may include more than one."
          required
        >
          <TextArea
            value={supportComplaint}
            onChange={(e) => setSupportComplaint(e.target.value)}
            placeholder="There's no word limit — share as much detail as helps."
          />
        </Field>

        <Field
          label="How would you rate the responsiveness of your point of contact when you needed assistance?"
          required
        >
          <RatingInput value={responsivenessRating} onChange={setResponsivenessRating} />
        </Field>

        <Field label="Any suggestions for improving Cubic's interview support?">
          <TextArea
            value={supportSuggestions}
            onChange={(e) => setSupportSuggestions(e.target.value)}
            placeholder="Optional"
          />
        </Field>

        <Field label="What's the single biggest thing slowing down your job search right now?">
          <div className="space-y-2">
            {BLOCKER_OPTIONS.map((opt) => (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line px-3.5 py-2.5 text-sm text-fg transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand/10"
              >
                <input
                  type="radio"
                  name="blocker"
                  value={opt}
                  checked={blocker === opt}
                  onChange={() => setBlocker(opt)}
                  className="h-4 w-4 accent-brand"
                />
                {opt}
              </label>
            ))}
            {blocker === 'Other' && (
              <input
                value={blockerOther}
                onChange={(e) => setBlockerOther(e.target.value)}
                placeholder="What's slowing you down?"
                className={`${inputClass} mt-1`}
              />
            )}
          </div>
        </Field>

        <Field label="Any other suggestions for the Cubic team?">
          <TextArea
            value={otherSuggestions}
            onChange={(e) => setOtherSuggestions(e.target.value)}
            placeholder="Optional"
          />
        </Field>

        <Field label="Overall, how satisfied are you with the marketing and job-placement support you received?">
          <RatingInput value={overallRating} onChange={setOverallRating} />
        </Field>

        {/* Honeypot — hidden from real visitors, invisible to screen readers. */}
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        {(formError || apiMessage || submit.isError) && (
          <p role="alert" className="text-sm text-red-400">
            {formError || apiMessage || "Couldn't submit your feedback. Please try again."}
          </p>
        )}

        <button
          type="submit"
          disabled={submit.isPending}
          className="w-full rounded-full border-2 border-brand py-3 text-sm font-medium text-brand transition-colors hover:border-brand/50 hover:bg-line/10 active:bg-line/20 disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {submit.isPending ? 'Submitting…' : 'Submit feedback'}
        </button>
      </form>
    </div>
  )
}
