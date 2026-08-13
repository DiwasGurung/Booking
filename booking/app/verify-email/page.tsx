'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { VerifyEmailForm } from '@/components/VerifyEmailForm'
import { VerifyEmailSkeleton } from '@/components/VerifyEmailSkeleton'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const action = searchParams.get('action')


  return (
    <Card className="w-full max-w-md border-border shadow-lg">
      <div className="p-8">
        <VerifyEmailForm initialEmail={email} shouldResendOnMount={action === 'resend'} />
      </div>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex items-center justify-center p-4">
      <Suspense fallback={<VerifyEmailSkeleton />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}
