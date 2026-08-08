import { PasswordRequestForm, RecoveryShell } from '@/components/PasswordRecoveryForm'

export default function StaffRequestResetPage() {
  return <RecoveryShell><PasswordRequestForm accountType="staff" /></RecoveryShell>
}
