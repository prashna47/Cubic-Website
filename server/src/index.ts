import express from 'express'
import cors from 'cors'
import { clerkMiddleware } from '@clerk/express'
import { env, webhookEnabled } from './env.js'
import { usersRouter } from './routes/users.js'
import { interviewsRouter } from './routes/interviews.js'
import { jobsRouter } from './routes/jobs.js'
import { feedbackRouter } from './routes/feedback.js'
import { onboardingRouter } from './routes/onboarding.js'
import { resumePromptRouter } from './routes/resumePrompt.js'
import { trackerRouter } from './routes/tracker.js'
import { webhooksRouter } from './routes/webhooks.js'
import { requireApprovedServices } from './middleware/serviceAccess.js'
import { createRateLimiter } from './middleware/rateLimit.js'
import { clerkUserId } from './middleware/auth.js'

const app = express()
app.disable('x-powered-by')
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Cache-Control', 'no-store')
  next()
})

app.use(cors({ origin: env.CLIENT_URL }))
app.use('/api', createRateLimiter({ limit: 120 }))
const submissionLimit = createRateLimiter({ limit: 10, key: clerkUserId })

// Webhooks need the raw body, so mount them before express.json().
app.use('/api/webhooks', webhooksRouter)

// Interview requests carry a resume, so they get their own body limit (see route).
app.use((req, res, next) =>
  req.path === '/api/interview-requests'
    ? next()
    : express.json()(req, res, next),
)

// Reads the Clerk session from the request (Authorization header / cookie).
app.use(clerkMiddleware())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', webhookEnabled })
})

app.use('/api', usersRouter)
// All service endpoints, including direct API requests, require approval.
app.use('/api', requireApprovedServices)
app.get('/api/service-access', (_req, res) => res.json({ approved: true }))
app.use('/api', (req, res, next) =>
  ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
    ? submissionLimit(req, res, next)
    : next(),
)
app.use('/api', jobsRouter)
app.use('/api', interviewsRouter)
app.use('/api', trackerRouter)
app.use('/api', resumePromptRouter)
app.use('/api', onboardingRouter)
app.use('/api', feedbackRouter)

// Fallback 404 for unknown API routes.
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction,
  ) => {
    console.error(err)
    const type = (err as { type?: string })?.type
    if (type === 'entity.too.large') {
      res
        .status(413)
        .json({
          error: 'payload_too_large',
          message: 'Uploaded request is too large.',
        })
      return
    }
    if (type === 'entity.parse.failed') {
      res
        .status(400)
        .json({ error: 'invalid_json', message: 'Invalid request body.' })
      return
    }
    res.status(500).json({ error: 'Internal server error' })
  },
)

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`)
  console.log(`Clerk webhook: ${webhookEnabled ? 'enabled' : 'disabled'}`)
})
