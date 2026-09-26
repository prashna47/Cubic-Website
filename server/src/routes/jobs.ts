import { Router, type RequestHandler } from 'express'
import { getDoNotApply, getJobs, SheetAccessError } from '../lib/jobs.js'

export const jobsRouter = Router()

function handle<T>(load: () => Promise<T>): RequestHandler {
  return async (_req, res, next) => {
    try {
      res.json({ ...(await load()), updatedAt: new Date().toISOString() })
    } catch (err) {
      if (err instanceof SheetAccessError) {
        res.status(503).json({ error: 'sheet_private', message: err.message })
        return
      }
      next(err)
    }
  }
}

jobsRouter.get('/jobs', handle(async () => ({ jobs: await getJobs() })))
jobsRouter.get(
  '/do-not-apply',
  handle(async () => ({ companies: await getDoNotApply() })),
)
