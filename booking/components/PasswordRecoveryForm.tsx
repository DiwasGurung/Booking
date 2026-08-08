'use client'

import { FormEvent, ReactNode, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'

type AccountType = 'business' | 'staff'

export function PasswordRequestForm({ accountType }: { accountType: AccountType }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const endpoint = accountType === 'staff' ? '/api/staff-auth/request-password-reset' : '/api/users/request-password-reset'

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to request a reset link')
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request a reset link')
    } finally { setLoading(false) }
  }

  if (sent) return <div className="space-y-5 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-primary" /><h1 className="text-2xl font-bold">Check your email</h1><p className="text-muted-foreground">If an account exists for that address, we sent a password reset link.</p><Link href={accountType === 'staff' ? '/staff/login' : '/login'} className="text-sm font-medium text-primary hover:underline">Back to sign in</Link></div>

  return <div className="space-y-6"><div><KeyRound className="mb-4 h-10 w-10 text-primary" /><h1 className="text-2xl font-bold">Forgot your password?</h1><p className="mt-2 text-sm text-muted-foreground">Enter your {accountType === 'staff' ? 'staff' : 'business'} account email and we&apos;ll send a secure reset link.</p></div>{error && <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}<form onSubmit={submit} className="space-y-4"><Label htmlFor="reset-email">Email address</Label><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required disabled={loading} /></div><Button className="w-full" disabled={loading}>{loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}Send reset link</Button></form><Link href={accountType === 'staff' ? '/staff/login' : '/login'} className="block text-center text-sm text-primary hover:underline">Back to sign in</Link></div>
}

export function PasswordResetForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') || ''
  const accountType: AccountType = params.get('type') === 'staff' ? 'staff' : 'business'
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!token) return setError('This reset link is missing or invalid.')
    if (password.length < 8) return setError('Password must be at least 8 characters long.')
    if (password !== confirmation) return setError('Passwords do not match.')
    setLoading(true)
    try {
      const endpoint = accountType === 'staff' ? '/api/staff-auth/reset-password' : '/api/users/reset-password'
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resetToken: token, password, passwordConfirm: confirmation }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to reset password')
      router.push(`${accountType === 'staff' ? '/staff/login' : '/login'}?reset=success`)
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to reset password') } finally { setLoading(false) }
  }

  return <div className="space-y-6"><div><KeyRound className="mb-4 h-10 w-10 text-primary" /><h1 className="text-2xl font-bold">Create a new password</h1><p className="mt-2 text-sm text-muted-foreground">Use at least 8 characters for your new password.</p></div>{error && <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}<form onSubmit={submit} className="space-y-4"><div><Label htmlFor="new-password">New password</Label><div className="relative mt-2"><Input id="new-password" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" required disabled={loading} /><button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div><div><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" type={show ? 'text' : 'password'} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="mt-2" required disabled={loading} /></div><Button className="w-full" disabled={loading}>{loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}Reset password</Button></form></div>
}

export function RecoveryShell({ children }: { children: ReactNode }) { return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12"><section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">{children}</section></main> }
