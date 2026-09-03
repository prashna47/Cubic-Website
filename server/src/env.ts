import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
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
export const googleEnabled = env.GOOGLE_CLIENT_ID.length > 0
