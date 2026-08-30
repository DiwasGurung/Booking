'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Calendar, CheckCircle, Clock, Copy, Link as LinkIcon, User, Mail, Loader } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { StaffSidebar } from '@/components/StaffSidebar'

interface Staff {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  role: string
  businessId: string
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

export default function StaffDashboard() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [staff, setStaff] = useState<Staff | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [staffCode, setStaffCode] = useState('')

  useEffect(() => {
    const verifyAndLoadData = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

        // Verify auth
        const verifyResponse = await fetch(`${API_URL}/api/staff-auth/verify`, {
          credentials: 'include',
        })

        if (!verifyResponse.ok) {
          router.push('/staff/login')
          return
        }

        const verifyData = await verifyResponse.json()
        const authenticatedStaff = verifyData.staff as Staff
        setStaff(authenticatedStaff)

        // Prefer the auth response, with a correctly addressed ID lookup as a
        // compatibility fallback for an already-running backend process.
        let resolvedStaffCode = authenticatedStaff.staffCode
        if (!resolvedStaffCode) {
          const staffResponse = await fetch(`${API_URL}/api/staff/${authenticatedStaff.id}`, {
            credentials: 'include',
          })
          if (staffResponse.ok) {
            const staffData = await staffResponse.json()
            resolvedStaffCode = staffData.staffCode || staffData.staff?.staffCode || ''
          }
        }
        setStaffCode(resolvedStaffCode)

        // Get bookings
        // Use the public staff-code route first because it is available on
        // both the current and older backend processes.
        let bookingsResponse = await fetch(
          resolvedStaffCode
            ? `${API_URL}/api/staff/code/${resolvedStaffCode}/bookings`
            : `${API_URL}/api/staff/${authenticatedStaff.id}/bookings`,
          { credentials: 'include' }
        )

        // Fall back to the authenticated endpoint when the code route is unavailable.
        if (!bookingsResponse.ok && resolvedStaffCode) {
          bookingsResponse = await fetch(
            `${API_URL}/api/staff/${authenticatedStaff.id}/bookings`,
            { credentials: 'include' }
          )
        }

        if (!bookingsResponse.ok) {
          throw new Error('Failed to load staff bookings')
        }

        const bookingsData = await bookingsResponse.json()
        setBookings(Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || [])
      } catch (err: any) {
        console.error('Error loading dashboard:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    verifyAndLoadData()
  }, [router])

  const handleLogout = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      await fetch(`${API_URL}/api/staff-auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })

      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully',
      })

      router.push('/staff/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const copyBookingLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const bookingLink = `${baseUrl}/staff/${staffCode}/book`

    navigator.clipboard.writeText(bookingLink).then(() => {
      toast({
        title: 'Copied!',
        description: 'Your booking link has been copied to clipboard',
      })
    })
  }

const now = new Date()
const upcomingBookings = bookings.filter(
  (booking) =>
    !['COMPLETED', 'CANCELLED'].includes(booking.status) &&
    new Date(booking.startTime) >= now
)

const upcomingBookingsCount = bookings.filter((booking) => {
  const start = new Date(booking.startTime)
  return !['COMPLETED', 'CANCELLED'].includes(booking.status) && start >= now
}).length
  const completedBookings = bookings.filter((booking) => booking.status === 'COMPLETED').length
  const pendingBookings = bookings.filter((booking) => ['PENDING', 'UNVERIFIED'].includes(booking.status)).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Not Authenticated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Please log in to view your dashboard.</p>
            <Button onClick={() => router.push('/staff/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <StaffSidebar staff={staff} staffCode={staffCode} onLogout={handleLogout} />
      <main className="min-w-0 px-4 pb-10 pt-20 md:ml-72 md:px-8 md:pt-10">
        <div className="mx-auto max-w-5xl">

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-2">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Overview */}
        <div className="mb-8 flex items-end justify-between gap-4 pl-12 md:pl-0">
          <div>
            <p className="text-sm font-medium text-primary">Staff workspace</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Track your appointments and share your booking page.</p>
          </div>
          <Button asChild className="hidden sm:flex">
            <Link href={staffCode ? `/staff/${staffCode}/bookings` : '/staff/dashboard'}>
              View bookings
            </Link>
          </Button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total bookings', value: bookings.length, icon: Calendar, tone: 'bg-primary/10 text-primary' },
            { label: 'Upcoming', value: upcomingBookingsCount, icon: Clock, tone: 'bg-blue-500/10 text-blue-700' },
            { label: 'Completed', value: completedBookings, icon: CheckCircle, tone: 'bg-emerald-500/10 text-emerald-700' },
            { label: 'Needs attention', value: pendingBookings, icon: AlertCircle, tone: 'bg-amber-500/10 text-amber-700' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border-border bg-card p-5 shadow-sm">
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight">{stat.value}</p>
              </Card>
            )
          })}
        </div>

        {/* Profile Card */}
        <Card id="profile" className="mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-semibold">{staff.firstName} {staff.lastName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{staff.email}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Role</p>
                  <p className="font-semibold">{staff.role}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Link Card */}
        <Card className="mb-8 bg-gradient-to-br from-green-50 to-green-50/50 border-green-200">
          <CardHeader>
            <CardTitle>Your Booking Link</CardTitle>
            <CardDescription>Share this link with customers so they can book directly with you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <LinkIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground truncate">
                      {staffCode && typeof window !== 'undefined'
                        ? `${window.location.origin}/staff/${staffCode}/book`
                        : 'Booking link is loading...'}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyBookingLink}
                  disabled={!staffCode}
                  className="ml-2 flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {staffCode ? (
                  <Button className="w-full" asChild>
                    <Link href={`/staff/${staffCode}/bookings`}>
                      View Your Bookings
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" disabled>
                    Loading booking code...
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
            <CardDescription>Your confirmed appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No upcoming bookings yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Share your booking link to get your first booking!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Customer Info */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Customer</p>
                        <p className="font-semibold">{booking.customer.name}</p>
                        <p className="text-sm text-muted-foreground">{booking.customer.email}</p>
                      </div>

                      {/* Service & Time */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Service</p>
                        <p className="font-semibold">{booking.service.name}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{booking.service.duration} minutes</span>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Appointment</p>
                        <p className="font-semibold">
                          {new Date(booking.startTime).toLocaleDateString()}
                        </p>
                        <p className="text-sm">
                          {new Date(booking.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm">{booking.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </main>
    </div>
  )
}
