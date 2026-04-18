'use client'

import { UnifiedBusinessRegister } from '@/components/business/BusinessForm'

export default function SignupBusinessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <UnifiedBusinessRegister />
      </div>
    </div>
  )
}
