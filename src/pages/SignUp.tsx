import { SignUp } from '@clerk/clerk-react'
import { useLocation } from 'react-router-dom'
import { serviceReturnTo } from '@/lib/serviceReturnTo'

export default function SignUpPage() {
  const returnTo = serviceReturnTo(useLocation().search)
  return (
    <div className="flex justify-center py-4">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl={
          returnTo
            ? `/login?returnTo=${encodeURIComponent(returnTo)}`
            : '/login'
        }
        forceRedirectUrl={returnTo}
        fallbackRedirectUrl="/"
      />
    </div>
  )
}
