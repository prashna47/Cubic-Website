import { clerkClient } from '@clerk/express'
import type { NextFunction, Request, Response } from 'express'
import { env } from '../env.js'
import { clerkUserId, requireApiAuth } from './auth.js'

const allowlist = env.ADMIN_EMAILS.split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

if (allowlist.length === 0) {
  console.warn(
    'ADMIN_EMAILS is not set: any signed-in user can open the Application ' +
      'Tracker, which includes candidates’ home addresses. Set ADMIN_EMAILS ' +
      'in server/.env to restrict it.',
  )
}

/**
 * Sign-in plus an email allowlist (ADMIN_EMAILS). With no allowlist configured,
 * falls back to "any signed-in user" (see the startup warning above) so the
 * route still works before that's set up.
 */
export const requireAdmin = [
  requireApiAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    if (allowlist.length === 0) {
      next()
      return
    }
    try {
      const user = await clerkClient.users.getUser(clerkUserId(req))
      const email = (
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        ''
      ).toLowerCase()
      if (email && allowlist.includes(email)) {
        next()
        return
      }
      res.status(403).json({ error: 'forbidden', message: 'Admin access only.' })
    } catch (err) {
      next(err)
    }
  },
]
