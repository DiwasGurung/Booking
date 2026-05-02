'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Phone, CheckCircle, Loader } from 'lucide-react'
import { firebaseSendPhoneCode, firebaseVerifyPhoneCode } from '@/lib/firebase-auth'
import { useToast } from '@/hooks/use-toast'

export function FirebasePhoneAuthForm() {
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState<'phone' | 'verification'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [verificationId, setVerificationId] = useState<string | null>(null)

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Nepali phone number validation (10 digits starting with 9)
  const validateNepaliPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length === 10 && cleaned.startsWith('9')
  }

  // Format phone number to Nepali format
  const formatNepaliPhone = (value: string): string => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 5) {
      return cleaned
    }
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNepaliPhone(e.target.value)
    setPhoneNumber(formatted)
    setError('')
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateNepaliPhone(phoneNumber)) {
      setError('Please enter a valid 10-digit Nepali phone number starting with 9')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Format phone number with country code
      const fullPhoneNumber = `+977${phoneNumber.replace(/\D/g, '')}`
      console.log('[v0] Sending Firebase phone code to:', fullPhoneNumber)

      const result = await firebaseSendPhoneCode(fullPhoneNumber, 'recaptcha-container')

      if (result.success && result.verificationId) {
        setVerificationId(result.verificationId)
        setStep('verification')
        setTimeLeft(120) // 2 minutes
        toast({ title: 'Verification code sent to your phone' })
      } else {
        setError(result.message || 'Failed to send verification code')
      }
    } catch (err: any) {
      console.error('[v0] Error sending phone code:', err)
      setError('Failed to send verification code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value

    setCode(newCode)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement
      nextInput?.focus()
    }

    // Auto-submit when all digits are entered
    if (newCode.every(digit => digit)) {
      handleVerifyCode(newCode.join(''))
    }
  }

  const handleCodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement
      prevInput?.focus()
    }
  }

  const handleVerifyCode = async (verificationCode: string) => {
    if (!verificationId) {
      setError('Verification ID not found. Please request a new code.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      console.log('[v0] Verifying Firebase phone code')

      const result = await firebaseVerifyPhoneCode(verificationId, verificationCode)

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Phone verified successfully!',
        })
        // Redirect to dashboard or profile
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        setError(result.message || 'Verification failed')
        setCode(['', '', '', '', '', ''])
      }
    } catch (err: any) {
      console.error('[v0] Error verifying code:', err)
      setError('Verification failed. Please try again.')
      setCode(['', '', '', '', '', ''])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Phone Verification</h1>
        <p className="text-muted-foreground text-sm">Secure your account with phone authentication</p>
      </div>

      <div id="recaptcha-container" className="mb-4"></div>

      {step === 'phone' && (
        <form onSubmit={handleSendCode} className="space-y-4">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Nepali Phone Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="phone"
                type="tel"
                placeholder="98XXXXX-XXXX"
                className="pl-9"
                value={phoneNumber}
                onChange={handlePhoneChange}
                disabled={isLoading}
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                +977
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Enter your 10-digit phone number starting with 9</p>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !phoneNumber}
            className="w-full h-10 font-medium"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Verification Code'
            )}
          </Button>
        </form>
      )}

      {step === 'verification' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              We&apos;ve sent a 6-digit code to <strong>{phoneNumber}</strong>
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-medium">Verification Code</Label>
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-bold border border-border rounded-lg focus:outline-none focus:border-primary"
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          {timeLeft > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Code expires in: <strong>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</strong>
            </p>
          )}

          <Button
            onClick={() => {
              const verificationCode = code.join('')
              if (verificationCode.length === 6) {
                handleVerifyCode(verificationCode)
              }
            }}
            disabled={isLoading || code.join('').length !== 6}
            className="w-full h-10 font-medium"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Verify Phone
              </>
            )}
          </Button>

          <Button
            onClick={() => {
              setStep('phone')
              setCode(['', '', '', '', '', ''])
              setError('')
            }}
            variant="outline"
            className="w-full"
          >
            Edit Phone Number
          </Button>
        </div>
      )}
    </div>
  )
}
