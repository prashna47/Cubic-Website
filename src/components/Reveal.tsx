import { useEffect, useRef, useState, type ReactNode } from 'react'

const REDUCE_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Fades + slides its content up every time it scrolls into view, and back
 * down when it scrolls out — replays on every pass. The hero (first on the
 * page) plays immediately since it's already in the viewport at mount;
 * sections further down wait until the user actually scrolls to them.
 */
export default function Reveal({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (REDUCE_MOTION) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const shown = REDUCE_MOTION || inView

  // The observed wrapper never moves; only the inner element is translated.
  // Observing the moving element itself makes its intersection ratio change
  // as it animates, which re-triggers the observer and flickers at the edge.
  return (
    <div ref={ref} className={className}>
      <div
        className={`transition-all duration-700 ease-out ${
          shown ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
