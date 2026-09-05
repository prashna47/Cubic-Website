import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react'
import { api } from '@/lib/api'

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

  // Slow-moving black → grey gradient background, landing page only.
  useEffect(() => {
    document.body.classList.add('landing')
    return () => document.body.classList.remove('landing')
  }, [])

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-fg">Welcome 👋</h1>
        <p className="mt-2 text-muted">
          Edit{' '}
          <code className="rounded bg-line/60 px-1.5 py-0.5 text-sm">
            src/pages/Home.tsx
          </code>{' '}
          and save.
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
            {me.data && (
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
