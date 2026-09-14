import { CATEGORY_ORDER, SERVICES } from '@/data/services'
import ServiceCard from '@/components/ServiceCard'

export default function Services() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-semibold text-fg">Services</h1>
        <p className="mt-2 text-muted">
          Job search, bookings, and support resources — all in one place.
        </p>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const items = SERVICES.filter((s) => s.category === category)
        if (items.length === 0) return null
        return (
          <section key={category}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
              {category}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((service) => (
                <ServiceCard key={service.slug} service={service} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
