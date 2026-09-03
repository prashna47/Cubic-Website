import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().optional().default(''),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export const webhookEnabled = env.CLERK_WEBHOOK_SIGNING_SECRET.length > 0
