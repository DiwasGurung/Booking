'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/authContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Smartphone, Clock, RefreshCw } from 'lucide-react'

interface ProfilePhoneVerificationProps {
  phone?: string
  isPhoneVerified?: boolean
  onVerified?: () => void
}

export function ProfilePhoneVerification({
  phone: initialPhone,
  isPhoneVerified: initialVerified,
  onVerified,
}: ProfilePhoneVerificationProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<'input' | 'verify'>('input')
  const [phone, setPhone] = useState(initialPhone || '')
  const [otp, setOtp] = useState('')
  const [isPhoneVerified, setIsPhoneVerified] = useState(initialVerified || false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [showResend, setShowResend] = useState(false)

  // Format Nepali phone number
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) return cleaned
    if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 8)}-${cleaned.slice(8, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPhone(formatPhone(value))
  }

  // Timer countdown
  useEffect(() => {

    if (timeLeft <= 0 || !timeLeft) {
      setShowResend(true)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const handleSendCode = async () => {
    setError('')
    setSuccess('')

    // Check if user is authenticated
    if (!user?.id) {
      setError('Please log in to verify your phone number')
      return
    }

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number')
      return
    }

    try {
      setIsLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      
      const cleanedPhone = phone.replace(/\D/g, '')
      const response = await fetch(`${apiUrl}/api/phone-verification/send-code`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: cleanedPhone }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[v0] Error sending code:', data)
        throw new Error(data.error || 'Failed to send code')
      }

      setSuccess('Verification code sent to your phone!')
      setStep('verify')
      setTimeLeft(120)
      setShowResend(false)
    } catch (err) {
      console.error('[v0] Send code error:', err)
      setError(err instanceof Error ? err.message : 'Failed to send code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setError('')
    setSuccess('')

    if (!user?.id) {
      setError('Please log in to verify your phone number')
      return
    }

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    try {
      setIsLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      
      const cleanedPhone = phone.replace(/\D/g, '')
      const response = await fetch(`${apiUrl}/api/phone-verification/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phoneNumber: cleanedPhone,
          code: otp,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[v0] Verification error:', data)
        throw new Error(data.error || 'Invalid verification code')
      }

      setSuccess('Phone number verified successfully!')
      setIsPhoneVerified(true)
      setStep('input')
      setOtp('')
      setTimeLeft(0)
      onVerified?.()

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('[v0] Verify error:', err)
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError('')
    setSuccess('')

    if (!user?.id) {
      setError('Please log in to resend code')
      return
    }

    try {
      setIsLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      
      const cleanedPhone = phone.replace(/\D/g, '')
      const response = await fetch(`${apiUrl}/api/phone-verification/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber: cleanedPhone }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[v0] Resend error:', data)
        throw new Error(data.error || 'Failed to resend code')
      }

      setSuccess('New verification code sent!')
      setTimeLeft(120)
      setShowResend(false)
      setOtp('')

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('[v0] Resend error:', err)
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Phone Number Verification
        </h3>
        {isPhoneVerified && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Verified</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      {isPhoneVerified ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Your phone number is verified and you&apos;ll receive SMS notifications for appointment updates.</p>
          <div className="p-3 bg-muted/50 rounded">
            <p className="text-sm font-medium text-foreground">{phone}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setIsPhoneVerified(false)
              setStep('input')
              setPhone('')
              setOtp('')
            }}
            className="w-full"
          >
            Change Phone Number
          </Button>
        </div>
      ) : step === 'input' ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add and verify your phone number to receive appointment reminders and updates via SMS.
          </p>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nepali Phone Number
            </label>
            <Input
              type="tel"
              placeholder="98-XXXXXX-XX"
              value={phone}
              onChange={handlePhoneChange}
              disabled={isLoading}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">Format: 98XXXXXXXXXX (10 digits)</p>
          </div>

          <Button
            onClick={handleSendCode}
            disabled={isLoading || !phone}
            className="w-full"
          >
            {isLoading ? 'Sending...' : 'Send Verification Code'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit verification code sent to <strong>{phone}</strong>
          </p>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Verification Code
            </label>
            <Input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={isLoading}
              maxLength={6}
              className="font-mono text-center text-lg tracking-widest"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                {timeLeft > 0
                  ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`
                  : 'Code expired'}
              </span>
            </div>
            {showResend && (
              <button
                onClick={handleResendCode}
                disabled={isLoading}
                className="text-primary hover:underline flex items-center gap-1 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Resend Code
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep('input')}
              disabled={isLoading}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleVerifyCode}
              disabled={isLoading || otp.length !== 6}
              className="flex-1"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
