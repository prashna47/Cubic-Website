import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { ChevronDown, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import BookingModal, { type BookingTarget } from '@/components/BookingModal'
import { api } from '@/lib/api'
import { useSheetRefresh } from '@/lib/useSheetRefresh'

type Slot = {
  id: string
  label: string
  capacity: number | null // null = emergency slot
  open: number | null
  past: boolean
}

type Day = {
  date: string
  past: boolean
  label: string
  seatsOpen: number
  seatsTotal: number
  slots: Slot[]
}

type ScheduleResponse = { days: Day[]; timezone: string; updatedAt: string }

function SlotAction({
  slot,
  onBook,
  signedIn,
}: {
  slot: Slot
  onBook: () => void
  signedIn: boolean
}) {
  if (slot.past) {
    return <span className="text-sm text-muted">Passed</span>
  }
  if (slot.open === 0) {
    return <span className="text-sm text-muted">All slots booked</span>
  }
  if (!signedIn) {
    return (
      <Link
        to="/login"
        className="text-sm font-medium text-brand hover:underline"
      >
        Sign in to book
      </Link>
    )
  }
  return (
    <button
      onClick={onBook}
      className="rounded-full border border-brand px-5 py-1.5 text-sm font-medium text-brand transition-colors hover:border-brand/50 hover:bg-line/10 active:bg-line/20"
    >
      Book
    </button>
  )
}

function Availability({ slot }: { slot: Slot }) {
  if (slot.capacity === null) {
    return <span className="text-muted">–/–</span>
  }
  const open = slot.past ? 0 : (slot.open ?? 0)
  const tone =
    open === 0
      ? 'text-muted'
      : open === slot.capacity
        ? 'text-emerald-300'
        : 'text-amber-300'
  return (
    <span className={`font-medium tabular-nums ${tone}`}>
      {open}/{slot.capacity}
    </span>
  )
}

/** Splits the flat day list into Monday-to-Friday weeks. */
function weeksOf(days: Day[]) {
  const weeks: Day[][] = []
  for (let i = 0; i < days.length; i += 5) weeks.push(days.slice(i, i + 5))
  return weeks
}

/** "Sep 28 – Oct 2" for a week of days. */
function weekRange(week: Day[]) {
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }
  return `${fmt(week[0].date)} – ${fmt(week[week.length - 1].date)}`
}

