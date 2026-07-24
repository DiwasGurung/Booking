'use client'

import  {StaffLoginForm}  from '@/components/auth/StaffLoginForm'

export default function StaffLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/30 p-4">
      <div className="w-full max-w-md">
        <StaffLoginForm />
      </div>
    </div>
  )
}
