import { Router, raw } from 'express'
import { Webhook } from 'svix'
import { env } from '../env.js'
import { upsertUser, deleteUserByClerkId } from '../lib/users.js'

export const webhooksRouter = Router()

type ClerkEmail = { id: string; email_address: string }
type ClerkUserData = {
  id: string
  email_addresses?: ClerkEmail[]
  primary_email_address_id?: string
  first_name?: string | null
  last_name?: string | null
  image_url?: string | null
}
type ClerkEvent = { type: string; data: ClerkUserData }

/**
 * POST /api/webhooks/clerk
 * Keeps the local User table in sync with Clerk (create / update / delete).
 * Configure in Clerk Dashboard > Webhooks; raw body + svix signature required.
 */
webhooksRouter.post(
  '/clerk',
  raw({ type: 'application/json' }),
  async (req, res, next) => {
    if (!env.CLERK_WEBHOOK_SIGNING_SECRET) {
      return res.status(501).json({ error: 'Webhook not configured' })
    }

    const svixId = req.header('svix-id')
    const svixTimestamp = req.header('svix-timestamp')
    const svixSignature = req.header('svix-signature')
    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(400).json({ error: 'Missing svix headers' })
    }

    let evt: ClerkEvent
    try {
      const wh = new Webhook(env.CLERK_WEBHOOK_SIGNING_SECRET)
      evt = wh.verify((req.body as Buffer).toString('utf8'), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as unknown as ClerkEvent
    } catch {
      return res.status(400).json({ error: 'Invalid signature' })
    }

    try {
      const { type, data } = evt
      if (type === 'user.created' || type === 'user.updated') {
        const email =
          data.email_addresses?.find(
            (e) => e.id === data.primary_email_address_id,
          )?.email_address ?? data.email_addresses?.[0]?.email_address
        const name =
          [data.first_name, data.last_name].filter(Boolean).join(' ') || null
        if (email) {
          await upsertUser({
            clerkId: data.id,
            email,
            name,
            avatarUrl: data.image_url ?? null,
          })
        }
      } else if (type === 'user.deleted') {
        await deleteUserByClerkId(data.id)
      }
      res.json({ received: true })
    } catch (err) {
      next(err)
    }
  },
)
