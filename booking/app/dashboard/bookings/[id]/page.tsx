'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Loader, Calendar, Clock, User, Mail, Phone, AlertCircle, ArrowLeft } from 'lucide-react'
import { bookingsApi } from '@/lib/api'
import { format } from 'date-fns'

interface BookingDetail {
  id: string
  serviceId: string
  businessId: string
  startTime: string
  endTime: string
  customerName: string
  customerEmail: string
  customerPhone: string
  notes?: string
  status: string
  service?: {
    name: string
    duration: number
    price: number
    description?: string
  }
  business?: {
    name: string
    phone: string
    address: string
    city: string
  }
}

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBooking()
  }, [bookingId])

  async function loadBooking() {
    try {
      setLoading(true)
      setError(null)
      const response = await bookingsApi.getBookingById(bookingId)
      if (response.data) {
        setBooking({
          ...response.data,
          status: response.data.status ?? 'PENDING', // or map appropriately if status is named differently
        })
      } else {
        setError('Booking not found')
      }
    } catch (err) {
      console.error('[v0] Failed to load booking:', err)
      setError('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const statusColors: Record<string, { badge: string; bg: string }> = {
    PENDING: { badge: 'bg-yellow-100 text-yellow-800', bg: 'bg-yellow-50' },
    CONFIRMED: { badge: 'bg-blue-100 text-blue-800', bg: 'bg-blue-50' },
    COMPLETED: { badge: 'bg-green-100 text-green-800', bg: 'bg-green-50' },
    CANCELLED: { badge: 'bg-red-100 text-red-800', bg: 'bg-red-50' },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
        <div className="flex items-center justify-center h-screen">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
          <Button variant="outline" className="mb-6 bg-transparent" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card className="border border-border shadow-lg p-8">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-center text-lg font-semibold text-foreground">{error || 'Booking not found'}</p>
          </Card>
        </div>
      </div>
    )
  }

  const startDate = new Date(booking.startTime)
  const endDate = new Date(booking.endTime)
  const colors = statusColors[booking.status]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Button variant="outline" className="mb-6 bg-transparent" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bookings
        </Button>

        <Card className="border border-border shadow-lg overflow-hidden">
          {/* Header */}
          <div className={`${colors.bg} p-6 border-b border-border`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{booking.service?.name}</h1>
                <Badge className={`mt-2 ${colors.badge}`}>{booking.status}</Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Price</p>
                <p className="text-3xl font-bold text-foreground">${(booking.service?.price || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Appointment Details */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">Appointment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date</p>
                    <p className="text-foreground font-medium">{format(startDate, 'EEEE, MMMM dd, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Time</p>
                    <p className="text-foreground font-medium">
                      {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Duration</p>
                  <p className="text-foreground font-medium">{booking.service?.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Service ID</p>
                  <p className="text-foreground font-mono text-sm">{booking.serviceId}</p>
                </div>
              </div>
            </section>

            <div className="border-t border-border my-8" />

            {/* Customer Information */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">Customer Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="text-foreground font-medium">{booking.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${booking.customerEmail}`} className="text-primary hover:underline font-medium">
                      {booking.customerEmail}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a href={`tel:${booking.customerPhone}`} className="text-primary hover:underline font-medium">
                      {booking.customerPhone}
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {booking.notes && (
              <>
                <div className="border-t border-border my-8" />
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Notes</h2>
                  <div className="p-4 bg-secondary/30 rounded-lg border border-border">
                    <p className="text-foreground whitespace-pre-wrap">{booking.notes}</p>
                  </div>
                </section>
              </>
            )}

            {/* Business Information */}
            {booking.business && (
              <>
                <div className="border-t border-border my-8" />
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Business Information</h2>
                  <div className="space-y-3 p-4 bg-secondary/20 rounded-lg">
                    <p className="text-foreground font-medium">{booking.business.name}</p>
                    <p className="text-sm text-muted-foreground">{booking.business.address}, {booking.business.city}</p>
                    <a href={`tel:${booking.business.phone}`} className="text-primary hover:underline text-sm">
                      {booking.business.phone}
                    </a>
                  </div>
                </section>
              </>
            )}

            {/* Actions */}
            {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
              <>
                <div className="border-t border-border my-8" />
                <div className="flex gap-3">
                  <Button className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90">Reschedule</Button>
                  <Button variant="destructive" className="flex-1 h-11">
                    Cancel Booking
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
