'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader, Calendar, DollarSign, CheckCircle, TrendingUp, AlertCircle, Eye, ArrowRight, BarChart3, Settings, CreditCard, Building2 } from 'lucide-react'
import { businessApi, bookingsApi, paymentApi } from '@/lib/api'
import { useBusinessId } from '@/hooks/useBusinessId'
import { useRoleProtection } from '@/hooks/useRoleProtection'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'

interface BusinessStats {
  totalBookings: number
  totalRevenue: number
  completedBookings: number
  averageRating: number
  conversionRate: number
}

interface Booking {
  id: string
  serviceId: string
  startTime: string
  customerName: string
  status: string
  service?: {
    name: string
    price: number
  }
}

interface Payment {
  id: string
  amount: number
  currency: string
  gateway: string
  status: string
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { loading: authLoading } = useRoleProtection({ requiredRole: 'BUSINESS_OWNER' })
  const { businessId, loading: fetchingBusinessId, error: businessIdError } = useBusinessId()
  const { subscriptionStatus, loading: subscriptionLoading, hasValidSubscription } = useSubscriptionStatus()
  const [stats, setStats] = useState<BusinessStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (businessId && typeof businessId === 'string') {
      loadDashboardData()
    }
  }, [businessId])

  const castBusinessId = businessId as string

  // Check subscription validity before allowing dashboard access
  useEffect(() => {
    if (!subscriptionLoading && !hasValidSubscription && businessId) {
      console.log('[v0] No valid subscription - redirecting to subscription page')
      router.push(`/subscription?businessId=${businessId}`)
    }
  }, [hasValidSubscription, subscriptionLoading, businessId, router])

  // Redirect to login only if not authenticated, otherwise redirect to business setup
  useEffect(() => {
    if (!fetchingBusinessId && businessIdError) {
      // Check if user is a business owner without a business
      // If so, redirect to business setup, otherwise redirect to login
      if (businessIdError.includes('No business found')) {
        console.log('[v0] Business owner with no business - redirecting to setup')
        router.push('/business/setup')
      } else {
        // User not authenticated
        console.log('[v0] User not authenticated - redirecting to login')
        router.push('/login')
      }
    }
  }, [fetchingBusinessId, businessIdError, router])

  async function loadDashboardData() {
    try {
      setLoading(true)
      setError(null)
      
      const [statsResponse, bookingsResponse, paymentsResponse] = await Promise.all([
        businessApi.getStats(castBusinessId),
        bookingsApi.getBusinessBookings(castBusinessId, 1, 5),
        paymentApi.getUserPayments(castBusinessId, 1, 5),
      ])

      if (statsResponse.data && typeof statsResponse.data === 'object') {
        setStats(statsResponse.data as BusinessStats)
      }

      if (bookingsResponse.data) {
        const bookings = Array.isArray(bookingsResponse.data) 
          ? bookingsResponse.data 
          : (bookingsResponse.data as any).bookings || (bookingsResponse.data as any).data || []
        setRecentBookings(bookings)
      }

      if (paymentsResponse.data) {
        const payments = Array.isArray(paymentsResponse.data)
          ? paymentsResponse.data
          : (paymentsResponse.data as any).payments || []
        setRecentPayments(payments)
      }
    } catch (err) {
      console.error('[v0] Failed to load dashboard:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
      router.push('/login')
    } catch (err) {
      console.error('[v0] Logout failed:', err)
    }
  }

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats?.totalBookings ?? 0,
      icon: Calendar,
      href: '#bookings'
    },
    {
      title: 'Total Revenue',
      value: `$${(stats?.totalRevenue ?? 0).toFixed(2)}`,
      icon: DollarSign,
      href: '/dashboard/payments'
    },
    {
      title: 'Completed',
      value: stats?.completedBookings ?? 0,
      icon: CheckCircle,
      href: '#bookings'
    },
    {
      title: 'Avg Rating',
      value: stats?.averageRating?.toFixed(1) ?? '0.0',
      icon: TrendingUp,
      href: '#'
    },
  ]

  if (fetchingBusinessId || loading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (businessIdError || error) {
    // If it's a "no business found" error, show a helpful message instead of generic error
    if (businessIdError?.includes('No business found')) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-border shadow-lg p-8">
            <div className="text-center">
              <Building2 className="w-16 h-16 mx-auto text-primary mb-4 opacity-80" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to BookFlow!</h1>
              <p className="text-muted-foreground mb-6">
                To access your dashboard, you first need to set up your business profile.
              </p>
              <Link href="/business/setup" className="block">
                <Button className="w-full" size="lg">
                  Set Up Business Profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-background">
        <Sidebar userRole="BUSINESS_OWNER" />
        <main className="md:ml-64 pt-6 px-4 md:px-8 py-8">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{businessIdError || error}</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!businessId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No business found. Please contact support.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole="BUSINESS_OWNER" />

      {/* Main Content */}
      <main className="md:ml-64 pt-6 px-4 md:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Overview' },
          ]}
        />

        {/* Subscription Status Banner */}
        {subscriptionStatus && (
          <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
            subscriptionStatus.status === 'TRIAL' 
              ? 'bg-blue/10 border-blue/20' 
              : 'bg-green/10 border-green/20'
          }`}>
            <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              subscriptionStatus.status === 'TRIAL' ? 'text-blue-600' : 'text-green-600'
            }`} />
            <div>
              <p className="font-medium">
                {subscriptionStatus.status === 'TRIAL' 
                  ? `Free Trial Active - ${subscriptionStatus.daysRemaining} days remaining` 
                  : `${subscriptionStatus.planName} - Active`}
              </p>
              <p className="text-sm text-muted-foreground">
                {subscriptionStatus.status === 'TRIAL' 
                  ? 'You are on a free trial. Please set up payment to continue using after trial ends.' 
                  : `Expires on ${new Date(subscriptionStatus.expiresAt!).toLocaleDateString()}`}
              </p>
            </div>
            {subscriptionStatus.status === 'TRIAL' && (
              <Link href="/subscription" className="ml-auto">
                <Button size="sm" variant="outline">
                  Upgrade Now
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Error banner */}
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{error}</p>
              <p className="text-sm text-muted-foreground">Please refresh the page or contact support</p>
            </div>
          </div>
      

        {/* Navigation Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link href="/dashboard">
            <Badge className="bg-primary text-primary-foreground cursor-pointer">
              Dashboard
            </Badge>
          </Link>
          <Link href="/dashboard/payments">
            <Badge variant="outline" className="hover:bg-muted cursor-pointer">
              Payments
            </Badge>
          </Link>
          <Link href="/dashboard/bookings">
            <Badge variant="outline" className="hover:bg-muted cursor-pointer">
              Bookings
            </Badge>
          </Link>
          <Link href="/dashboard/services">
            <Badge variant="outline" className="hover:bg-muted cursor-pointer">
              Services
            </Badge>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <Link key={idx} href={card.href} className="block hover:scale-105 transition-transform">
                <Card className="border border-border shadow-sm hover:shadow-md p-6 h-full">
                  <div className="rounded-lg p-3 mb-4 w-fit bg-primary/10">
                    <Icon className="text-primary w-6 h-6" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-foreground">{card.value}</p>
                  <div className="flex items-center mt-2 text-xs text-primary">
                    <Eye className="w-3 h-3 mr-1" />
                    View Details
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Conversion Rate */}
        {stats && (
          <Card className="border border-border shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Conversion Rate</h3>
                <p className="text-sm text-muted-foreground">Booking success rate</p>
              </div>
              <Badge className="bg-primary text-primary-foreground text-lg px-3 py-1">
                {stats.conversionRate.toFixed(1)}%
              </Badge>
            </div>
            <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${Math.min(stats.conversionRate, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round((stats.completedBookings / Math.max(stats.totalBookings, 1)) * 100)}% of bookings completed successfully
            </p>
          </Card>
        )}

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Recent Bookings
              </h2>
              <Link href="/dashboard/bookings">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <Card className="border border-border shadow-sm p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg text-foreground font-medium">No Recent Bookings</p>
                <p className="text-sm text-muted-foreground mt-1">Your bookings will appear here</p>
              </Card>
            ) : (
              <Card className="border border-border shadow-sm overflow-hidden">
                <div className="divide-y divide-border">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{booking.customerName}</p>
                          <p className="text-sm text-muted-foreground">{booking.service?.name || 'Service'}</p>
                        </div>
                        <Badge
                          className={
                            booking.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : booking.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-primary/10 text-primary'
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          {new Date(booking.startTime).toLocaleDateString()}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          ${(booking.service?.price || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Recent Payments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-accent" />
                Recent Payments
              </h2>
              <Link href="/dashboard/payments">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>

            {recentPayments.length === 0 ? (
              <Card className="border border-border shadow-sm p-8 text-center">
                <DollarSign className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg text-foreground font-medium">No Recent Payments</p>
                <p className="text-sm text-muted-foreground mt-1">Payment history will appear here</p>
              </Card>
            ) : (
              <Card className="border border-border shadow-sm overflow-hidden">
                <div className="divide-y divide-border">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{payment.gateway}</p>
                          <p className="text-sm text-muted-foreground">{payment.currency}</p>
                        </div>
                        <Badge
                          className={
                            payment.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : payment.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-destructive/10 text-destructive'
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          ${payment.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 p-6 bg-primary text-primary-foreground rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/dashboard/bookings">
              <Button variant="secondary" className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                View Bookings
              </Button>
            </Link>
            <Link href="/dashboard/payments">
              <Button variant="secondary" className="w-full">
                <BarChart3 className="w-4 h-4 mr-2" />
                Payment Analytics
              </Button>
            </Link>
            <Link href="/dashboard/services">
              <Button variant="secondary" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Manage Services
              </Button>
            </Link>
            <Link href="/dashboard/subscription">
              <Button variant="secondary" className="w-full">
                <CreditCard className="w-4 h-4 mr-2" />
                Subscription
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
