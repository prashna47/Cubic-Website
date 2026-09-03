import type { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../lib/jwt.js'

// Adds `req.userId` when a valid Bearer token is present.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  try {
    const { sub } = verifyToken(header.slice(7))
    req.userId = sub
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
