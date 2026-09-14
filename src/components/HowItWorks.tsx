import { useEffect, useState } from 'react'
import { Target, Trophy, UserPlus, type LucideIcon } from 'lucide-react'
import SectionTitle from '@/components/SectionTitle'

// Depth (px) of each chevron's point / notch.
const ARROW = 32

type Step = {
  title: string
  description: string
  icon: LucideIcon
  featured?: boolean
}

const STEPS: Step[] = [
  {
    title: 'Apply',
    description:
      'Share your goals and experience so we can find the right fit.',
    icon: UserPlus,
  },
  {
    title: 'Get Matched',
    description:
      'We connect you with opportunities and get you interview-ready.',
    icon: Target,
    featured: true,
  },
  {
    title: 'Get Hired',
    description: 'Walk into interviews with confidence and land the role.',
    icon: Trophy,
  },
]

/**
 * A right-pointing chevron: straight left edge unless `notchLeft`, straight
 * right edge unless `pointRight`. Cards are laid out with a `-ARROW` margin
 * so each point tucks exactly into the next card's notch.
 */
function chevronClipPath(notchLeft: boolean, pointRight: boolean) {
  const right = pointRight
    ? `calc(100% - ${ARROW}px) 0, 100% 50%, calc(100% - ${ARROW}px) 100%`
    : '100% 0, 100% 100%'
  const leftNotch = notchLeft ? `, ${ARROW}px 50%` : ''
  return `polygon(0 0, ${right}, 0 100%${leftNotch})`
}

/**
 * True at Tailwind's `sm` breakpoint (640px) and up. Below it, the chevron
 * shapes clip too much of an already-narrow column to stay readable, so
 * cards stack as plain cards instead.
 */
function useIsSmUp() {
  const [isSmUp, setIsSmUp] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 640px)').matches,
  )

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 640px)')
    const onChange = () => setIsSmUp(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isSmUp
}

export default function HowItWorks() {
  const isSmUp = useIsSmUp()

  return (
    <div>
      <SectionTitle
        eyebrow="How It Works"
        heading={
          <>
            Three simple steps to{' '}
            <span className="text-brand">your next role</span>
          </>
        }
      />
      <div className={isSmUp ? 'mt-24 flex' : 'mt-24 flex flex-col gap-4'}>
        {STEPS.map((step, i) => {
          const Icon = step.icon
          const isFirst = i === 0
          const isLast = i === STEPS.length - 1
          return (
            <div
              key={step.title}
              style={
                isSmUp
                  ? {
                      clipPath: chevronClipPath(!isFirst, !isLast),
                      marginLeft: isFirst ? 0 : -ARROW,
                    }
                  : undefined
              }
              className={[
                'flex flex-col justify-center px-8 py-8 sm:px-10 sm:py-10',
                isSmUp ? 'min-h-[18rem] flex-1' : 'rounded-xl',
                step.featured ? 'bg-brand text-brand-fg' : 'bg-white/5 text-fg',
              ].join(' ')}
            >
              <Icon
                className={
                  step.featured ? 'h-9 w-9 text-brand-fg' : 'h-9 w-9 text-brand'
                }
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p
                className={
                  step.featured
                    ? 'mt-2 text-sm text-brand-fg/80'
                    : 'mt-2 text-sm text-muted'
                }
              >
                {step.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
