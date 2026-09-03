import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

type HealthResponse = { status: string }

async function fetchHealth() {
  const { data } = await api.get<HealthResponse>('/health')
  return data
}

export default function Home() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  })

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-fg">Welcome 👋</h1>
        <p className="mt-2 text-muted">
          This is your React starter. Edit{' '}
          <code className="rounded bg-line/60 px-1.5 py-0.5 text-sm">
            src/pages/Home.tsx
          </code>{' '}
          and save.
        </p>
      </div>

      <div className="rounded-lg border border-line p-4">
        <h2 className="font-medium text-fg">Backend status</h2>
        <p className="mt-1 text-sm text-muted">
          Calls <code>GET /api/health</code> through TanStack Query.
        </p>
        <p className="mt-3 text-sm">
          {isLoading && 'Checking…'}
          {isError && (
            <span className="text-red-500">
              No backend yet — start your API on port 4000.
            </span>
          )}
          {data && (
            <span className="text-green-600">Backend says: {data.status}</span>
          )}
        </p>
      </div>
    </section>
  )
}
