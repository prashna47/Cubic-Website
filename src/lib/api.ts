import axios from 'axios'

/**
 * Central HTTP client.
 *
 * In development, requests to "/api/*" are proxied to the backend by Vite
 * (see vite.config.ts). In production, set VITE_API_URL to the deployed API
 * origin, e.g. https://api.example.com
 */
export const api = axios.create({
  // `||` so an empty VITE_API_URL still falls back to the dev proxy.
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// The Clerk session-token getter is registered at runtime by <ApiAuthBridge />.
type TokenGetter = () => Promise<string | null>
let getToken: TokenGetter = async () => null

export function setTokenGetter(fn: TokenGetter) {
  getToken = fn
}

api.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
