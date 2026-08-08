import { PasswordRequestForm, RecoveryShell } from '@/components/PasswordRecoveryForm'

export default function ForgotPasswordPage() {
  return <RecoveryShell><PasswordRequestForm accountType="business" /></RecoveryShell>
}
