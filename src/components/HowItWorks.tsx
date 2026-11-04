import { Search, Users, Rocket } from 'lucide-react'

const steps = [
  { icon: Search, title: 'Discover Opportunities', description: 'Explore roles that match your skills, goals, and career interests.' },
  { icon: Users, title: 'Get Personalized Support', description: 'Work with our team for guidance, preparation, and a smoother hiring process.' },
  { icon: Rocket, title: 'Grow Your Career', description: 'Land the right role and keep building toward your long-term success.' },
]

export default function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-title">
      <p className="text-xs font-semibold tracking-[0.2em] text-brand">HOW IT WORKS</p>
      <h2 id="how-it-works-title" className="mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">Your next opportunity starts here</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, description }) => (
          <article key={title} className="ruby-step-card">
            <Icon className="h-9 w-9 text-brand" strokeWidth={1.5} aria-hidden="true" />
            <h3 className="mt-5 text-lg font-semibold text-fg">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
