import { SignUp } from '@clerk/clerk-react'

export default function SignUpPage() {
  return (
    <div className="flex justify-center py-4">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/login"
        fallbackRedirectUrl="/"
      />
    </div>
  )
}
