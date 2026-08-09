'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'resend'>('loading')
  const [message, setMessage] = useState('')
  const [staffId, setStaffId] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get('token')
      const id = searchParams.get('staffId')
      const emailFromLogin = searchParams.get('email')

      if (!token) {
        if (emailFromLogin) setEmail(emailFromLogin)
        setStatus('resend')
        setMessage(emailFromLogin
          ? 'Click below to send a fresh verification link to this email address.'
          : 'Enter your staff email and we will send a fresh verification link.')
        return
      }

      setStaffId(id || '')

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
        const response = await fetch(`${API_URL}/api/staff-verification/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(id ? { token, staffId: id } : { token }),
        })

        if (response.ok) {
          const data = await response.json()
          const resolvedStaffId = id || data.staffId
          if (resolvedStaffId) setStaffId(resolvedStaffId)
          setStatus('success')
          setMessage(data.alreadyVerified
            ? 'This email address is already verified. You can continue to password setup.'
            : 'Email verified successfully! Please set your password to continue.')
          setTimeout(() => {
            router.push(`/staff/set-password?staffId=${resolvedStaffId}&token=${encodeURIComponent(token)}`)
          }, 2000)
        } else {
          const error = await response.json()
          setStatus('error')
          setMessage(error.message || 'Failed to verify email')
        }
      } catch {
        setStatus('error')
        setMessage('Unable to reach the verification server. Make sure the backend is running and try again.')
      }
    }

    verify()
  }, [searchParams, router])

  const handleRequestVerification = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) {
      setMessage('Enter your staff email address.')
      return
    }

    try {
      setStatus('loading')
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      const response = await fetch(`${API_URL}/api/staff-verification/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await response.json()
      setStatus(response.ok ? 'resend' : 'error')
      setMessage(data.message || 'Unable to process this verification request.')
    } catch {
      setStatus('error')
      setMessage('Unable to reach the verification server. Make sure the backend is running and try again.')
    }
  }

  const handleResend = async () => {
    const token = searchParams.get('token')
    if (!staffId && !token) {
      setMessage('This verification link does not contain enough information to resend.')
      return
    }

    try {
      setStatus('loading')
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      const response = await fetch(`${API_URL}/api/staff-verification/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(staffId ? { staffId } : {}),
          ...(token ? { token } : {}),
        }),
      })

      if (response.ok) {
        setStatus('resend')
        setMessage('Verification email sent! Check your inbox.')
      } else {
        const error = await response.json()
        setStatus('error')
        setMessage(error.message || 'Failed to resend email')
      }
    } catch {
      setStatus('error')
      setMessage('Unable to reach the verification server. Make sure the backend is running and try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>Confirm your email address to access your staff portal</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <div>
                <h3 className="font-semibold text-green-700 mb-2">Email Verified!</h3>
                <p className="text-sm text-muted-foreground mb-4">{message}</p>
                <p className="text-xs text-muted-foreground">Redirecting to password setup...</p>
              </div>
            </div>
          )}

          {(status === 'error' || status === 'resend') && (
            <div className="flex flex-col gap-4 text-center">
              {searchParams.get('token') ? (
                <>
                  <div className="flex flex-col items-center gap-4">
                    {status === 'error' ? <AlertCircle className="w-12 h-12 text-destructive" /> : <CheckCircle className="w-12 h-12 text-green-500" />}
                    <div>
                      <h3 className={`font-semibold mb-2 ${status === 'error' ? 'text-destructive' : 'text-green-700'}`}>
                        {status === 'error' ? 'Verification Failed' : 'Email Sent'}
                      </h3>
                      <p className="text-sm text-muted-foreground">{message}</p>
                    </div>
                  </div>
                  {status === 'error' && (
                    <Button onClick={handleResend} variant="outline" className="w-full">
                      Resend Verification Email
                    </Button>
                  )}
                </>
              ) : (
                <form onSubmit={handleRequestVerification} className="space-y-4 text-left">
                  {status === 'resend' && <CheckCircle className="mx-auto h-12 w-12 text-green-500" />}
                  <p className="text-center text-sm text-muted-foreground">{message}</p>
                  <label htmlFor="staff-email" className="text-sm font-medium">Staff email address</label>
                  <input
                    id="staff-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    placeholder="name@company.com"
                  />
                  <Button type="submit" className="w-full">Send verification email</Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
