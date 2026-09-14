import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Service } from '@/data/services'

export default function ServiceCard({ service }: { service: Service }) {
  const Icon = service.icon
  return (
    <Link
      to={`/services/${service.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-line p-5 backdrop-blur-sm transition-colors hover:border-brand/50 hover:bg-line/10"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-muted transition-colors group-hover:border-brand/50 group-hover:text-brand">
        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div>
        <h3 className="font-medium text-fg">{service.title}</h3>
        <p className="mt-1 text-sm text-muted">{service.description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
        Open
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </Link>
  )
}
