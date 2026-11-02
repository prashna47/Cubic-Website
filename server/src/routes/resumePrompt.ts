import { Router } from 'express'
import { getResumePrompt } from '../lib/resumePrompt.js'
import { SheetAccessError } from '../lib/sheet.js'

export const resumePromptRouter = Router()

resumePromptRouter.get('/resume-prompt', async (req, res, next) => {
  try {
    res.json({
      prompt: await getResumePrompt(req.query.fresh === '1'),
      updatedAt: new Date().toISOString(),
    })
  } catch (err) {
    if (err instanceof SheetAccessError) {
      res.status(503).json({ error: 'sheet_private', message: err.message })
      return
    }
    next(err)
  }
})
