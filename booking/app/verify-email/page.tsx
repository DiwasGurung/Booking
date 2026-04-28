'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CheckCircle, AlertCircle, Clock, Mail, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes
  const [attemptsLeft, setAttemptsLeft] = useState(5)
  const [error, setError] = useState('')
  const [showResend, setShowResend] = useState(false)

  // Get email from query params or from input
  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || verified) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setShowResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, verified])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    
    const newCode = [...code]
    newCode[index] = value

    setCode(newCode)

    // Auto-focus to next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    if (!email) {
      setError('Email is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      const response = await fetch(`${API_URL}/api/users/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: fullCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.attemptsRemaining !== undefined) {
          setAttemptsLeft(data.attemptsRemaining)
          setError(`Invalid code. ${data.attemptsRemaining} attempts remaining.`)
        } else if (data.attemptsExceeded) {
          setError('Too many failed attempts. Please request a new code.')
          setShowResend(true)
        } else {
          setError(data.error || 'Verification failed')
        }
        return
      }

      setVerified(true)
      toast.success('Email verified successfully!')

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      console.error('[v0] Verification error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email) {
      setError('Email is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      const response = await fetch(`${API_URL}/api/users/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to resend code')
        return
      }

      // Reset code inputs
      setCode(['', '', '', '', '', ''])
      setTimeLeft(15 * 60)
      setAttemptsLeft(5)
      setShowResend(false)
      toast.success('Verification code sent to your email')

      // Focus on first input
      document.getElementById('code-0')?.focus()
    } catch (err: any) {
      console.error('[v0] Resend error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border shadow-lg">
        <div className="p-8">
          {verified ? (
            // Success state
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Email Verified!</h1>
              <p className="text-muted-foreground">
                Your email has been verified successfully. Redirecting to login...
              </p>
            </div>
          ) : (
            // Verification form
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-2">Verify Your Email</h1>
                <p className="text-muted-foreground">
                  Enter the 6-digit code sent to <br />
                  <span className="font-semibold text-foreground">{email}</span>
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg mb-6">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              {timeLeft > 0 && !showResend && (
                <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium">
                    Code expires in {formatTime(timeLeft)}
                  </span>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-6">
                {/* Code inputs */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground">Verification Code</label>
                  <div className="flex gap-2 justify-center">
                    {code.map((digit, index) => (
                      <Input
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        placeholder="•"
                        className="w-12 h-12 text-center text-xl font-bold border-2 border-border focus:border-primary transition-colors"
                        disabled={verified}
                      />
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={loading || verified || code.join('').length !== 6}
                  className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </Button>
              </form>

              {/* Resend section */}
              {showResend && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700 mb-3">
                    Didn&apos;t receive the code?
                  </p>
                  <Button
                    onClick={handleResendCode}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {loading ? 'Sending...' : 'Resend Code'}
                  </Button>
                </div>
              )}

              {/* Change email link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Wrong email?{' '}
                  <button
                    onClick={() => {
                      setEmail('')
                      setCode(['', '', '', '', '', ''])
                      setError('')
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    Enter a different email
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
