import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import type { ReactNode } from 'react'
import App from '@/App.tsx'
import { queryClient } from '@/lib/queryClient'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// ClerkProvider needs React Router's navigate, so it lives inside <BrowserRouter>.
function ClerkWithRouter({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  )
}

function MissingKeyNotice() {
  return (
    <div
      style={{
        maxWidth: 560,
        margin: '10vh auto',
        padding: 24,
        font: '14px/1.6 system-ui',
      }}
    >
      <h1 style={{ fontSize: 18 }}>Clerk isn’t configured yet</h1>
      <p>
        Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> to <code>.env</code> (get it
        from the Clerk dashboard → API keys), then restart{' '}
        <code>npm run dev</code>.
      </p>
      <p>See the README “Authentication (Clerk)” section for the full setup.</p>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ClerkWithRouter>
            <App />
          </ClerkWithRouter>
        </BrowserRouter>
      </QueryClientProvider>
    ) : (
      <MissingKeyNotice />
    )}
  </StrictMode>,
)
