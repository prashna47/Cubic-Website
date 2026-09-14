import { api } from '@/lib/api'
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'

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
    </section>
  )
}
