import type { RequestHandler } from 'express'

/** Per-process fixed windows, bounded memory, no client-supplied IP headers. */
export function createRateLimiter({
  limit,
  windowMs = 60_000,
  key = (req) => req.ip ?? 'unknown',
  now = Date.now,
}: {
  limit: number
  windowMs?: number
  key?: (req: Parameters<RequestHandler>[0]) => string
  now?: () => number
}): RequestHandler {
  const windows = new Map<string, { count: number; resetAt: number }>()
  let cleanupAt = 0
  return (req, res, next) => {
    const time = now()
    if (time >= cleanupAt) {
      for (const [id, hit] of windows)
        if (hit.resetAt <= time) windows.delete(id)
      cleanupAt = time + windowMs
    }
    const id = key(req)
    let hit = windows.get(id)
    if (!hit || hit.resetAt <= time) {
      if (!hit && windows.size >= 10_000) {
        res.setHeader('Retry-After', Math.ceil(windowMs / 1000))
        res
          .status(429)
          .json({
            error: 'rate_limited',
            message: 'Server busy. Please try again shortly.',
          })
        return
      }
      hit = { count: 0, resetAt: time + windowMs }
      windows.set(id, hit)
    }
    hit.count++
    res.setHeader('RateLimit-Limit', limit)
    res.setHeader('RateLimit-Remaining', Math.max(0, limit - hit.count))
    res.setHeader('RateLimit-Reset', Math.ceil((hit.resetAt - time) / 1000))
    if (hit.count > limit) {
      res.setHeader('Retry-After', Math.ceil((hit.resetAt - time) / 1000))
      res
        .status(429)
        .json({
          error: 'rate_limited',
          message: 'Too many requests. Please try again shortly.',
        })
      return
    }
    next()
  }
}
