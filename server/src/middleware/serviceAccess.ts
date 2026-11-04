import type { RequestHandler } from 'express'
import { clerkClient } from '@clerk/express'
import { env } from '../env.js'
import { getTable } from '../lib/sheet.js'
import { clerkUserId, requireApiAuth } from './auth.js'

export const ACCESS_DENIED = 'Unverified user cannot access services'

type Identity = {
  primaryEmailAddress: {
    emailAddress: string
    verification: { status: string } | null
  } | null
}

export function approvedEmailsFromTable(table: string[][]): Set<string> {
  const column =
    table[0]?.findIndex((cell) => /^email(?: address)?$/i.test(cell.trim())) ??
    -1
  // Google can return the first tab for a missing named tab. Never use it.
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (table.length === 0) return new Set()
  if (column < 0 && !emailPattern.test(table[0]?.[0]?.trim() ?? '')) {
    throw new Error(
      'Approval tab must contain an Email column or email addresses in column A.',
    )
  }
  return new Set(
    (column < 0 ? table : table.slice(1))
      .map((row) => (row[Math.max(0, column)] ?? '').trim().toLowerCase())
      .filter((email) => emailPattern.test(email)),
  )
}

export function createServiceApprovalCheck(deps: {
  getUser: (id: string) => Promise<Identity>
  getUserId: typeof clerkUserId
  getApprovedEmails: () => Promise<Set<string>>
}): RequestHandler {
  return async (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store')
    try {
      const user = await deps.getUser(deps.getUserId(req))
      const primary = user.primaryEmailAddress
      if (!primary || primary.verification?.status !== 'verified') {
        res
          .status(403)
          .json({ error: 'services_unverified', message: ACCESS_DENIED })
        return
      }
      const approved = await deps.getApprovedEmails()
      if (!approved.has(primary.emailAddress.trim().toLowerCase())) {
        res
          .status(403)
          .json({ error: 'services_unverified', message: ACCESS_DENIED })
        return
      }
      // Continue only after both identity and approval have been checked.
      next()
    } catch {
      res.status(503).json({
        error: 'approval_unavailable',
        message: 'Unable to verify service access. Please try again shortly.',
      })
    }
  }
}

const check = createServiceApprovalCheck({
  getUser: (id) => clerkClient.users.getUser(id),
  getUserId: clerkUserId,
  getApprovedEmails: async () =>
    approvedEmailsFromTable(
      await getTable({ name: env.APPROVED_USERS_SHEET_NAME }, true),
    ),
})

export const requireApprovedServices: RequestHandler[] = [requireApiAuth, check]
