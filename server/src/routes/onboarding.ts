import { Router } from 'express'
import { DriveAccessError, getOnboardingDocs } from '../lib/onboarding.js'

export const onboardingRouter = Router()

onboardingRouter.get('/onboarding-docs', async (req, res, next) => {
  try {
    res.json({
      documents: await getOnboardingDocs(req.query.fresh === '1'),
      updatedAt: new Date().toISOString(),
    })
  } catch (err) {
    if (err instanceof DriveAccessError) {
      res.status(503).json({ error: 'drive_private', message: err.message })
      return
    }
    next(err)
  }
})
