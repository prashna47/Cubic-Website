import { Link } from 'react-router-dom'

export default function GetStarted() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-fg">Get Started</h1>
      <p className="text-muted">This page is coming soon.</p>
      <span className="rounded-full border border-line px-4 py-1.5 text-sm text-muted">
        Coming soon
      </span>
      <Link to="/" className="mt-4 text-sm text-brand hover:underline">
        ← Back to home
      </Link>
    </div>
  )
}
