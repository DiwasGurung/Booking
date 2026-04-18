'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/authContext'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock, MapPin, Star, Eye, Loader } from 'lucide-react'
import { bookingsApi } from '@/lib/api'
import { format } from 'date-fns'
import { useRoleProtection } from '@/hooks/useRoleProtection'

interface Booking {
  id: string
  status: string
  startTime: string
  service?: {
    name: string
    price: number
  }
  business?: {
    name: string
    address: string
    city: string
  }
  notes?: string
}

export default function MyBookingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { loading: authLoading } = useRoleProtection({ requiredRole: 'CUSTOMER' })
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    if (user?.id) {
      loadBookings()
    }
  }, [user?.id])

  const loadBookings = async () => {
    try {
      setLoading(true)
      const response = await bookingsApi.getCustomerBookings(user?.id || '')
      const data = Array.isArray(response.data) ? response.data : (response.data as any)?.bookings || []
      setBookings(data)
    } catch (error) {
      console.error('[v0] Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-900',
      CONFIRMED: 'bg-blue-100 text-blue-900',
      COMPLETED: 'bg-green-100 text-green-900',
      CANCELLED: 'bg-red-100 text-red-900',
    }
    return colors[status] || 'bg-gray-100 text-gray-900'
  }

  const isUpcoming = (startTime: string) => new Date(startTime) > new Date()
  const upcomingBookings = bookings.filter(b => isUpcoming(b.startTime) && b.status !== 'CANCELLED')
  const pastBookings = bookings.filter(b => !isUpcoming(b.startTime) || b.status === 'CANCELLED')

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border border-border shadow-lg p-8 text-center">
            <p className="text-lg font-semibold text-foreground mb-4">Please log in to view your bookings</p>
            <Button onClick={() => router.push('/login')}>Sign In</Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Bookings</h1>
          <p className="text-muted-foreground">View and manage your service bookings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
            <TabsTrigger value="history">History ({pastBookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {loading ? (
              <Card className="border border-border shadow-lg p-8 text-center">
                <Loader className="w-8 h-8 animate-spin text-primary mx-auto" />
              </Card>
            ) : upcomingBookings.length === 0 ? (
              <Card className="border border-border shadow-lg p-8 text-center">
                <p className="text-muted-foreground mb-4">No upcoming bookings</p>
                <Button onClick={() => router.push('/search')}>Browse Services</Button>
              </Card>
            ) : (
              upcomingBookings.map((booking) => (
                <Card key={booking.id} className="border border-border shadow-lg p-6 hover:shadow-xl transition">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground mb-2">{booking.service?.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{booking.business?.name}</p>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-sm text-foreground">
                          {format(new Date(booking.startTime), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm text-foreground">
                          {format(new Date(booking.startTime), 'h:mm a')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm text-foreground text-ellipsis overflow-hidden">
                          {booking.business?.address}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-end">
                      <div className="text-right mb-4">
                        <p className="text-sm text-muted-foreground mb-1">Total Price</p>
                        <p className="text-2xl font-bold text-foreground">${booking.service?.price.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {loading ? (
              <Card className="border border-border shadow-lg p-8 text-center">
                <Loader className="w-8 h-8 animate-spin text-primary mx-auto" />
              </Card>
            ) : pastBookings.length === 0 ? (
              <Card className="border border-border shadow-lg p-8 text-center">
                <p className="text-muted-foreground">No past bookings</p>
              </Card>
            ) : (
              pastBookings.map((booking) => (
                <Card key={booking.id} className="border border-border shadow-lg p-6 opacity-75 hover:opacity-100 transition">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground mb-2">{booking.service?.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{booking.business?.name}</p>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-sm text-foreground">
                          {format(new Date(booking.startTime), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm text-foreground">
                          {format(new Date(booking.startTime), 'h:mm a')}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-end">
                      <div className="text-right mb-4">
                        <p className="text-sm text-muted-foreground mb-1">Total Price</p>
                        <p className="text-2xl font-bold text-foreground">${booking.service?.price.toFixed(2)}</p>
                      </div>
                      {booking.status === 'COMPLETED' && (
                        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                          <Star className="w-4 h-4 mr-1" />
                          Leave Review
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
