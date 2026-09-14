import { Link, useParams } from 'react-router-dom'
import { SERVICES } from '@/data/services'
import NotFound from '@/pages/NotFound'

export default function ServiceDetail() {
  const { slug } = useParams()
  const service = SERVICES.find((s) => s.slug === slug)

  if (!service) return <NotFound />

  const Icon = service.icon

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-line text-brand">
        <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-semibold text-fg">{service.title}</h1>
      <p className="text-muted">{service.description}</p>
      <span className="rounded-full border border-line px-4 py-1.5 text-sm text-muted">
        Coming soon
      </span>
      <Link to="/services" className="mt-4 text-sm text-brand hover:underline">
        ← Back to Services
      </Link>
    </div>
  )
}
