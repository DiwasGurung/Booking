'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader } from 'lucide-react'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'resend'>('loading')
  const [message, setMessage] = useState('')
  const [staffId, setStaffId] = useState('')

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get('token')
      const id = searchParams.get('staffId')

      if (!token || !id) {
        setStatus('error')
        setMessage('Invalid verification link')
        return
      }

      setStaffId(id)

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
        const response = await fetch(`${API_URL}/api/staff-verification/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, staffId: id }),
        })

        if (response.ok) {
          setStatus('success')
          setMessage('Email verified successfully! Please set your password to continue.')
          setTimeout(() => {
            router.push(`/staff/set-password?staffId=${id}&token=${token}`)
          }, 2000)
        } else {
          const error = await response.json()
          setStatus('error')
          setMessage(error.message || 'Failed to verify email')
        }
      } catch (error: any) {
        setStatus('error')
        setMessage(error.message || 'An error occurred during verification')
      }
    }

    verify()
  }, [searchParams, router])

  const handleResend = async () => {
    if (!staffId) return

    try {
      setStatus('loading')
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      const response = await fetch(`${API_URL}/api/staff-verification/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId }),
      })

      if (response.ok) {
        setStatus('resend')
        setMessage('Verification email sent! Check your inbox.')
      } else {
        const error = await response.json()
        setStatus('error')
        setMessage(error.message || 'Failed to resend email')
      }
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || 'An error occurred')
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
                <p className="text-xs text-muted-foreground">Redirecting to your booking page...</p>
              </div>
            </div>
          )}

          {(status === 'error' || status === 'resend') && (
            <div className="flex flex-col items-center gap-4 text-center">
              {status === 'error' && <AlertCircle className="w-12 h-12 text-destructive" />}
              {status === 'resend' && <CheckCircle className="w-12 h-12 text-green-500" />}
              <div>
                <h3 className={`font-semibold mb-2 ${status === 'error' ? 'text-destructive' : 'text-green-700'}`}>
                  {status === 'error' ? 'Verification Failed' : 'Email Sent'}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">{message}</p>
              </div>
              {status === 'error' && (
                <Button onClick={handleResend} variant="outline" className="w-full">
                  Resend Verification Email
                </Button>
              )}
              {status === 'resend' && (
                <Button onClick={() => router.push('/')} className="w-full">
                  Back to Home
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
