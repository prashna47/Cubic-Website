import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'

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

/** Signed-out: our icon + hover/click dropdown. Signed-in: Clerk's UserButton. */
export default function ProfileMenu() {
  return (
    <>
      <SignedOut>
        <SignedOutMenu />
      </SignedOut>
      <SignedIn>
        <UserButton appearance={{ elements: { avatarBox: 'h-9 w-9' } }} />
      </SignedIn>
    </>
  )
}

function SignedOutMenu() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  // A click "pins" the menu open so it survives the pointer leaving.
  const pinned = useRef(false)

  const clearCloseTimer = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }
  const close = () => {
    clearCloseTimer()
    pinned.current = false
    setOpen(false)
  }
  const handleEnter = () => {
    clearCloseTimer()
    setOpen(true)
  }
  const handleLeave = () => {
    if (pinned.current) return
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }
  const handleTriggerClick = () => {
    if (open && pinned.current) {
      close()
    } else {
      clearCloseTimer()
      pinned.current = true
      setOpen(true)
    }
  }

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
        <UserIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-line bg-bg shadow-lg"
        >
          <Link
            to="/login"
            role="menuitem"
            onClick={close}
            className="block px-4 py-2.5 text-sm font-medium text-fg hover:bg-line/60"
          >
            Log in
          </Link>
          <Link
            to="/sign-up"
            role="menuitem"
            onClick={close}
            className="block px-4 py-2.5 text-sm text-muted hover:bg-line/60 hover:text-fg"
          >
            Create account
          </Link>
        </div>
      )}
    </div>
  )
}
