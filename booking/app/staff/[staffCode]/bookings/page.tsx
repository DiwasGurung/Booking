'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Calendar, Clock, User, MapPin, Copy, Loader } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { StaffSidebar } from '@/components/StaffSidebar'

interface Staff {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  staffCode: string
}

interface Booking {
  id: string
  customer: {
    name: string
    email: string
    phone: string
  }
  service: {
    name: string
    duration: number
    price: number
  }
  startTime: string
  endTime: string
  status: string
  notes?: string
}

export default function StaffBookingsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const staffCode = params.staffCode as string

  const [staff, setStaff] = useState<Staff | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [staffName, setStaffName] = useState('')

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
        const verifyResponse = await fetch(`${API_URL}/api/staff-auth/verify`, {
          credentials: 'include',
        })

        if (!verifyResponse.ok) {
          router.push('/staff/login')
          return
        }

        const verifyData = await verifyResponse.json()
        const authenticatedStaff = verifyData.staff as Staff
        let authenticatedStaffCode = authenticatedStaff.staffCode
        if (!authenticatedStaffCode) {
          const staffResponse = await fetch(`${API_URL}/api/staff/${authenticatedStaff.id}`, {
            credentials: 'include',
          })
          if (staffResponse.ok) {
            const staffData = await staffResponse.json()
            authenticatedStaffCode = staffData.staff?.staffCode || staffData.staffCode || ''
          }
        }
        setStaff({ ...authenticatedStaff, staffCode: authenticatedStaffCode })

        // The URL must use the public staffCode, not the database staff id.
        // Redirect stale or malformed links to the authenticated staff route.
        if (!authenticatedStaffCode) {
          setError('Your staff booking code is unavailable. Please contact an administrator.')
          return
        }
        if (authenticatedStaffCode !== staffCode) {
          router.replace(`/staff/${authenticatedStaffCode}/bookings`)
          return
        }

        const response = await fetch(`${API_URL}/api/staff/code/${authenticatedStaff.staffCode}/bookings`, {
          credentials: 'include',
        })

        if (!response.ok) {
          setError(response.status === 404 ? 'Staff member not found' : 'Failed to load bookings')
          return
        }

        const data = await response.json()
        setBookings(data.bookings || [])
        setStaffName(data.staffName || `${authenticatedStaff.firstName}'s`)
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !staff) {
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
    <div className="min-h-screen bg-background">
      <StaffSidebar staff={staff} staffCode={staffCode} onLogout={async () => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
        await fetch(`${API_URL}/api/staff-auth/logout`, { method: 'POST', credentials: 'include' })
        router.push('/staff/login')
      }} />
      <main className="min-w-0 px-4 pb-10 pt-20 md:ml-72 md:px-8 md:pt-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6 pl-12 md:pl-0">
            <div>
              <p className="text-sm font-medium text-primary">Staff workspace</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">{staffName} Bookings</h1>
              <p className="mt-2 text-muted-foreground">Review and manage your upcoming appointments.</p>
            </div>
            <Button size="sm" onClick={copyBookingLink} variant="outline" className="gap-2">
              <Copy className="h-4 w-4" />
              Copy booking link
            </Button>
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
                            {booking.customer.name}
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
                            {new Date(booking.startTime).toLocaleDateString()} at{' '}
                            {new Date(booking.startTime).toLocaleTimeString([], {
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
      </main>
    </div>
  )
}
