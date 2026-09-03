import { SignIn } from '@clerk/clerk-react'

export default function Login() {
  return (
    <div className="flex justify-center py-4">
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
      />
    </div>
  )
}
