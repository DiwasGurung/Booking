'use client'

import { AuthWrapper } from '@/components/AuthWrapper'
import { LoginForm } from '@/components/auth/LoginForm'
import { LoginFormToggle } from '@/components/LoginFormToggle'

export default function LoginPage() {
  return (
    <AuthWrapper mode="public">
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Login Type Toggle */}
          <div className="mb-6">
            <LoginFormToggle />
          </div>
          <LoginForm />
        </div>
      </div>
    </AuthWrapper>
  )
}
