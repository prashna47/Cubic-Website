import { Router, type RequestHandler } from 'express'
import { getDoNotApply, getJobs } from '../lib/jobs.js'
import { SheetAccessError, SheetTabMissingError } from '../lib/sheet.js'

export const jobsRouter = Router()

function handle<T>(load: (fresh: boolean) => Promise<T>): RequestHandler {
  return async (req, res, next) => {
    try {
      // ?fresh=1 (manual refresh) skips the short server-side cache.
      res.json({ ...(await load(req.query.fresh === '1')), updatedAt: new Date().toISOString() })
    } catch (err) {
      if (err instanceof SheetAccessError) {
        res.status(503).json({ error: 'sheet_private', message: err.message })
        return
      }
      if (err instanceof SheetTabMissingError) {
        res.status(503).json({ error: 'tab_missing', message: err.message })
        return
      }
      next(err)
    }
  }
}

jobsRouter.get('/jobs', handle(async (fresh) => ({ jobs: await getJobs(fresh) })))
jobsRouter.get(
  '/do-not-apply',
  handle(async (fresh) => ({ companies: await getDoNotApply(fresh) })),
)
