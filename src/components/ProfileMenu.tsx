import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export default function ProfileMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  // True once the user *clicks* the trigger — keeps the menu open even after
  // the pointer leaves (hover alone closes it again).
  const pinned = useRef(false)

  const clearCloseTimer = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }
  const close = () => {
    clearCloseTimer()
    pinned.current = false
    setOpen(false)
  }

  // Hover: open immediately, close shortly after leaving (unless pinned).
  const handleEnter = () => {
    clearCloseTimer()
    setOpen(true)
  }
  const handleLeave = () => {
    if (pinned.current) return
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }

  // Click / tap: toggle a pinned-open state (works without hover, e.g. touch).
  const handleTriggerClick = () => {
    if (open && pinned.current) {
      close()
    } else {
      clearCloseTimer()
      pinned.current = true
      setOpen(true)
    }
  }

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleLogout = () => {
    logout()
    close()
    navigate('/')
  }

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        onClick={handleTriggerClick}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:bg-line/60 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="h-full w-full rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <UserIcon />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-line bg-bg shadow-lg"
        >
          {user ? (
            <>
              <div className="border-b border-line px-4 py-3">
                <p className="truncate text-sm font-medium text-fg">
                  {user.name}
                </p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="block w-full px-4 py-2.5 text-left text-sm text-fg hover:bg-line/60"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                role="menuitem"
                onClick={close}
                className="block px-4 py-2.5 text-sm font-medium text-fg hover:bg-line/60"
              >
                Log in
              </Link>
              <Link
                to="/login?mode=register"
                role="menuitem"
                onClick={close}
                className="block px-4 py-2.5 text-sm text-muted hover:bg-line/60 hover:text-fg"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
