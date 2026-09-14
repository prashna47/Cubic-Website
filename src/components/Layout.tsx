import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import LandingBackground from '@/components/LandingBackground'
import ProfileMenu from '@/components/ProfileMenu'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand text-brand-fg'
      : 'text-muted hover:text-fg hover:bg-line/60',
  ].join(' ')

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'block rounded-md px-3 py-2.5 text-base font-medium transition-colors',
    isActive
      ? 'bg-brand text-brand-fg'
      : 'text-muted hover:text-fg hover:bg-line/60',
  ].join(' ')

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  // Ambient background + dark palette on every page.
  useEffect(() => {
    document.body.classList.add('landing')
    return () => document.body.classList.remove('landing')
  }, [])

  // Close the mobile menu on navigation.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <div className="min-h-svh flex flex-col">
      <LandingBackground />
      <header className="border-b border-line">
        <nav className="mx-auto flex max-w-5xl items-center gap-2 px-2 py-3">
          <span className="mr-auto font-semibold text-fg">
            CUBIC&nbsp;ALPHA&nbsp;TEAM
          </span>

          {/* Desktop nav */}
          <div className="hidden items-center gap-2 sm:flex">
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/about" className={linkClass}>
              About
            </NavLink>
            <NavLink to="/services" className={linkClass}>
              Services
            </NavLink>
          </div>
          <div className="ml-1 hidden sm:block">
            <ProfileMenu />
          </div>

          {/* Mobile: profile stays visible, links collapse behind a toggle */}
          <div className="flex items-center gap-2 sm:hidden">
            <ProfileMenu />
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:bg-line/60 hover:text-fg"
            >
              {menuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="border-t border-line px-2 pb-3 sm:hidden">
            <div className="mx-auto max-w-5xl space-y-1 pt-2">
              <NavLink to="/" end className={mobileLinkClass}>
                Home
              </NavLink>
              <NavLink to="/about" className={mobileLinkClass}>
                About
              </NavLink>
              <NavLink to="/services" className={mobileLinkClass}>
                Services
              </NavLink>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-2 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-5xl px-2 py-6 text-sm text-muted">
          Built with React + Vite &middot; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}
