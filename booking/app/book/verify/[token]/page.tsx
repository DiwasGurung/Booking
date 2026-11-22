'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Check, AlertCircle, Loader2, Calendar, Briefcase, Building2 } from 'lucide-react'
import { DateTime } from 'luxon'

// Same zone the booking page uses, so both pages always show the same time
const BUSINESS_TZ = process.env.NEXT_PUBLIC_BUSINESS_TIME_ZONE || 'Asia/Kathmandu'

type Status = 'loading' | 'success' | 'error'

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmed',
  PENDING: 'Pending',
  UNVERIFIED: 'Waiting for verification',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
  NO_SHOW: 'No show',
}

const formatStatus = (raw?: string) => {
  if (!raw) return 'Confirmed'
  return STATUS_LABELS[raw] ?? raw.charAt(0) + raw.slice(1).toLowerCase().replace(/_/g, ' ')
}

const HEADERS: Record<Status, { title: string; subtitle: string }> = {
  loading: { title: 'Verifying your email', subtitle: 'This only takes a moment' },
  success: { title: 'Email verified', subtitle: 'Your booking is confirmed' },
  error: { title: 'Verification failed', subtitle: 'We could not confirm your booking' },
}

export default function VerifyBookingPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')
  const [bookingDetails, setBookingDetails] = useState<any>(null)

  // React Strict Mode runs effects twice in development. The token can only be
  // used once, so the second request would wrongly show an error.
  const requestedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('This verification link is invalid.')
      return
    }
    if (requestedFor.current === token) return
    requestedFor.current = token

    const verifyEmail = async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || ''
        const response = await fetch(`${apiBaseUrl}/api/booking/verify-email/${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setMessage(data.message)
          setBookingDetails(data.booking)
        } else {
          setStatus('error')
          setMessage(data.message || 'We could not verify your email.')
        }
      } catch {
        setStatus('error')
        setMessage('Something went wrong. Try again, or contact the business.')
      }
    }

    verifyEmail()
  }, [token])

  const header = HEADERS[status]

  const start = bookingDetails?.startTime
    ? DateTime.fromISO(bookingDetails.startTime).setZone(BUSINESS_TZ).setLocale('en')
    : null

  const serviceName = bookingDetails?.service?.name ?? bookingDetails?.serviceName
  const businessName = bookingDetails?.business?.name ?? bookingDetails?.businessName
  const shortRef = bookingDetails?.id ? String(bookingDetails.id).slice(0, 8).toUpperCase() : null

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
          {/* Header changes with the state so it never says "Confirm" after an error */}
          <div
            className={`p-8 text-center ${
              status === 'error'
                ? 'bg-gradient-to-r from-destructive to-destructive/80'
                : 'bg-gradient-to-r from-primary to-primary/80'
            }`}
          >
            <h1 className="mb-2 text-2xl font-bold text-primary-foreground">{header.title}</h1>
            <p className="text-primary-foreground/80">{header.subtitle}</p>
          </div>

          <div className="p-8" aria-live="polite">
            {status === 'loading' && (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden="true" />
                </div>
                <p className="text-muted-foreground">Verifying your email...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Check className="h-8 w-8 text-primary" aria-hidden="true" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-foreground">You are all set</h2>
                <p className="text-muted-foreground">{message}</p>

                {bookingDetails && (
                  <dl className="mt-6 space-y-3 rounded-xl bg-secondary/50 p-4 text-left text-sm">
                    {businessName && (
                      <div className="flex items-start gap-3">
                        <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <div>
                          <dt className="text-xs text-muted-foreground">Business</dt>
                          <dd className="font-semibold text-foreground">{businessName}</dd>
                        </div>
                      </div>
                    )}
                    {serviceName && (
                      <div className="flex items-start gap-3">
                        <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <div>
                          <dt className="text-xs text-muted-foreground">Service</dt>
                          <dd className="font-semibold text-foreground">{serviceName}</dd>
                        </div>
                      </div>
                    )}
                    {start?.isValid && (
                      <div className="flex items-start gap-3">
                        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <div>
                          <dt className="text-xs text-muted-foreground">Date and time</dt>
                          <dd className="font-semibold text-foreground">
                            {start.toLocaleString({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            <span className="block font-normal">
                              {start.toLocaleString({ hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </dd>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                      <div>
                        <dt className="text-xs text-muted-foreground">Status</dt>
                        <dd className="font-semibold text-primary">{formatStatus(bookingDetails.status)}</dd>
                      </div>
                      {shortRef && (
                        <div className="text-right">
                          <dt className="text-xs text-muted-foreground">Reference</dt>
                          <dd className="font-mono text-xs text-foreground">{shortRef}</dd>
                        </div>
                      )}
                    </div>
                  </dl>
                )}

                <div className="space-y-2 pt-4">
                  <p className="text-sm text-muted-foreground">
                    We emailed you the booking details. Keep that email for your records.
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Back to home
                  </button>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="rounded-full bg-destructive/10 p-3">
                    <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-foreground">This link did not work</h2>
                <p role="alert" className="text-muted-foreground">{message}</p>

                <div className="space-y-2 pt-4">
                  <p className="text-sm text-muted-foreground">
                    If the link has expired, make a new booking or contact the business.
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Back to home
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Appoint-Nepal - Appointment booking system</p>
        </div>
      </div>
    </div>
  )
}