'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Check, AlertCircle, Loader2 } from 'lucide-react'

export default function VerifyBookingPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [bookingDetails, setBookingDetails] = useState<any>(null)

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        if (!token) {
          setStatus('error')
          setMessage('Invalid verification link')
          return
        }

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001'
        const response = await fetch(`${apiBaseUrl}/api/booking/verify-email/${token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setMessage(data.message)
          setBookingDetails(data.booking)
        } else {
          setStatus('error')
          setMessage(data.message || 'Failed to verify email')
        }
      } catch (error) {
        console.error('Error verifying email:', error)
        setStatus('error')
        setMessage('An error occurred. Please try again or contact support.')
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-background border border-border rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 p-8 text-center">
            <h1 className="text-2xl font-bold text-primary-foreground mb-2">
              Email Verification
            </h1>
            <p className="text-primary-foreground/80">Confirm your booking</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {status === 'loading' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
                <p className="text-muted-foreground">Verifying your email...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="bg-green-100 rounded-full p-3">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Email Verified!
                </h2>
                <p className="text-muted-foreground">{message}</p>

                {bookingDetails && (
                  <div className="mt-6 bg-secondary/50 rounded-lg p-4 text-left space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Booking ID:</span>
                      <p className="font-mono text-xs text-foreground break-all">
                        {bookingDetails.id}
                      </p>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Date & Time:</span>
                      <p className="font-semibold text-foreground">
                        {new Date(bookingDetails.startTime).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <p className="font-semibold text-green-600">
                        {bookingDetails.status}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Check your email for booking confirmation and details.
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="bg-red-100 rounded-full p-3">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Verification Failed
                </h2>
                <p className="text-muted-foreground">{message}</p>

                <div className="pt-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    If the link has expired, please create a new booking or contact the business.
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>BookFlow - Appointment Booking System</p>
        </div>
      </div>
    </div>
  )
}
