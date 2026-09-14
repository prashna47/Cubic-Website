import {
  CalendarCheck,
  FileCheck2,
  Trophy,
  type LucideIcon,
} from 'lucide-react'

type Card = {
  icon: LucideIcon
  title: string
  subtitle: string
  position: string // tailwind position + rotation classes
}

const CARDS: Card[] = [
  {
    icon: CalendarCheck,
    title: 'Interview booked',
    subtitle: 'Fri, 10:00 AM',
    position: 'top-2 right-0 rotate-3',
  },
  {
    icon: FileCheck2,
    title: 'Resume matched',
    subtitle: '98% match',
    position: 'top-44 left-0 -rotate-2',
  },
  {
    icon: Trophy,
    title: 'Offer received',
    subtitle: 'Welcome aboard',
    position: 'bottom-2 right-2 rotate-2',
  },
]

/** Decorative floating-card composition for the hero. Desktop only. */
export default function HeroVisual() {
  return (
    <div className="relative hidden h-[420px] lg:block" aria-hidden="true">
      <div className="absolute top-1/2 left-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl" />
      {CARDS.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className={`absolute flex w-44 items-center gap-2.5 rounded-xl border border-line bg-white/5 p-3 shadow-xl backdrop-blur-sm ${card.position}`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-brand">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-xs font-medium text-fg">{card.title}</p>
              <p className="text-[11px] text-muted">{card.subtitle}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
