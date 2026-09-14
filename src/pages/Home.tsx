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
        <div className="mt-8">
          <Link
            to="/get-started"
            className="group inline-flex items-center gap-2 rounded-full border-2 border-brand bg-transparent pt-4 pb-3.5 pl-8 pr-7 text-base font-medium text-brand transition-colors hover:bg-brand hover:text-white active:border-violet-500 active:bg-violet-500"
          >
            Get Started
            <ArrowRight
              className="h-4 w-4 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
              aria-hidden="true"
            />
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
