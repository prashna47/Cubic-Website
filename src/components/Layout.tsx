import ProfileMenu from '@/components/ProfileMenu'
import { NavLink, Outlet } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand text-brand-fg'
      : 'text-muted hover:text-fg hover:bg-line/60',
  ].join(' ')

export default function Layout() {
  return (
    <div className="min-h-svh flex flex-col">
      <header className="border-b border-line">
        <nav className="mx-auto max-w-5xl flex items-center gap-2 px-4 py-3">
          <span className="mr-auto font-semibold text-fg">
            CUBIC&nbsp;ALPHA&nbsp;TEAM
          </span>
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            About
          </NavLink>
          <div className="ml-1">
            <ProfileMenu />
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted">
          Built with React + Vite &middot; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}
