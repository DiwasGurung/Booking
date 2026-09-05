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
  }, [user, authLoading, router])

  const fetchUserBookings = async (userId: string) => {
    try {
      setBookingsLoading(true)
      const response = await bookingsApi.getCustomerBookings(userId)
      setBookings(response.data || [])
    } catch (err) {
      console.error('Error fetching bookings:', err)
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

  if (authLoading) {
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
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-muted/70 p-1 sm:gap-2">
            <TabsTrigger
              value="personal"
              className="min-w-0 gap-1.5 rounded-lg px-2 py-2.5 text-xs leading-tight sm:px-3 sm:text-sm"
            >
              <User className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate sm:hidden">Personal</span>
              <span className="hidden truncate sm:inline">Personal Information</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="min-w-0 gap-1.5 rounded-lg px-2 py-2.5 text-xs leading-tight sm:px-3 sm:text-sm"
            >
              <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="min-w-0 gap-1.5 rounded-lg px-2 py-2.5 text-xs leading-tight sm:px-3 sm:text-sm"
            >
              <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate sm:hidden">Bookings</span>
              <span className="hidden truncate sm:inline">My Bookings</span>
            </TabsTrigger>
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
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                My Bookings
              </h2>

              {bookingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No bookings yet. Start booking services today!</p>
                  <Button className="mt-4" onClick={() => router.push('/search')}>
                    Browse Services
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking: any) => (
                    <Card key={booking.id} className="p-4 border border-border/40 hover:border-border/80 transition-colors">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left Column */}
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Service</p>
                            <p className="font-semibold text-foreground">{booking.service?.name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Business</p>
                            <p className="font-semibold text-foreground">{booking.business?.name || 'N/A'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                booking.status === 'CONFIRMED'
                                  ? 'default'
                                  : booking.status === 'COMPLETED'
                                  ? 'secondary'
                                  : booking.status === 'CANCELLED'
                                  ? 'destructive'
                                  : 'outline'
                              }
                            >
                              {booking.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 mt-1 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Date & Time</p>
                              <p className="font-semibold text-foreground">
                                {format(new Date(booking.startTime), 'MMM dd, yyyy')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(booking.startTime), 'h:mm a')} -{' '}
                                {format(new Date(booking.endTime), 'h:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Location</p>
                              <p className="text-sm font-medium text-foreground">
                                {booking.business?.city}, {booking.business?.state}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Booking Notes */}
                      {booking.notes && (
                        <div className="mt-4 p-3 bg-muted/30 rounded text-sm">
                          <p className="text-muted-foreground">Notes: {booking.notes}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-4 flex gap-2">
                        {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            Cancel Booking
                          </Button>
                        )}
                        {booking.status === 'COMPLETED' && (
                          <Button variant="outline" size="sm">
                            Leave Review
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
