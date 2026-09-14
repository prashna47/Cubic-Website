import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * React Router keeps the browser's scroll position across client-side
 * navigations (unlike a normal page load), so without this, clicking a link
 * from partway down a page lands you partway down the next one too.
 * Scrolls to the top on every route change.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
