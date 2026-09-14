import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import ServiceCard from '@/components/ServiceCard'
import StatsSection from '@/components/StatsSection'
import { SERVICES } from '@/data/services'

const FEATURED_SLUGS = [
  'interview-booking',
  'resume-prompt',
  'application-tracker',
]
const featuredServices = SERVICES.filter((s) => FEATURED_SLUGS.includes(s.slug))

export default function Home() {
  return (
    <section className="space-y-6">
      <div className="mb-30"></div>
      <div>
        <h1 className="text-5xl font-semibold text-fg">
          Connecting potential with possibility
        </h1>
        <p className="mt-2 text-muted">
          Helping people find opportunities where they can grow and succeed.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/sign-up"
            className="rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-brand-fg transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
          <Link
            to="/services"
            className="rounded-md border border-line px-5 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-line/60"
          >
            Explore Services
          </Link>
        </div>
      </div>

      <div>
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-semibold text-fg">Services</h2>
          <Link
            to="/services"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {featuredServices.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </div>

      <StatsSection />
    </section>
  )
}
