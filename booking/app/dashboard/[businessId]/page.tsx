'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import Link from 'next/link'
import {
  Loader, Calendar, DollarSign, CheckCircle, TrendingUp, AlertCircle,
  ChevronRight, Eye, ArrowRight, BarChart3, TrendingDown, Users, Settings, CreditCard
} from 'lucide-react'
import { businessApi, bookingsApi, paymentApi } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
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

export default function BusinessDashboardPage() {
  const params = useParams()
  const businessId = params.businessId as string || 'demo-business-id'
  const { subscriptionStatus, loading: subscriptionLoading, hasValidSubscription } = useSubscriptionStatus()
  const [stats, setStats] = useState<BusinessStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check subscription validity before allowing dashboard access
  useEffect(() => {
    if (!subscriptionLoading && !hasValidSubscription && businessId) {
      console.log('[v0] No valid subscription - redirecting to subscription page')
      router.push(`/subscription?businessId=${businessId}`)
    }
  }, [hasValidSubscription, subscriptionLoading, businessId, router])

  useEffect(() => {
    async function checkAuth() {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
        const res = await fetch(`${baseUrl}/api/users/me`, {
          credentials: 'include',
        })

        if (!res.ok) {
          router.push('/login')
          return
        }

        const meData = await res.json()
      console.log("[v0] Logged in user data:", meData)

      // Extract user from response - handle both { user: {...} } and direct user formats
        const user = meData.user || meData

        if (user.role !== 'BUSINESS_OWNER') {
          router.push('/login')
          return
        }

        loadDashboardData()
      } catch (error) {
        console.error('[v0] Auth check failed:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  async function loadDashboardData() {
    try {
      setLoading(true)
      setError(null)

      const [statsResponse, bookingsResponse, paymentsResponse] = await Promise.all([
        businessApi.getStats(businessId),
        bookingsApi.getBusinessBookings(businessId, 1, 5),
        paymentApi.getUserPayments(businessId, 1, 5),
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
    } catch (error) {
      console.error('[v0] Failed to load dashboard:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
      localStorage.removeItem('token')
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
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '#bookings'
    },
    {
      title: 'Total Revenue',
      value: `$${(stats?.totalRevenue ?? 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
      href: '/dashboard/payments'
    },
    {
      title: 'Completed',
      value: stats?.completedBookings ?? 0,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      href: '#bookings'
    },
    {
      title: 'Avg Rating',
      value: stats?.averageRating?.toFixed(1) ?? '0.0',
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: '#'
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Sidebar userRole="BUSINESS_OWNER" />

      {/* Main Content */}
      <main className="md:ml-64 pt-12 md:pt-8 px-4 md:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Overview' },
          ]}
        />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">{error}</p>
              <p className="text-sm text-red-700">Please refresh the page or contact support</p>
            </div>
          </div>
        )}

        {/* Subscription Status Banner */}
        {subscriptionStatus && (
          <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
            subscriptionStatus.status === 'TRIAL' 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              subscriptionStatus.status === 'TRIAL' ? 'text-blue-600' : 'text-green-600'
            }`} />
            <div className="flex-1">
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <Link key={idx} href={card.href} className="block hover:scale-105 transition-transform">
                <Card className="border border-slate-200 shadow-sm hover:shadow-md p-6 h-full bg-white">
                  <div className={`${card.bg} rounded-lg p-3 mb-4 w-fit`}>
                    <Icon className={`${card.color} w-6 h-6`} />
                  </div>
                  <p className="text-sm text-slate-500 mb-2 font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                  <div className="flex items-center mt-2 text-xs text-blue-600">
                    <Eye className="w-3 h-3 mr-1" />
                    View Details
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Conversion Rate & Payment Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Conversion Rate */}
          {stats && (
            <Card className="border border-slate-200 shadow-sm p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Conversion Rate</h3>
                  <p className="text-sm text-slate-500">Booking success rate</p>
                </div>
                <Badge className="bg-blue-600 text-white text-lg px-3 py-1">
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
                      <div className={`w-2 h-2 rounded-full ${
                        payment.status === 'COMPLETED' ? 'bg-green-500' :
                        payment.status === 'PENDING' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <span className="text-sm text-slate-600">{payment.gateway}</span>
                    </div>
                    <span className="font-semibold text-slate-900">${payment.amount.toFixed(2)}</span>
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

          {/* Recent Bookings */}
          <div>
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
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{booking.customerName}</p>
                          <p className="text-sm text-slate-500">{booking.service?.name || 'Service'}</p>
                        </div>
                        <Badge
                          className={
                            booking.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500">
                          {new Date(booking.startTime).toLocaleDateString()}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          ${(booking.service?.price || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Quick Stats */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Performance Overview
            </h2>

            <div className="space-y-4">
              <Card className="border border-slate-200 shadow-sm p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Total Customers</p>
                      <p className="text-2xl font-bold text-slate-900">{stats?.totalBookings || 0}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </Card>

              <Card className="border border-slate-200 shadow-sm p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Completed Bookings</p>
                      <p className="text-2xl font-bold text-slate-900">{stats?.completedBookings || 0}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </Card>

              <Card className="border border-slate-200 shadow-sm p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <TrendingDown className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Pending Bookings</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {Math.max(0, (stats?.totalBookings || 0) - (stats?.completedBookings || 0))}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </Card>
            </div>
       
        </div>
      </main>
      </div>
  )
}
