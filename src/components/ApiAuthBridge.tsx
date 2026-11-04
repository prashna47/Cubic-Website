import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { setTokenGetter } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'

/**
 * Wires Clerk's session token into the axios instance so every request from
 * `api` carries `Authorization: Bearer <token>`. Renders nothing.
 */
export default function ApiAuthBridge() {
  const { getToken, userId, sessionId } = useAuth()

  useEffect(() => {
    setTokenGetter(() => getToken())
    return () => setTokenGetter(async () => null)
  }, [getToken])
  useEffect(() => {
    // Keep the current session's approval check in flight; remove private data.
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== 'service-access',
    })
  }, [userId, sessionId])

  return null
}
