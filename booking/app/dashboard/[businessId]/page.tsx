'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { AuthWrapper } from '@/components/AuthWrapper'
import Link from 'next/link'
import {
  Loader, Calendar, CheckCircle, TrendingUp, AlertCircle,
  Eye, ArrowRight, BarChart3, Clock
} from 'lucide-react'
import { businessApi, bookingsApi, paymentApi, businessHoursApi } from '@/lib/api'
import { useBusinessId } from '@/hooks/useBusinessId'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'

interface BusinessStats {
  totalBookings: number
  completedBookings: number
  averageRating: number
  conversionRate: number
}

interface Booking {
  id: string
  serviceId: string
  startTime: string
  endTime: string
  customerName: string
  customerEmail: string
  customerPhone: string
  status: string
  isEmailVerified: boolean
  notes?: string
  service?: {
    name: string
    price: number
    duration?: number
  }
  staff?: {
    firstName: string
    lastName: string
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

export default function BusinessDashboardPage() {
  const router = useRouter()
  const { businessId, loading: businessLoading } = useBusinessId()
  const { subscriptionStatus, loading: subscriptionLoading } = useSubscriptionStatus()
  const [stats, setStats] = useState<BusinessStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // null = still loading; true/false once hours are known
  const [hoursConfigured, setHoursConfigured] = useState<boolean | null>(null)

  // Check subscription status and redirect if no subscription
  useEffect(() => {
    if (!subscriptionLoading && subscriptionStatus) {
      console.log('[dashboard] Subscription status:', subscriptionStatus)
      
      // Redirect only if no subscription, or if CANCELLED and already expired
      if (subscriptionStatus.hasSubscription === false) {
        console.log('[dashboard] No subscription found, redirecting to subscription page...')
        router.push('/subscription?from=setup')
      }
    }
  }, [subscriptionStatus, subscriptionLoading, router])

  useEffect(() => {
    if (businessId) {
      loadDashboardData()
    }
  }, [businessId])

  async function loadDashboardData() {
    if (!businessId) return
    
    try {
      setLoading(true)
      setError(null)

      const [statsResponse, bookingsResponse, paymentsResponse, hoursResponse] = await Promise.all([
        businessApi.getStats(businessId),
        bookingsApi.getBusinessBookings(businessId, 1, 5),
        paymentApi.getBusinessPayments(businessId, 1, 5),
        businessHoursApi.getBusinessHours(businessId).catch(() => null),
      ])

      // Hours are "configured" only if there is at least one open day.
      const hours = hoursResponse?.data
      setHoursConfigured(Array.isArray(hours) && hours.some((h: any) => !h.isClosed))

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
    } catch (error) {
      console.error('[dashboard] Failed to load dashboard:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats?.totalBookings ?? 0,
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/dashboard/bookings'
    },
    {
      title: 'Completed',
      value: stats?.completedBookings ?? 0,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      href: '/dashboard/bookings'
    },
  ]

  return (
    <AuthWrapper mode="business-only">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Sidebar userRole="BUSINESS_OWNER" />

        {/* Main Content */}
        <main className="md:ml-64 pt-20 md:pt-20 px-3 sm:px-4 md:px-8 py-6 md:py-8 overflow-x-hidden">
          {/* Breadcrumbs */}
          <div className="mb-4 md:mb-6">
            <Breadcrumbs
              items={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Overview' },
              ]}
            />
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg flex flex-col sm:flex-row items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-red-900 text-sm md:text-base break-words">{error}</p>
                <p className="text-xs md:text-sm text-red-700">Please refresh the page or contact support</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={loadDashboardData}
                className="w-full sm:w-auto flex-shrink-0"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Subscription Status Banner */}
          {subscriptionStatus && !subscriptionLoading && (
            <div className={`mb-4 md:mb-6 p-3 md:p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center gap-3 ${
              subscriptionStatus.status === 'TRIAL' 
                ? 'bg-blue-50 border-blue-200' 
                : subscriptionStatus.status === 'CANCELLED'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                subscriptionStatus.status === 'TRIAL' 
                  ? 'text-blue-600' 
                  : subscriptionStatus.status === 'CANCELLED'
                  ? 'text-amber-600'
                  : 'text-green-600'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm md:text-base break-words">
                  {subscriptionStatus.status === 'CANCELLED'
                    ? `Your subscription will end on ${subscriptionStatus.expiresAt && !Number.isNaN(new Date(subscriptionStatus.expiresAt).getTime()) ? new Date(subscriptionStatus.expiresAt).toLocaleDateString() : 'soon'}`
                    : subscriptionStatus.status === 'TRIAL' 
                    ? `Free Trial Active - ${subscriptionStatus.daysRemaining} days remaining` 
                    : `${subscriptionStatus.planName} - Active`}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {subscriptionStatus.status === 'TRIAL' 
                    ? 'You are on a free trial. Please set up payment to continue using after trial ends.' 
                    : subscriptionStatus.expiresAt && !Number.isNaN(new Date(subscriptionStatus.expiresAt).getTime())
                    ? `Expires on ${new Date(subscriptionStatus.expiresAt).toLocaleDateString()}`
                    : 'Subscription expiry date unavailable'}
                </p>
              </div>
              {subscriptionStatus.status === 'TRIAL' && (
                <Link href="/subscription" className="w-full sm:w-auto flex-shrink-0">
                  <Button size="sm" variant="outline" className="w-full sm:w-auto">
                    Upgrade Now
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Business Hours Setup Banner - blocks bookings until configured */}
          {!loading && hoursConfigured === false && (
            <div className="mb-4 md:mb-6 p-4 md:p-5 rounded-lg border border-amber-300 bg-amber-50 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold text-amber-900 text-sm md:text-base">Set up your business hours</p>
                  <p className="text-xs md:text-sm text-amber-800 mt-0.5">
                    Customers can&apos;t book appointments until you configure your operating hours. Online booking stays locked until then.
                  </p>
                </div>
              </div>
              <Link href="/dashboard/business-hours" className="w-full sm:w-auto flex-shrink-0">
                <Button size="sm" className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white">
                  Configure Hours
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12 md:py-16">
              <div className="text-center">
                <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-600 text-sm md:text-base">Loading dashboard...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                {statCards.map((card, idx) => {
                  const Icon = card.icon
                  return (
                    <Link key={idx} href={card.href} className="block hover:scale-105 transition-transform">
                      <Card className="border border-slate-200 shadow-sm hover:shadow-md p-4 md:p-6 h-full bg-white">
                        <div className={`${card.bg} rounded-lg p-2 md:p-3 mb-3 md:mb-4 w-fit`}>
                          <Icon className={`${card.color} w-5 h-5 md:w-6 md:h-6`} />
                        </div>
                        <p className="text-xs md:text-sm text-slate-500 mb-2 font-medium">{card.title}</p>
                        <p className="text-2xl md:text-3xl font-bold text-slate-900">{card.value}</p>
                        <div className="flex items-center mt-2 text-xs text-blue-600">
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </div>
                      </Card>
                    </Link>
                  )
                })}
              </div>

              {/* Analytics Grid: Conversion Rate & Payments */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-8 mb-6 md:mb-8">
                {/* Conversion Rate Analytics */}
                {stats && (
                  <Card className="border border-slate-200 shadow-sm p-4 md:p-6 bg-white">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                      <div className="min-w-0">
                        <h3 className="text-base md:text-lg font-semibold text-slate-900">Conversion Rate</h3>
                        <p className="text-xs md:text-sm text-slate-500">Booking success rate</p>
                      </div>
                      <Badge className="bg-blue-600 text-white text-sm md:text-lg px-3 py-1 flex-shrink-0">
                        {stats.conversionRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-300"
                        style={{ width: `${Math.min(stats.conversionRate, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                      {Math.round((stats.completedBookings / Math.max(stats.totalBookings, 1)) * 100)}% of bookings completed successfully
                    </p>
                  </Card>
                )}

                {/* Payment Summary */}
                {recentPayments.length > 0 && (
                  <Card className="border border-slate-200 shadow-sm p-6 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Recent Payments</h3>
                        <p className="text-sm text-slate-500">Latest subscription payments</p>
                      </div>
                      <Badge className="bg-green-600 text-white text-lg px-3 py-1">
                        {recentPayments.filter(p => p.status === 'COMPLETED').length} Completed
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {recentPayments.slice(0, 3).map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full {
                              payment.status === 'COMPLETED' ? 'bg-green-500' :
                              payment.status === 'PENDING' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`} />
                            <span className="text-sm text-slate-600">{payment.gateway}</span>
                          </div>
                          <span className="font-semibold text-slate-900">Rs.{payment.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <Link href="/dashboard/payments">
                      <Button variant="ghost" size="sm" className="w-full mt-4 text-blue-600">
                        View All Payments <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </Card>
                )}
              </div>

              {/* Recent Bookings & Analytics Overview */}
              <div className="grid grid-cols-1 gap-3 md:gap-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Recent Bookings
                    </h2>
                    <Link href="/dashboard/bookings">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                        View All <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>

                  {recentBookings.length === 0 ? (
                    <Card className="border border-slate-200 shadow-sm p-8 text-center bg-white">
                      <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-lg text-slate-600 font-medium">No Recent Bookings</p>
                      <p className="text-sm text-slate-500 mt-1">Your bookings will appear here</p>
                    </Card>
                  ) : (
                    <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
                      <div className="divide-y divide-slate-200">
                        {recentBookings.map((booking) => (
                          <div key={booking.id} className="p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 truncate">{booking.customerName}</p>
                                <p className="text-xs text-slate-500 truncate">{booking.customerEmail}</p>
                                {booking.customerPhone && (
                                  <p className="text-xs text-slate-500 truncate">{booking.customerPhone}</p>
                                )}
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Badge
                                  className={
                                    booking.status === 'COMPLETED'
                                      ? 'bg-green-100 text-green-800 text-xs'
                                      : booking.status === 'UNVERIFIED'
                                        ? 'bg-orange-100 text-orange-800 text-xs'
                                      : booking.status === 'PENDING'
                                        ? 'bg-yellow-100 text-yellow-800 text-xs'
                                        : booking.status === 'CONFIRMED'
                                          ? 'bg-blue-100 text-blue-800 text-xs'
                                          : 'bg-slate-100 text-slate-800 text-xs'
                                  }
                                >
                                  {booking.status}
                                </Badge>
                                {!booking.isEmailVerified && booking.status === 'UNVERIFIED' && (
                                  <Badge className="bg-orange-100 text-orange-800 text-xs">
                                    Verify Email
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                              <div className="space-y-0.5">
                                <p><span className="font-medium">Service:</span> {booking.service?.name || 'N/A'}</p>
                                {booking.staff && (
                                  <p><span className="font-medium">Staff:</span> {booking.staff.firstName} {booking.staff.lastName}</p>
                                )}
                                <p>{new Date(booking.startTime).toLocaleDateString()} {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              <span className="text-sm font-semibold text-slate-900 flex-shrink-0">
                                Rs.{(booking.service?.price || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
            </>
          )}
        </main>
      </div>
    </AuthWrapper>
  )
}
