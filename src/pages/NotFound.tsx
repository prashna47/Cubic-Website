import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="space-y-4 text-center">
      <h1 className="text-4xl font-semibold text-fg">404</h1>
      <p className="text-muted">That page doesn't exist.</p>
      <Link to="/" className="inline-block text-brand underline">
        Go home
      </Link>
    </section>
  )
}
