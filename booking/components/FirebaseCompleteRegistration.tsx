'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Phone, Mail, User } from 'lucide-react'
import Link from 'next/link'

type RegistrationStep = 'credentials' | 'phone' | 'phone-verification' | 'success'

export function FirebaseCompleteRegistration() {
  const router = useRouter()
  const [step, setStep] = useState<RegistrationStep>('credentials')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Credentials step
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [firebaseUser, setFirebaseUser] = useState<any>(null)

  // Phone step
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')

  // Verification step
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [verificationError, setVerificationError] = useState('')
  const [attemptRemaining, setAttemptRemaining] = useState(5)
  const [timeLeft, setTimeLeft] = useState(900) // 15 minutes

  // Handle credentials submission
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email || !password || !firstName || !lastName) {
        setError('All fields are required')
        return
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseIdToken = await userCredential.user.getIdToken()

      console.log('[v0] Firebase user created:', userCredential.user.uid)

      // Register in backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/firebase/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${firebaseIdToken}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: '',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Registration failed')
      }

      const data = await response.json()
      setFirebaseUser(userCredential.user)
      setStep('phone')
    } catch (err: any) {
      console.error('[v0] Registration error:', err)
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle phone submission
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPhoneError('')
    setLoading(true)

    try {
      if (!phone.trim()) {
        setPhoneError('Phone number is required')
        return
      }

      // Validate Nepali phone format
      const phoneRegex = /^(?:\+977|0)?9\d{9}$/
      if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
        setPhoneError('Please enter a valid Nepali phone number')
        return
      }

      const firebaseIdToken = await firebaseUser.getIdToken()

      // Send verification code
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/firebase/phone/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${firebaseIdToken}`,
        },
        body: JSON.stringify({ phone }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send verification code')
      }

      console.log('[v0] Verification code sent to:', phone)
      setStep('phone-verification')

      // Start timer
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: any) {
      setPhoneError(err.message || 'Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  // Handle verification code input
  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...verificationCode]
      newCode[index] = value
      setVerificationCode(newCode)

      // Auto-submit if all digits entered
      if (newCode.every(digit => digit !== '')) {
        handleCodeSubmit(newCode.join(''))
      }
    }
  }

  // Handle code submission
  const handleCodeSubmit = async (code?: string) => {
    setVerificationError('')
    setLoading(true)

    try {
      const codeString = code || verificationCode.join('')

      if (codeString.length !== 6) {
        setVerificationError('Please enter all 6 digits')
        return
      }

      const firebaseIdToken = await firebaseUser.getIdToken()

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/firebase/phone/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${firebaseIdToken}`,
        },
        body: JSON.stringify({ verificationCode: codeString }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.attemptsExceeded) {
          setVerificationError('Too many failed attempts. Please request a new code.')
          return
        }
        setAttemptRemaining(data.attemptsRemaining || 0)
        throw new Error(data.error || 'Verification failed')
      }

      console.log('[v0] Phone verified successfully')
      setStep('success')

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: any) {
      setVerificationError(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setLoading(true)
    setVerificationError('')

    try {
      const firebaseIdToken = await firebaseUser.getIdToken()

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/firebase/phone/resend-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${firebaseIdToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to resend code')
      }

      setVerificationCode(['', '', '', '', '', ''])
      setTimeLeft(900)
      console.log('[v0] New verification code sent')
    } catch (err: any) {
      setVerificationError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {step === 'credentials' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Create Account</h1>
            <p className="text-muted-foreground text-sm">Sign up with email and verify your phone</p>
          </div>

          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-destructive text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating Account...' : 'Continue'}
            </Button>
          </form>

          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      )}

      {step === 'phone' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Add Phone Number</h1>
            <p className="text-muted-foreground text-sm">We&apos;ll send a verification code to your phone</p>
          </div>

          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            {phoneError && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-destructive text-sm font-medium">{phoneError}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number (Nepal)
              </Label>
              <Input
                id="phone"
                placeholder="98XXXX-XXXX or +977-98XXXX-XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Format: 98XXXX-XXXX (10 digits)</p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </Button>
          </form>

          <button
            onClick={() => setStep('credentials')}
            className="w-full text-sm text-primary hover:underline"
          >
            Back
          </button>
        </div>
      )}

      {step === 'phone-verification' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Verify Phone</h1>
            <p className="text-muted-foreground text-sm">Enter the 6-digit code sent to your phone</p>
          </div>

          <div className="space-y-4">
            {verificationError && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-destructive text-sm font-medium">{verificationError}</p>
                  {attemptRemaining > 0 && (
                    <p className="text-xs text-destructive mt-1">{attemptRemaining} attempts remaining</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-between">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  className="w-12 h-12 text-center text-2xl font-bold border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  disabled={loading}
                />
              ))}
            </div>

            {timeLeft > 0 && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Code expires in {formatTime(timeLeft)}</p>
              </div>
            )}

            {timeLeft === 0 && (
              <Button
                onClick={handleResendCode}
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                Resend Code
              </Button>
            )}
          </div>

          <button
            onClick={() => setStep('phone')}
            className="w-full text-sm text-primary hover:underline"
          >
            Change Phone Number
          </button>
        </div>
      )}

      {step === 'success' && (
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Account Created!</h1>
            <p className="text-muted-foreground text-sm">
              Your phone number has been verified. Redirecting to dashboard...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
