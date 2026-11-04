import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import LandingBackground from '@/components/LandingBackground'
import ProfileMenu from '@/components/ProfileMenu'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
    isActive
      ? 'brand-gloss'
      : 'text-muted hover:text-fg hover:bg-line/60',
  ].join(' ')

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'block rounded-md px-3 py-2.5 text-base font-medium transition-colors',
    isActive
      ? 'brand-gloss'
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
        <nav className="mx-auto flex max-w-7xl items-center gap-2 px-5 py-3 sm:px-8">
          <Link
            to="/"
            aria-label="Cubic Alpha home"
            className="mr-auto inline-flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:gap-3"
          >
            <img
              src="/brand/ruby-cube-logo.svg"
              alt=""
              width="40"
              height="44"
              className="h-10 w-10 object-contain sm:h-12 sm:w-12"
            />
            <img
              src="/brand/cubic-alpha-red-wordmark.svg"
              alt="Cubic Alpha"
              width="124"
              height="22"
              className="h-auto w-36 sm:w-44"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-2 sm:flex">
            <NavLink to="/" end className={linkClass}>
              Home
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
            <div className="mx-auto max-w-7xl space-y-1 pt-2">
              <NavLink to="/" end className={mobileLinkClass}>
                Home
              </NavLink>
              <NavLink to="/services" className={mobileLinkClass}>
                Services
              </NavLink>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-4 sm:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 text-sm text-muted">
          &copy; {new Date().getFullYear()} Cubic Alpha. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
