// Run after `npm run build`, from server/: node scripts/check-approved-users.mjs
// Reads existing configuration; never prints API keys or database credentials.
import { clerkClient } from '@clerk/express'
import { env } from '../dist/env.js'
import { getTable } from '../dist/lib/sheet.js'
import { approvedEmailsFromTable } from '../dist/middleware/serviceAccess.js'

try {
  const emails = [
    ...approvedEmailsFromTable(
      await getTable({ name: env.APPROVED_USERS_SHEET_NAME }, true),
    ),
  ]
  console.log(
    `Approval tab: ${env.APPROVED_USERS_SHEET_NAME}; ${emails.length} approved emails`,
  )
  for (const email of emails) {
    const result = await clerkClient.users.getUserList({
      emailAddress: [email],
      limit: 100,
    })
    const user = result.data.find(
      (item) => item.primaryEmailAddress?.emailAddress.toLowerCase() === email,
    )
    let status
    if (!result.data.length)
      status = 'No account yet: create an account with this email first.'
    else if (!user)
      status =
        'Account exists: set this approved address as the verified primary email.'
    else if (user.banned || user.locked)
      status = 'Account is banned or locked in Clerk.'
    else if (user.primaryEmailAddress.verification?.status !== 'verified')
      status = 'Account exists: email verification is required.'
    else status = 'Verified account and approved for Services.'
    console.log(`${email}: ${status}`)
  }
} catch {
  console.error(
    'Unable to check approval list or Clerk accounts. Check network access and server configuration.',
  )
  process.exitCode = 1
}
