import express from 'express'
import cors from 'cors'
import { env, googleEnabled } from './env.js'
import { authRouter } from './routes/auth.js'

const app = express()

app.use(cors({ origin: env.CLIENT_URL }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', googleEnabled })
})

app.use('/api/auth', authRouter)

// Fallback 404 for unknown API routes.
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  },
)

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`)
  console.log(`Google sign-in: ${googleEnabled ? 'enabled' : 'disabled'}`)
})
