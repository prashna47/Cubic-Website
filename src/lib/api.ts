import axios from 'axios'

/**
 * Central HTTP client.
 *
 * In development, requests to "/api/*" are proxied to the backend by Vite
 * (see vite.config.ts). In production, set VITE_API_URL to the deployed API
 * origin, e.g. https://api.example.com
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach the auth token (if you store one) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
