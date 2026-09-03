import express from 'express'
import cors from 'cors'
import { clerkMiddleware } from '@clerk/express'
import { env, webhookEnabled } from './env.js'
import { usersRouter } from './routes/users.js'
import { webhooksRouter } from './routes/webhooks.js'

const app = express()

app.use(cors({ origin: env.CLIENT_URL }))

// Webhooks need the raw body, so mount them before express.json().
app.use('/api/webhooks', webhooksRouter)

app.use(express.json())

// Reads the Clerk session from the request (Authorization header / cookie).
app.use(clerkMiddleware())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', webhookEnabled })
})

app.use('/api', usersRouter)

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
    res.status(500).json({ error: 'Internal server error' })
  },
)

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`)
  console.log(`Clerk webhook: ${webhookEnabled ? 'enabled' : 'disabled'}`)
})
