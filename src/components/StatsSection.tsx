import { useEffect, useRef, useState } from 'react'

// Placeholder numbers — swap in real ones when you have them.
type Stat = { label: string; value: number; suffix?: string }

const STATS: Stat[] = [
  { label: 'Candidates placed', value: 500, suffix: '+' },
  { label: 'Interviews booked', value: 1200, suffix: '+' },
  { label: 'Partner companies', value: 40, suffix: '+' },
  { label: 'Interview success rate', value: 95, suffix: '%' },
]

const REDUCE_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** True while `ref`'s element is on screen (re-fires every time it enters/exits). */
function useInView<T extends HTMLElement>(threshold = 0.4) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}

/** Counts 0 -> target while `active`, resets to 0 when it goes false. */
function useCountUp(target: number, active: boolean, duration = 1600) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) {
      setValue(0)
      return
    }
    if (REDUCE_MOTION) {
      setValue(target)
      return
    }

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) ** 3 // ease-out cubic
      setValue(Math.round(target * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, target, duration])

  return value
}

function StatItem({ stat, index }: { stat: Stat; index: number }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const value = useCountUp(stat.value, inView)

  return (
    <div
      ref={ref}
      className="text-center transition-all ease-out"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(16px)',
        transitionDuration: '600ms',
        transitionDelay: inView ? `${index * 80}ms` : '0ms',
      }}
    >
      <div className="text-4xl font-semibold tabular-nums text-fg sm:text-5xl">
        {value.toLocaleString()}
        {stat.suffix}
      </div>
      <div className="mt-2 text-sm text-muted">{stat.label}</div>
    </div>
  )
}

export default function StatsSection() {
  return (
    <section className="border-t border-line py-16">
      <p className="text-center text-lg font-medium text-fg">
        Join thousands of candidates who've grown their careers with{' '}
        <span className="text-brand">Cubic</span>.
      </p>
      <div className="mt-12 grid grid-cols-2 gap-y-10 sm:grid-cols-4">
        {STATS.map((stat, i) => (
          <StatItem key={stat.label} stat={stat} index={i} />
        ))}
      </div>
    </section>
  )
}
