import { ArrowRight, Building2, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import HeroVisual from '@/components/HeroVisual'
import HowItWorks from '@/components/HowItWorks'
import Reveal from '@/components/Reveal'
import SectionTitle from '@/components/SectionTitle'
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
    <div>
      <Reveal>
        <section className="px-4 pt-24 pb-16 sm:px-0 sm:pt-32 sm:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-[3fr_2fr]">
            <div>
              <h1 className="text-5xl font-semibold text-fg">
                Connecting potential with possibility
              </h1>
              <p className="mt-2 text-muted">
                Helping people find opportunities where they can grow and
                succeed.
              </p>
              <div className="mt-24">
                <Link
                  to="/get-started"
                  className="group inline-flex items-center gap-4 rounded-full border-2 border-brand bg-transparent pt-4 pb-3.5 pl-8 pr-7 text-base font-medium text-brand transition-colors hover:border-brand/50 hover:bg-line/10 active:bg-line/20"
                >
                  Get Started
                  <ArrowRight
                    className="h-4 w-4 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
                <span className="inline-flex items-center gap-2">
                  <Users
                    className="h-4 w-4 text-brand"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  500+ candidates placed
                </span>
                <span className="inline-flex items-center gap-2">
                  <Building2
                    className="h-4 w-4 text-brand"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  40+ partner companies
                </span>
              </div>
            </div>
            <HeroVisual />
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="pt-16 pb-8 sm:pt-24 sm:pb-12">
          <HowItWorks />
        </section>
      </Reveal>

      <div className="min-h-24" aria-hidden="true" />

      <Reveal>
        <StatsSection />
      </Reveal>

      <div className="min-h-24" aria-hidden="true" />

      <Reveal>
        <section className="px-4 pt-8 pb-24 sm:px-0 sm:pt-12 sm:pb-32">
          <SectionTitle
            eyebrow="What We Offer"
            heading={
              <>
                Support for <span className="text-brand">every step</span> of
                your search
              </>
            }
          />
          <div className="mt-24 grid gap-4 sm:grid-cols-3">
            {featuredServices.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              to="/services"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  )
}
