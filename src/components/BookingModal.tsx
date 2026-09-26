import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2, FileUp, X } from 'lucide-react'
import { api } from '@/lib/api'

export type BookingTarget = {
  date: string // yyyy-mm-dd
  dateLabel: string // "Monday September 28"
  slotId: string
  slotLabel: string // "8 AM – 9 AM CST"
}

type Options = {
  stages: string[]
  modes: string[]
  locations: string[]
  durations: string[]
}

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT =
  '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const TZ_LABEL = 'CST'

/** 15-minute start times for a slot: its own hour, or the whole working day. */
function timeOptionsFor(slotId: string) {
  const hours =
    slotId === 'emergency'
      ? [8, 9, 10, 11, 13, 14, 15, 16]
      : [Number(slotId.slice(0, 2))]
  return hours.flatMap((h) =>
    [0, 15, 30, 45].map((m) => {
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      const label = `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${
        h >= 12 ? 'PM' : 'AM'
      } ${TZ_LABEL}`
      return { value, label }
    }),
  )
}

const inputClass =
  'w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-brand focus:outline-none disabled:opacity-60'

function Field({
  label,
  children,
  required = true,
}: {
  label: string
  children: ReactNode
  required?: boolean
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-fg">
        {label}
        {!required && <span className="ml-1 font-normal text-muted">(optional)</span>}
      </span>
      {children}
    </label>
  )
}

/**
 * Type-to-search dropdown used for every choice in the form. `value` is only
 * set when an option is picked from the list, so free text never gets through.
 */
function Combobox({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [text, setText] = useState(value)
  const [open, setOpen] = useState(false)
  // Show the full list until the user types, so short lists are browsable.
  const [typed, setTyped] = useState(false)
  const matches = useMemo(() => {
    const q = typed ? text.trim().toLowerCase() : ''
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 50)
  }, [options, text, typed])

  return (
    <div className="relative">
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setTyped(true)
          onChange('') // must pick from the list
          setOpen(true)
        }}
        onFocus={() => {
          setTyped(false)
          setOpen(true)
        }}
        onBlur={() =>
          setTimeout(() => {
            setOpen(false)
            // Unpicked free text isn't a value: restore the last pick.
            setText(value)
          }, 120)
        }
        placeholder={placeholder}
        autoComplete="off"
        className={inputClass}
      />
      {open && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-line bg-[#0b0b0d] py-1 shadow-xl">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">No matches found</li>
          ) : (
            matches.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setText(o)
                    onChange(o)
                    setOpen(false)
                  }}
                  className={[
                    'block w-full px-3 py-2 text-left text-sm hover:bg-line/40',
                    o === value ? 'text-brand' : 'text-fg',
                  ].join(' ')}
                >
                  {o}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

