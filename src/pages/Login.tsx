import { useCallback, useEffect, useState } from 'react'
import {
  Link,
  useNavigate,
  useSearchParams,
  type Location,
  useLocation,
} from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '@/context/AuthContext'
import GoogleSignInButton from '@/components/GoogleSignInButton'

function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (
      (err.response?.data as { error?: string } | undefined)?.error ??
      'Something went wrong. Please try again.'
    )
  }
  return 'Something went wrong. Please try again.'
}

export default function Login() {
  const { user, loginWithPassword, register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as Location & {
    state?: { from?: { pathname: string } }
  }
  const [params] = useSearchParams()

  const [mode, setMode] = useState<'login' | 'register'>(
    params.get('mode') === 'register' ? 'register' : 'login',
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from?.pathname ?? '/'

  // Already signed in — don't show the form.
  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true })
  }, [user, navigate, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'register') {
        await register(name.trim(), email.trim(), password)
      } else {
        await loginWithPassword(email.trim(), password)
      }
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = useCallback(
    async (credential: string) => {
      setError(null)
      try {
        await loginWithGoogle(credential)
        navigate(redirectTo, { replace: true })
      } catch (err) {
        setError(errorMessage(err))
      }
    },
    [loginWithGoogle, navigate, redirectTo],
  )

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold text-fg">
        {mode === 'register' ? 'Create your account' : 'Log in'}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {mode === 'register'
          ? 'Sign up with your email or Google.'
          : 'Welcome back. Log in with your email or Google.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === 'register' && (
          <Field
            label="Name"
            type="text"
            value={name}
            onChange={setName}
            autoComplete="name"
            required
          />
        )}
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete={
            mode === 'register' ? 'new-password' : 'current-password'
          }
          minLength={mode === 'register' ? 8 : undefined}
          required
        />

        {error && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting
            ? 'Please wait…'
            : mode === 'register'
              ? 'Create account'
              : 'Log in'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <GoogleSignInButton
        onCredential={handleGoogle}
        text={mode === 'register' ? 'signin_with' : 'continue_with'}
      />

      <p className="mt-6 text-center text-sm text-muted">
        {mode === 'register' ? (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-brand hover:underline"
            >
              Log in
            </button>
          </>
        ) : (
          <>
            New here?{' '}
            <button
              type="button"
              onClick={() => setMode('register')}
              className="text-brand hover:underline"
            >
              Create an account
            </button>
          </>
        )}
      </p>

      <p className="mt-2 text-center text-sm">
        <Link to="/" className="text-muted hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  )
}

type FieldProps = {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  required?: boolean
  minLength?: number
}

function Field({ label, onChange, ...rest }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-fg">{label}</span>
      <input
        {...rest}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      />
    </label>
  )
}
