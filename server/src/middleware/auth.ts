import { getAuth } from '@clerk/express'
import type { NextFunction, Request, Response } from 'express'

// Clerk's clerkMiddleware() (mounted in index.ts) populates the auth context.
// Use requireApiAuth on any route that needs a signed-in user.

/**
 * Rejects an unauthenticated request with a plain 401 JSON body.
 *
 * `@clerk/express`'s own `requireAuth()` is deprecated and — even given a
 * JSON request — redirects unauthenticated requests to `/` instead of
 * returning 401. That's fine for a page load, but an API route following the
 * redirect gets a stray 404/200 HTML response instead of an error it can
 * show the user. This is Clerk's own suggested replacement: `clerkMiddleware()`
 * + `getAuth()`.
 */
export function requireApiAuth(req: Request, res: Response, next: NextFunction) {
  if (!getAuth(req).userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Sign in required.' })
    return
  }
  next()
}

/** The authenticated Clerk user id, or throw. Use inside requireApiAuth routes. */
export function clerkUserId(req: Request): string {
  const { userId } = getAuth(req)
  if (!userId) throw new Error('Not authenticated')
  return userId
}
