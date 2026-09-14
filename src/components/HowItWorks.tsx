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

export default function HowItWorks() {
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
      <div className="mt-24 flex">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          const isFirst = i === 0
          const isLast = i === STEPS.length - 1
          return (
            <div
              key={step.title}
              style={{
                clipPath: chevronClipPath(!isFirst, !isLast),
                marginLeft: isFirst ? 0 : -ARROW,
              }}
              className={
                step.featured
                  ? 'flex min-h-[22rem] flex-1 flex-col justify-center bg-brand px-10 py-10 text-brand-fg'
                  : 'flex min-h-[22rem] flex-1 flex-col justify-center bg-white/5 px-10 py-10 text-fg'
              }
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
