import { getAuth } from '@clerk/express'
import type { Request } from 'express'

// Clerk's clerkMiddleware() (mounted in index.ts) populates the auth context.
// requireAuth() rejects unauthenticated requests with 401 — use it per route.
export { requireAuth } from '@clerk/express'

/** The authenticated Clerk user id, or throw. Use inside requireAuth() routes. */
export function clerkUserId(req: Request): string {
  const { userId } = getAuth(req)
  if (!userId) throw new Error('Not authenticated')
  return userId
}
