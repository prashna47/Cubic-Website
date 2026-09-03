import { clerkClient } from '@clerk/express'
import { prisma } from './prisma.js'

type ClerkUserFields = {
  clerkId: string
  email: string
  name: string | null
  avatarUrl: string | null
}

export async function upsertUser(data: ClerkUserFields) {
  return prisma.user.upsert({
    where: { clerkId: data.clerkId },
    create: data,
    update: {
      email: data.email,
      name: data.name,
      avatarUrl: data.avatarUrl,
    },
  })
}

export async function deleteUserByClerkId(clerkId: string) {
  await prisma.user.deleteMany({ where: { clerkId } })
}

/**
 * Return the local user row for a Clerk id, creating it from Clerk on first
 * call. This is the lazy fallback for the webhook — anyone who signs in and
 * hits the API gets a row even if the webhook missed them.
 */
export async function getOrCreateUser(clerkId: string) {
  const existing = await prisma.user.findUnique({ where: { clerkId } })
  if (existing) return existing

  const cu = await clerkClient.users.getUser(clerkId)
  const email =
    cu.primaryEmailAddress?.emailAddress ?? cu.emailAddresses[0]?.emailAddress
  if (!email) throw new Error(`Clerk user ${clerkId} has no email address`)

  const name = [cu.firstName, cu.lastName].filter(Boolean).join(' ') || null

  return upsertUser({ clerkId, email, name, avatarUrl: cu.imageUrl ?? null })
}