export default function BookingModal({
  target,
  onClose,
  onBooked,
}: {
  target: BookingTarget
  onClose: () => void
  onBooked: () => void
}) {
  const { data } = useQuery({
    queryKey: ['candidates'],
    queryFn: async () =>
      (await api.get<{ candidates: string[]; options: Options }>('/candidates'))
        .data,
    staleTime: 5 * 60_000,
  })

  const [candidate, setCandidate] = useState('')
  const [stage, setStage] = useState('')
  const [mode, setMode] = useState('')
  const [location, setLocation] = useState('')
  const [duration, setDuration] = useState('1 Hr')
  const timeOptions = useMemo(() => timeOptionsFor(target.slotId), [target.slotId])
  // A normal slot starts on its hour; the emergency slot has no default.
  const [timeLabel, setTimeLabel] = useState(
    target.slotId === 'emergency' ? '' : timeOptions[0].label,
  )
  const [client, setClient] = useState('')
  const [vendor, setVendor] = useState('')
  const [panel, setPanel] = useState('')
  const [note, setNote] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [resume, setResume] = useState<File | null>(null)
  const [formError, setFormError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  // Close on Escape; lock background scroll while open.
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

  const submit = useMutation({
    mutationFn: async () => {
      await api.post('/interview-requests', {
        candidateName: candidate,
        stage,
        mode,
        location,
        date: target.date,
        slotId: target.slotId,
        duration,
        time: timeOptions.find((o) => o.label === timeLabel)?.value,
        client,
        vendor,
        panel,
        note,
        jobDescription,
        resume: resume
          ? {
              name: resume.name,
              mimeType: resume.type,
              base64: await toBase64(resume),
            }
          : null,
      })
    },
    onSuccess: onBooked,
  })

  const options = data?.options
  const apiMessage = (
    submit.error as { response?: { data?: { message?: string } } } | null
  )?.response?.data?.message

  function pickFile(file: File | undefined) {
    if (!file) return
    if (file.size > MAX_BYTES) {
      setFormError('Resume must be under 5 MB.')
      return
    }
    if (!/\.(pdf|docx?)$/i.test(file.name)) {
      setFormError('Resume must be a PDF or Word file.')
      return
    }
    setFormError('')
    setResume(file)
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!candidate) return setFormError('Pick a candidate from the list.')
    if (!stage || !mode || !location)
      return setFormError('Choose the interview stage, mode and location.')
    if (!timeLabel) return setFormError('Pick a meeting time.')
    if (!client.trim()) return setFormError('Enter the client name.')
    if (!jobDescription.trim()) return setFormError('Add the job description.')
    setFormError('')
    submit.mutate()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        className="flex max-h-[92svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-line bg-[#0b0b0d] shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 id="booking-title" className="text-lg font-semibold text-fg">
              Interview Request
            </h2>
            <p className="mt-1 text-sm text-muted">
              Booking for {target.dateLabel} · {target.slotLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-line/60 hover:text-fg"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {submit.isSuccess ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" strokeWidth={1.5} />
            <p className="text-lg font-medium text-fg">Request submitted</p>
            <p className="max-w-xs text-sm text-muted">
              We'll review it and confirm your slot. The availability updates
              once it's approved.
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded-full border-2 border-brand px-6 py-2 text-sm font-medium text-brand transition-colors hover:border-brand/50 hover:bg-line/10"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <Field label="Candidate Name">
                <Combobox
                  options={data?.candidates ?? []}
                  value={candidate}
                  onChange={setCandidate}
                  placeholder="Type to search candidates…"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Interview Stage">
                  <Combobox
                    value={stage}
                    onChange={setStage}
                    placeholder="Select interview stage"
                    options={options?.stages ?? []}
                  />
                </Field>
                <Field label="Mode of Interview">
                  <Combobox
                    value={mode}
                    onChange={setMode}
                    placeholder="Select mode"
                    options={options?.modes ?? []}
                  />
                </Field>
              </div>

              <Field label="Location">
                <Combobox
                  value={location}
                  onChange={setLocation}
                  placeholder="Select location"
                  options={options?.locations ?? []}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Meeting Date">
                  <input
                    readOnly
                    value={target.date}
                    className={`${inputClass} cursor-not-allowed`}
                  />
                </Field>
                <Field label="Meeting Time">
                  <Combobox
                    value={timeLabel}
                    onChange={setTimeLabel}
                    placeholder="Select time"
                    options={timeOptions.map((o) => o.label)}
                  />
                </Field>
                <Field label="Meeting Duration">
                  <Combobox
                    value={duration}
                    onChange={setDuration}
                    placeholder="Duration"
                    options={options?.durations ?? []}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Client">
                  <input
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="Client name"
                    className={inputClass}
                  />
                </Field>
                <Field label="Vendor" required={false}>
                  <input
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="Vendor name"
                    className={inputClass}
                  />
                </Field>
                <Field label="Panel" required={false}>
                  <input
                    value={panel}
                    onChange={(e) => setPanel(e.target.value)}
                    placeholder="Panel name"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Resume" required={false}>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    pickFile(e.dataTransfer.files[0])
                  }}
                  onClick={() => fileInput.current?.click()}
                  className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed border-line px-4 py-5 text-center transition-colors hover:border-brand/60"
                >
                  <FileUp className="h-5 w-5 text-brand" aria-hidden="true" />
                  <p className="text-sm text-fg">
                    {resume ? resume.name : 'Drop resume here or click to upload'}
                  </p>
                  <p className="text-xs text-muted">PDF or Word · max 5 MB</p>
                  <input
                    ref={fileInput}
                    type="file"
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(e) => pickFile(e.target.files?.[0])}
                  />
                </div>
              </Field>

              <Field label="Note / Meeting URL" required={false}>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note or meeting URL"
                  className={inputClass}
                />
              </Field>

              <Field label="Job Description">
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={5}
                  placeholder="Paste the job description text"
                  className={`${inputClass} resize-y`}
                />
              </Field>
            </div>

            <div className="border-t border-line px-6 py-4">
              {(formError || apiMessage || submit.isError) && (
                <p role="alert" className="mb-3 text-sm text-red-400">
                  {formError ||
                    apiMessage ||
                    "Couldn't submit your request. Please try again."}
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-5 py-2 text-sm font-medium text-muted transition-colors hover:text-fg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submit.isPending}
                  className="rounded-full border-2 border-brand px-6 py-2 text-sm font-medium text-brand transition-colors hover:border-brand/50 hover:bg-line/10 active:bg-line/20 disabled:opacity-60"
                >
                  {submit.isPending ? 'Submitting…' : 'Submit request'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
