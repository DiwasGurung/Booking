'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/authContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usersApi, bookingsApi } from '@/lib/api'
import { User, Lock, AlertCircle, CheckCircle2, Calendar, Clock, MapPin, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { useRoleProtection } from '@/hooks/useRoleProtection'
import { ProfilePhoneVerification } from '@/components/ProfilePhoneVerification'


export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const { loading: roleCheckLoading } = useRoleProtection()
  const [activeTab, setActiveTab] = useState('personal')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Bookings state
  const [bookings, setBookings] = useState<any[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)

  // Personal Info Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setIsPhoneVerified(user.isPhoneVerified || false)

      // Fetch user bookings
      fetchUserBookings(user.id)
    }
  }, [user, isLoading, router])

  const fetchUserBookings = async (userId: string) => {
    try {
      setBookingsLoading(true)
      const response = await bookingsApi.getCustomerBookings(userId)
      setBookings(response.data || [])
    } catch (err) {
      setBookings([])
    } finally {
      setBookingsLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!user?.id) {
      setError('User not found')
      return
    }

    try {
      setIsLoading(true)
      const response = await usersApi.updateProfile(user.id, {
        firstName,
        lastName,
        phone,
      })

      if (response.success) {
        setSuccess('Profile updated successfully')
        await refreshUser()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(response.error || 'Failed to update profile')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!newPassword || !currentPassword) {
      setError('Please fill in all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (!user?.id) {
      setError('User not found')
      return
    }

    try {
      setIsLoading(true)
      const response = await usersApi.changePassword(user.id, {
        currentPassword,
        newPassword,
      })

      if (response.success) {
        setSuccess('Password changed successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(response.error || 'Failed to change password')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return

    try {
      setError('')
      setIsLoading(true)

      const response = await bookingsApi.cancelBooking(bookingId)

      if (!response.success) {
        throw new Error(response.error || 'Failed to cancel booking')
      }

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: 'CANCELLED' }
            : booking
        )
      )

      setSuccess('Booking cancelled successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking')
    } finally {
      setIsLoading(false)
    }
  }
  if (isLoading || authLoading || roleCheckLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="flex-1 py-8 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account information and security settings</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold text-foreground mt-2">{bookings.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary/40" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {bookings.filter((b) => b.status === 'CONFIRMED').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600/40" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'N/A'}
                </p>
              </div>
              <User className="w-8 h-8 text-primary/40" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h2>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    disabled={isLoading}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    disabled={isLoading}
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    disabled={isLoading}
                  />
                </div>

                {/* User Role (Read-only) */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-foreground mb-2">
                    Account Type
                  </label>
                  <Input
                    id="role"
                    type="text"
                    value={user.role === 'BUSINESS_OWNER' ? 'Business Owner' : 'Customer'}
                    disabled
                    className="bg-muted"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            {/* Phone Verification */}
            <ProfilePhoneVerification
              phone={phone}
              isPhoneVerified={isPhoneVerified}
              onVerified={() => {
                setIsPhoneVerified(true)
                refreshUser()
              }}
            />

            {/* Change Password */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </h2>

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-2">
                    Current Password
                  </label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    disabled={isLoading}
                  />
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
                    New Password
                  </label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    disabled={isLoading}
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                    Confirm New Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    disabled={isLoading}
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </div>
              </form>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <Card className="overflow-hidden border-border/60 shadow-sm">
              <div className="border-b border-border/60 bg-muted/20 px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-semibold">
                      <Calendar className="h-5 w-5 text-primary" />
                      My Bookings
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      View and manage your upcoming and previous appointments.
                    </p>
                  </div>

                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    {bookings.length}
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {bookingsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
                    <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                    <h3 className="font-semibold">No bookings yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Start booking a service to see your appointments here.
                    </p>
                    <Button className="mt-5" onClick={() => router.push('/search')}>
                      Browse Services
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking: any) => {
                      const price = Number(booking.service?.price ?? 0)
                      const offerPrice =
                        booking.service?.offerPrice != null
                          ? Number(booking.service.offerPrice)
                          : null

                      const hasOffer =
                        offerPrice !== null &&
                        offerPrice >= 0 &&
                        offerPrice < price

                      const status = String(booking.status || '').toUpperCase()

                      return (
                        <article
                          key={booking.id}
                          className="overflow-hidden rounded-2xl border border-border/70 bg-card transition-shadow hover:shadow-md"
                        >
                          <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="mb-3 flex flex-wrap items-center gap-2">
                                <Badge
                                  variant={
                                    status === 'CONFIRMED'
                                      ? 'default'
                                      : status === 'COMPLETED'
                                        ? 'secondary'
                                        : status === 'CANCELLED'
                                          ? 'destructive'
                                          : 'outline'
                                  }
                                >
                                  {status || 'PENDING'}
                                </Badge>

                                {hasOffer && (
                                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                    Special offer
                                  </span>
                                )}
                              </div>

                              <h3 className="truncate text-lg font-bold text-foreground">
                                {booking.service?.name || 'Service'}
                              </h3>

                              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 shrink-0" />
                                {booking.business?.name || 'Business'}
                              </p>

                              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <div className="flex items-start gap-2">
                                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                  <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                      Appointment
                                    </p>
                                    <p className="mt-0.5 text-sm font-semibold">
                                      {format(new Date(booking.startTime), 'MMM dd, yyyy')}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {format(new Date(booking.startTime), 'h:mm a')} –{' '}
                                      {format(new Date(booking.endTime), 'h:mm a')}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-2">
                                  <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                  <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                      Service price
                                    </p>

                                    {hasOffer ? (
                                      <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
                                        <span className="text-lg font-bold text-emerald-700">
                                          Rs.{offerPrice.toFixed(2)}
                                        </span>
                                        <span className="text-sm text-muted-foreground line-through">
                                          Rs.{price.toFixed(2)}
                                        </span>
                                      </div>
                                    ) : (
                                      <p className="mt-0.5 text-lg font-bold">
                                        Rs.{price.toFixed(2)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-col gap-2 border-t border-border/60 pt-4 lg:w-36 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                              <p className="text-xs text-muted-foreground">
                                {booking.business?.city || 'Location'}
                                {booking.business?.state
                                  ? `, ${booking.business.state}`
                                  : ''}
                              </p>

                              {status !== 'CANCELLED' &&
                                status !== 'COMPLETED' && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isLoading}
                                    onClick={() => handleCancelBooking(booking.id)}
                                  >
                                    Cancel booking
                                  </Button>
                                )}
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
