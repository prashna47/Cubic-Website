import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { OAuth2Client } from 'google-auth-library'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { signToken } from '../lib/jwt.js'
import { env, googleEnabled } from '../env.js'
import { requireAuth } from '../middleware/auth.js'

export const authRouter = Router()

type PublicUser = {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  createdAt: Date
}

function toPublicUser(u: {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  createdAt: Date
}): PublicUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt,
  }
}

/** POST /api/auth/register */
const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
})

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message })
  }
  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'An account with that email exists' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  })

  return res.status(201).json({
    token: signToken(user.id),
    user: toPublicUser(user),
  })
})

/** POST /api/auth/login */
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
})

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Email and password are required' })
  }
  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  return res.json({ token: signToken(user.id), user: toPublicUser(user) })
})

/** POST /api/auth/google  — body: { credential: <Google ID token> } */
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID)
const googleSchema = z.object({ credential: z.string().min(1) })

authRouter.post('/google', async (req, res) => {
  if (!googleEnabled) {
    return res.status(501).json({ error: 'Google sign-in is not configured' })
  }
  const parsed = googleSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Missing Google credential' })
  }

  let payload
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: parsed.data.credential,
      audience: env.GOOGLE_CLIENT_ID,
    })
    payload = ticket.getPayload()
  } catch {
    return res.status(401).json({ error: 'Could not verify Google account' })
  }

  if (!payload?.email || !payload.sub) {
    return res.status(401).json({ error: 'Google account missing email' })
  }

  const email = payload.email.toLowerCase()
  const googleId = payload.sub
  const name = payload.name ?? email.split('@')[0]
  const avatarUrl = payload.picture ?? null

  // Link to an existing account by googleId, else by email, else create.
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
  })

  if (!user) {
    user = await prisma.user.create({
      data: { email, name, googleId, avatarUrl },
    })
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId, avatarUrl: user.avatarUrl ?? avatarUrl },
    })
  }

  return res.json({ token: signToken(user.id), user: toPublicUser(user) })
})

/** GET /api/auth/me */
authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })
  return res.json({ user: toPublicUser(user) })
})
