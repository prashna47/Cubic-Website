import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express'
import { getApplicationTracker } from '../lib/tracker.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { SheetAccessError } from '../lib/sheet.js'

export const trackerRouter = Router()

trackerRouter.get(
  '/application-tracker',
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        candidates: await getApplicationTracker(req.query.fresh === '1'),
        updatedAt: new Date().toISOString(),
      })
    } catch (err) {
      if (err instanceof SheetAccessError) {
        res.status(503).json({ error: 'sheet_private', message: err.message })
        return
      }
      next(err)
    }
  },
)
