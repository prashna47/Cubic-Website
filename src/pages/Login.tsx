import { SignIn } from '@clerk/clerk-react'
import { useLocation } from 'react-router-dom'
import { serviceReturnTo } from '@/lib/serviceReturnTo'

export default function Login() {
  const returnTo = serviceReturnTo(useLocation().search)
  return (
    <div className="flex justify-center py-4">
      <SignIn
        routing="path"
        path="/login"
        signUpUrl={
          returnTo
            ? `/sign-up?returnTo=${encodeURIComponent(returnTo)}`
            : '/sign-up'
        }
        forceRedirectUrl={returnTo}
        fallbackRedirectUrl="/"
      />
    </div>
  )
}