export default function InterviewBooking() {
  const { isSignedIn } = useAuth()
  const queryClient = useQueryClient()
  const [target, setTarget] = useState<BookingTarget | null>(null)
  // Days are collapsed until clicked; several can be open at once.
  const [openDays, setOpenDays] = useState<Set<string>>(new Set())
  const toggleDay = (date: string) =>
    setOpenDays((prev) => {
      const next = new Set(prev)
      if (!next.delete(date)) next.add(date)
      return next
    })

  const { data, error, isLoading } = useQuery({
    queryKey: ['interview-slots'],
    queryFn: async () =>
      (await api.get<ScheduleResponse>('/interview-slots')).data,
    refetchInterval: 60_000,
    retry: 1,
  })
  const { refresh, spinning, refreshCount } = useSheetRefresh(
    'interview-slots',
    '/interview-slots',
  )

  const sheetPrivate =
    (error as { response?: { data?: { error?: string } } } | null)?.response
      ?.data?.error === 'sheet_private'

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/services" className="text-sm text-muted hover:text-fg">
            ← Services
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-fg">
            Interview Booking
          </h1>
          <p className="mt-2 text-muted">
            Live interview slot availability. Pick an open time, fill in the
            details, and we'll confirm your slot.
            {data && (
              <span className="text-muted/70"> All times are {data.timezone}.</span>
            )}
          </p>
        </div>
        <button
          onClick={refresh}
          aria-label="Refresh slots"
          className="mt-8 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:bg-line/60 hover:text-fg"
        >
          <RefreshCw
            className={['h-4 w-4', spinning ? 'animate-spin' : ''].join(' ')}
            aria-hidden="true"
          />
        </button>
      </div>

      <div
        key={refreshCount}
        className={[
          'transition-[opacity,filter] duration-300',
          spinning ? 'opacity-40 blur-[1px]' : 'motion-safe:animate-list-in',
        ].join(' ')}
      >
        {isLoading ? (
          <div className="space-y-4" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-line p-8 text-center">
            <p className="font-medium text-fg">
              {sheetPrivate ? "Can't read the sheet" : "Couldn't load slots"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {sheetPrivate
                ? 'Set the Google Sheet to “Anyone with the link can view”, then refresh.'
                : 'Something went wrong. Please try again in a moment.'}
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {weeksOf(data?.days ?? []).map((week, wi) => (
              <div key={week[0].date} className="space-y-3">
                <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">
                  {wi === 0 ? 'This week' : wi === 1 ? 'Next week' : 'Later'}
                  <span className="ml-2 font-normal normal-case">
                    {weekRange(week)}
                  </span>
                </h2>
                {week.map((day) => {
                  const isOpen = openDays.has(day.date)
                  return (
                    <section
                      key={day.date}
                      className={[
                        'overflow-hidden rounded-xl border border-line bg-white/[0.02]',
                        day.past ? 'opacity-50' : '',
                      ].join(' ')}
                    >
                      <button
                        type="button"
                        disabled={day.past}
                        aria-expanded={isOpen}
                        aria-controls={`slots-${day.date}`}
                        onClick={() => toggleDay(day.date)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors enabled:hover:bg-white/[0.03]"
                      >
                        <h3 className="text-lg font-semibold text-fg">
                          {day.label}
                        </h3>
                        <span className="flex items-center gap-3 text-sm text-muted">
                          {day.past ? (
                            'Passed'
                          ) : (
                            <span>
                              <span className="font-medium text-fg tabular-nums">
                                {day.seatsOpen}/{day.seatsTotal}
                              </span>{' '}
                              seats open
                            </span>
                          )}
                          {!day.past && (
                            <ChevronDown
                              className={[
                                'h-5 w-5 transition-transform duration-300',
                                isOpen ? 'rotate-180' : '',
                              ].join(' ')}
                              aria-hidden="true"
                            />
                          )}
                        </span>
                      </button>

                      {/* Height animates 0 -> auto via the grid-rows trick. */}
                      <div
                        id={`slots-${day.date}`}
                        className={[
                          'grid transition-[grid-template-rows] duration-300 ease-out',
                          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                        ].join(' ')}
                      >
                        <div className="overflow-hidden" inert={!isOpen}>
                          <div className="grid grid-cols-[1fr_auto_8.5rem] gap-x-4 border-y border-line px-5 py-2.5 text-xs font-semibold tracking-wider text-muted uppercase">
                            <span>Time</span>
                            <span>Availability</span>
                            <span />
                          </div>
                          <ul className="divide-y divide-line">
                            {day.slots.map((slot) => (
                              <li
                                key={slot.id}
                                className="grid grid-cols-[1fr_auto_8.5rem] items-center gap-x-4 px-5 py-3 transition-colors hover:bg-white/[0.03]"
                              >
                                <span
                                  className={
                                    slot.capacity === null
                                      ? 'font-medium text-brand'
                                      : 'text-fg'
                                  }
                                >
                                  {slot.label}
                                </span>
                                <Availability slot={slot} />
                                <span className="text-right">
                                  <SlotAction
                                    slot={slot}
                                    signedIn={Boolean(isSignedIn)}
                                    onBook={() =>
                                      setTarget({
                                        date: day.date,
                                        dateLabel: day.label,
                                        slotId: slot.id,
                                        slotLabel: slot.label,
                                      })
                                    }
                                  />
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </section>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {target && (
        <BookingModal
          target={target}
          onClose={() => setTarget(null)}
          onBooked={() =>
            queryClient.invalidateQueries({ queryKey: ['interview-slots'] })
          }
        />
      )}
    </div>
  )
}
