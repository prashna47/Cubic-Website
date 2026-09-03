import { Router } from 'express'
import { requireAuth, clerkUserId } from '../middleware/auth.js'
import { getOrCreateUser } from '../lib/users.js'

export const usersRouter = Router()

/**
 * GET /api/me
 * The current user's local profile row (created from Clerk on first call).
 * Add app-specific fields to the User model and return them here.
 */
usersRouter.get('/me', requireAuth(), async (req, res, next) => {
  try {
    const user = await getOrCreateUser(clerkUserId(req))
    res.json({ user })
  } catch (err) {
    next(err)
  }
})
