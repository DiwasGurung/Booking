'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Calendar, Clock, User, MapPin, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Booking {
  id: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  service: {
    name: string
    duration: number
    price: number
  }
  startDate: string
  endDate: string
  status: string
  notes?: string
}

export default function StaffBookingsPage() {
  const params = useParams()
  const { toast } = useToast()
  const staffCode = params.staffCode as string

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [staffName, setStaffName] = useState('')

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
        const response = await fetch(`${API_URL}/api/staff/code/${staffCode}/bookings`)

        if (!response.ok) {
          if (response.status === 404) {
            setError('Staff member not found')
          } else {
            setError('Failed to load bookings')
          }
          return
        }

        const data = await response.json()
        setBookings(data.bookings || [])
        setStaffName(data.staffName || '')
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [staffCode])

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const copyBookingLink = () => {
    const bookingLink = `${window.location.origin}/staff/${staffCode}/book`
    navigator.clipboard.writeText(bookingLink)
    toast({
      title: 'Copied!',
      description: 'Booking link copied to clipboard',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="py-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <p className="text-muted-foreground">Loading your bookings...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-destructive">
          <CardContent className="py-12">
            <div className="flex items-center gap-3 text-destructive mb-4">
              <AlertCircle className="w-6 h-6" />
              <p className="font-semibold">{error}</p>
            </div>
            <p className="text-sm text-muted-foreground">Please check the booking link and try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{staffName}'s Bookings</h1>
          <p className="text-muted-foreground mb-6">View and manage your upcoming appointments</p>

          {/* Share Booking Link */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-900">Share Your Booking Link</p>
                <p className="text-xs text-blue-700 mt-1">
                  Clients can book with you directly using this link
                </p>
              </div>
              <Button size="sm" onClick={copyBookingLink} variant="outline" className="gap-2">
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No bookings yet</p>
              <p className="text-xs text-muted-foreground mt-2">
                Share your booking link to receive appointments
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="py-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Booking Details */}
                    <div className="flex-1 space-y-3">
                      {/* Customer Info */}
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">
                            {booking.customer.firstName} {booking.customer.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{booking.customer.email}</p>
                        </div>
                      </div>

                      {/* Service & Time */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Service</p>
                            <p className="font-medium">{booking.service.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="font-medium">{booking.service.duration} minutes</p>
                          </div>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Appointment</p>
                          <p className="font-medium">
                            {new Date(booking.startDate).toLocaleDateString()} at{' '}
                            {new Date(booking.startDate).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Notes */}
                      {booking.notes && (
                        <div>
                          <p className="text-sm text-muted-foreground">Notes</p>
                          <p className="text-sm">{booking.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Status & Price */}
                    <div className="flex flex-col items-end gap-3">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="text-lg font-bold text-primary">
                          Rs. {booking.service.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
