import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().min(1), // pooled connection (app)
  DIRECT_URL: z.string().min(1), // direct connection (migrations); same as DATABASE_URL if no pooler
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().optional().default(''),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  // Google Sheet holding the job links (must be shared as "anyone with the link can view").
  JOBS_SHEET_ID: z.string().default('1sR3SRYNhqqJYTBfm82ESHS3hvPyWFBHxb_HKKhwFsa8'),
  JOBS_SHEET_GID: z.string().default('0'),
  BLOCKLIST_SHEET_GID: z.string().default('1401399086'),
  // Looked up by name because the approval script creates this tab itself. Google
  // serves the first tab if the name is missing; the header check below covers that.
  INTERVIEWS_SHEET_NAME: z.string().default('Interview Booking'),
  CANDIDATES_SHEET_GID: z.string().default('1628186362'),
  // Apps Script web app that appends booking requests to the "Booking Requests" tab.
  BOOKING_WEBHOOK_URL: z.string().default(''),
  BOOKING_WEBHOOK_TOKEN: z.string().default(''),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export const webhookEnabled = env.CLERK_WEBHOOK_SIGNING_SECRET.length > 0
