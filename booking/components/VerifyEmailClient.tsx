"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function VerifyEmailClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15 * 60)
  const [attemptsLeft, setAttemptsLeft] = useState(5)
  const [error, setError] = useState('')
  const [showResend, setShowResend] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

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

    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus()
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
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

      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      console.error(err)
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to resend code')
        return
      }

      setCode(['', '', '', '', '', ''])
      setTimeLeft(15 * 60)
      setAttemptsLeft(5)
      setShowResend(false)

      toast.success('Verification code sent to your email')

      document.getElementById('code-0')?.focus()
    } catch (err) {
      console.error(err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    // 👉 KEEP YOUR EXISTING JSX EXACTLY SAME HERE
    // (no changes needed below)
    <div>...your UI unchanged...</div>
  )
}