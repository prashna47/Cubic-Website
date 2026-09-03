import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '@/lib/api'
import type { AuthResponse, User } from '@/types/auth'

const TOKEN_KEY = 'token'

type AuthContextValue = {
  user: User | null
  loading: boolean
  register: (name: string, email: string, password: string) => Promise<void>
  loginWithPassword: (email: string, password: string) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // On first load, if we have a token, fetch the current user.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get<{ user: User }>('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  const applyAuth = useCallback((data: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await api.post<AuthResponse>('/auth/register', {
        name,
        email,
        password,
      })
      applyAuth(res.data)
    },
    [applyAuth],
  )

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
      })
      applyAuth(res.data)
    },
    [applyAuth],
  )

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      const res = await api.post<AuthResponse>('/auth/google', { credential })
      applyAuth(res.data)
    },
    [applyAuth],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      register,
      loginWithPassword,
      loginWithGoogle,
      logout,
    }),
    [user, loading, register, loginWithPassword, loginWithGoogle, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
