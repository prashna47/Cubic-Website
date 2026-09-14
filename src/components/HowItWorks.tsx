import { Target, Trophy, UserPlus, type LucideIcon } from 'lucide-react'

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

export default function HowItWorks() {
  return (
    <section>
      <h2 className="text-lg font-semibold text-fg">How it works</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {STEPS.map((step) => {
          const Icon = step.icon
          return (
            <div
              key={step.title}
              className={
                step.featured
                  ? 'rounded-xl bg-brand p-6 text-brand-fg'
                  : 'rounded-xl border border-line p-6'
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
    </section>
  )
}
