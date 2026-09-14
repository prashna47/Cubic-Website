import { api } from '@/lib/api'
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SERVICES } from '@/data/services'
import ServiceCard from '@/components/ServiceCard'
import StatsSection from '@/components/StatsSection'

const FEATURED_SLUGS = [
  'interview-booking',
  'resume-prompt',
  'application-tracker',
]
const featuredServices = SERVICES.filter((s) => FEATURED_SLUGS.includes(s.slug))

type HealthResponse = { status: string }
type MeResponse = { user: { id: string; email: string; name: string | null } }

export default function Home() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: async () => (await api.get<HealthResponse>('/health')).data,
  })

  const { isSignedIn } = useAuth()
  const me = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get<MeResponse>('/me')).data,
    enabled: !!isSignedIn,
  })

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

      <div className="rounded-lg border border-line p-4">
        <h2 className="font-medium text-fg">Backend status</h2>
        <p className="mt-1 text-sm text-muted">
          <code>GET /api/health</code> via TanStack Query.
        </p>
        <p className="mt-3 text-sm">
          {health.isLoading && 'Checking…'}
          {health.isError && (
            <span className="text-red-500">
              No backend — start the API (npm run server).
            </span>
          )}
          {health.data && (
            <span className="text-green-600">
              Backend says: {health.data.status}
            </span>
          )}
        </p>
      </div>

      <div className="rounded-lg border border-line p-4">
        <h2 className="font-medium text-fg">Your account</h2>
        <SignedOut>
          <p className="mt-1 text-sm text-muted">
            Not signed in. Use the profile menu, top right.
          </p>
        </SignedOut>
        <SignedIn>
          <p className="mt-3 text-sm">
            {me.isLoading && 'Loading your profile…'}
            {me.isError && (
              <span className="text-red-500">
                Signed in, but the API call failed — check CLERK_SECRET_KEY and
                DATABASE_URL on the server.
              </span>
            )}
            {me.data?.user && (
              <span className="text-green-600">
                Authenticated as {me.data.user.email} (DB id {me.data.user.id})
              </span>
            )}
          </p>
        </SignedIn>
      </div>

      <StatsSection />
    </section>
  )
}
