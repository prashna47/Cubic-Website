import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { setTokenGetter } from '@/lib/api'

/**
 * Wires Clerk's session token into the axios instance so every request from
 * `api` carries `Authorization: Bearer <token>`. Renders nothing.
 */
export default function ApiAuthBridge() {
  const { getToken } = useAuth()

  useEffect(() => {
    setTokenGetter(() => getToken())
    return () => setTokenGetter(async () => null)
  }, [getToken])

  return null
}
