'use client'

import { AuthWrapper } from '@/components/AuthWrapper'
import { UserRegisterForm } from '@/components/auth/RegistrationForm'

export default function SignupPage() {
  return (
    <AuthWrapper mode="public">
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <UserRegisterForm />
        </div>
      </div>
    </AuthWrapper>
  )
}
