import { useEffect, useRef } from 'react'
import { useAuth, useClerk } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'

export default function RequireServiceAccess() {
  const { isLoaded, isSignedIn, userId, sessionId, getToken } = useAuth()
  const { signOut } = useClerk()
  const location = useLocation()
  const navigate = useNavigate()
  const dialog = useRef<HTMLDialogElement>(null)
  const access = useQuery({
    queryKey: ['service-access', userId, sessionId],
    enabled: isLoaded && !!isSignedIn,
    queryFn: async () => {
      const token = await getToken()
      return (
        await api.get<{ approved: boolean }>('/service-access', {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).data
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
  const status = (access.error as { response?: { status?: number } } | null)
    ?.response?.status
  const denied = status === 403
  useEffect(() => {
    if (denied) {
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'service-access',
      })
      if (!dialog.current?.open) dialog.current?.showModal()
    }
  }, [denied])

  if (!isLoaded)
    return (
      <p role="status" className="py-12 text-center text-muted">
        Loading sign-in…
      </p>
    )
  const returnTo = encodeURIComponent(location.pathname + location.search)
  if (!isSignedIn || status === 401) {
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />
  }
  if (denied) {
    return (
      <dialog
        ref={dialog}
        aria-labelledby="service-access-title"
        aria-describedby="service-access-description"
        onCancel={(event) => {
          event.preventDefault()
          navigate('/')
        }}
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-line bg-bg p-7 text-fg shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
      >
        <h1 id="service-access-title" className="text-xl font-semibold">
          Unverified user cannot access services
        </h1>
        <p id="service-access-description" className="mt-3 text-sm text-muted">
          Your account needs approval from the Cubic Alpha team before you can
          use Services.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => navigate('/')}
            className="brand-gloss inline-flex h-11 w-full items-center justify-center rounded-full border px-4 text-sm font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Back to home
          </button>
          <button
            onClick={() =>
              signOut({ redirectUrl: '/login?returnTo=%2Fservices' })
            }
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-line px-4 text-sm font-medium whitespace-nowrap text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Use another account
          </button>
        </div>
      </dialog>
    )
  }
  if (access.isPending)
    return (
      <p role="status" className="py-12 text-center text-muted">
        Checking service access…
      </p>
    )
  if (access.isError || !access.data?.approved) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-line p-8 text-center"
      >
        <h1 className="text-xl font-semibold text-fg">
          Unable to verify service access
        </h1>
        <p className="mt-2 text-muted">Please try again shortly.</p>
        <button
          onClick={() => access.refetch()}
          className="mt-5 rounded-full border border-brand px-5 py-2 text-brand"
        >
          Try again
        </button>
      </div>
    )
  }
  return <Outlet key={sessionId} />
}
