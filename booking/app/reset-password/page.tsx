'use client'

import { Suspense } from 'react'
import { PasswordResetForm, RecoveryShell } from '@/components/PasswordRecoveryForm'

function ResetPasswordContent() {
  return (
    <RecoveryShell>
      <PasswordResetForm />
    </RecoveryShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<RecoveryShell><div className="text-center text-sm text-muted-foreground">Loading...</div></RecoveryShell>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
