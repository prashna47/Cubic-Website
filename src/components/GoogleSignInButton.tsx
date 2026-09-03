import { useEffect, useRef, useState } from 'react'

const GSI_SRC = 'https://accounts.google.com/gsi/client'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

let scriptPromise: Promise<void> | null = null

function loadGsiScript(): Promise<void> {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const script = document.createElement('script')
    script.src = GSI_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google script'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

type Props = {
  onCredential: (credential: string) => void
  text?: 'signin_with' | 'continue_with'
}

export default function GoogleSignInButton({
  onCredential,
  text = 'continue_with',
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!CLIENT_ID) {
      setError('Google sign-in is not configured yet.')
      return
    }
    let cancelled = false

    loadGsiScript()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => onCredential(response.credential),
        })
        window.google.accounts.id.renderButton(ref.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          logo_alignment: 'center',
          width: 320,
        })
      })
      .catch(() => setError('Could not load Google sign-in.'))

    return () => {
      cancelled = true
    }
  }, [onCredential, text])

  if (error) {
    return (
      <p className="text-center text-xs text-muted">
        {error}
        {!CLIENT_ID && (
          <>
            {' '}
            Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env</code>.
          </>
        )}
      </p>
    )
  }

  return <div ref={ref} className="flex justify-center" />
}
