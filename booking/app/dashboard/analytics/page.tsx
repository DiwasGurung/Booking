'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Loader, AlertCircle, TrendingUp, TrendingDown, BarChart3, Users, Calendar } from 'lucide-react'
import { businessApi, customerInsightsApi, type CustomerInsight } from '@/lib/api'
import { useBusinessId } from '@/hooks/useBusinessId'

interface AnalyticsData {
  totalBookings: number
  bookingGrowth: number
  totalCustomers: number
  newCustomers: number
  customersGrowth: number
  conversionRate: number
  bookingsByStatus: Record<string, number>
  topServices: Array<{ name: string; bookings: number }>
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { businessId, loading: fetchingBusinessId, error: businessIdError } = useBusinessId()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('30')
  const [customerInsights, setCustomerInsights] = useState<CustomerInsight[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)

  useEffect(() => {
    if (businessId) {
      loadAnalytics()
      loadCustomerInsights()
    }
  }, [dateRange, businessId])

  const loadCustomerInsights = async () => {
    if (!businessId) return
    setInsightsLoading(true)
    setInsightsError(null)
    const response = await customerInsightsApi.get(businessId)
    if (response.data?.insights) setCustomerInsights(response.data.insights)
    else setInsightsError(response.error || 'Enterprise customer insights are unavailable.')
    setInsightsLoading(false)
  }

  // Redirect to login if business ID error or not found
  useEffect(() => {
    if (!fetchingBusinessId && (businessIdError || !businessId)) {
      router.push('/login')
    }
  }, [fetchingBusinessId, businessIdError, businessId, router])

  const loadAnalytics = async () => {
    if (!businessId) return
    try {
      setLoading(true)
      const response = await businessApi.getAnalytics(businessId, { days: parseInt(dateRange) })
      setAnalytics(response.data as AnalyticsData)
      setError(null)
    } catch (err) {
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, title, value, change, trend }: any) => (
    <Card className="p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-slate-500 text-xs sm:text-sm font-medium mb-1 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="bg-blue-50 p-2.5 sm:p-3 rounded-lg shrink-0">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-3 sm:mt-4 flex items-center gap-1">
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-600 shrink-0" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
            {Math.abs(change)}%
          </span>
          <span className="text-slate-500 text-xs">vs last period</span>
        </div>
      )}
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Sidebar userRole="BUSINESS_OWNER" />

      <main className="md:ml-64 pt-6 px-4 md:px-8 py-8">
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Analytics' },
        ]} />

        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Analytics</h1>
            <p className="text-sm sm:text-base text-slate-500">Business performance and insights</p>
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            {['7', '30', '90'].map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'default' : 'outline'}
                size="sm"
                className="shrink-0"
                onClick={() => setDateRange(range)}
              >
                Last {range} days
              </Button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-900">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : analytics ? (
          <div className="space-y-6 sm:space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatCard
                icon={Calendar}
                title="Total Bookings"
                value={analytics.totalBookings}
                change={analytics.bookingGrowth}
                trend={analytics.bookingGrowth >= 0 ? 'up' : 'down'}
              />
              <StatCard
                icon={Users}
                title="Total Customers"
                value={analytics.totalCustomers}
                change={analytics.customersGrowth}
                trend={analytics.customersGrowth >= 0 ? 'up' : 'down'}
              />
              <StatCard
                icon={Users}
                title="New Customers"
                value={analytics.newCustomers}
              />
              <StatCard
                icon={BarChart3}
                title="Conversion Rate"
                value={`${analytics.conversionRate.toFixed(1)}%`}
              />
            </div>

            {/* Customer loyalty */}
            <Card className="border-slate-200 p-4 sm:p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Customer loyalty</h2>
                  <p className="mt-1 text-sm text-slate-500">Enterprise insights from completed visits and customer observations.</p>
                </div>
                <Badge className="bg-amber-100 text-amber-900 w-fit">Enterprise</Badge>
              </div>

              {insightsLoading ? (
                <div className="py-8 text-center text-sm text-slate-500">Loading customer insights...</div>
              ) : insightsError ? (
                <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">{insightsError}</div>
              ) : customerInsights.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">No completed customer visits yet.</div>
              ) : (
                <>
                  {/* Mobile: stacked cards */}
                  <div className="space-y-3 sm:hidden">
                    {customerInsights.map(customer => (
                      <div key={customer.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{customer.name}</p>
                            <p className="text-xs text-slate-500 truncate">{customer.email}</p>
                          </div>
                          <Badge className="bg-teal-100 text-teal-800 shrink-0">{customer.loyalty}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{customer.notes || 'No observation added'}</p>
                        <p className="mt-2 text-xs font-medium text-slate-500">{customer.visitCount} visits</p>
                      </div>
                    ))}
                  </div>

                  {/* Desktop/tablet: table */}
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="min-w-[700px] w-full">
                      <thead className="border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-3 text-left text-sm font-semibold text-slate-900">Customer</th>
                          <th className="px-3 py-3 text-left text-sm font-semibold text-slate-900">Observation</th>
                          <th className="px-3 py-3 text-left text-sm font-semibold text-slate-900">Visits</th>
                          <th className="px-3 py-3 text-left text-sm font-semibold text-slate-900">Loyalty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {customerInsights.map(customer => (
                          <tr key={customer.id}>
                            <td className="px-3 py-4">
                              <p className="font-medium text-slate-900">{customer.name}</p>
                              <p className="text-sm text-slate-500">{customer.email}</p>
                            </td>
                            <td className="max-w-xs px-3 py-4 text-sm text-slate-600">{customer.notes || 'No observation added'}</td>
                            <td className="px-3 py-4 font-semibold text-slate-900">{customer.visitCount}</td>
                            <td className="px-3 py-4"><Badge className="bg-teal-100 text-teal-800">{customer.loyalty}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Card>

            {/* Booking status breakdown */}
            <Card className="p-4 sm:p-6">
              <h2 className="mb-4 sm:mb-5 text-lg sm:text-xl font-semibold text-slate-900">Booking status</h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
                {Object.entries(analytics.bookingsByStatus || {}).map(([status, count]) => (
                  <div key={status} className="rounded-lg bg-slate-50 p-3 sm:p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{status}</p>
                    <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">{count}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Services */}
            {analytics.topServices && analytics.topServices.length > 0 && (
              <Card className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4 sm:mb-6">Top Services</h2>

                {/* Mobile: stacked rows */}
                <div className="divide-y divide-slate-200 sm:hidden">
                  {analytics.topServices.map((service, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3">
                      <span className="text-slate-900 text-sm truncate pr-3">{service.name}</span>
                      <Badge className="bg-blue-100 text-blue-800 shrink-0">{service.bookings}</Badge>
                    </div>
                  ))}
                </div>

                {/* Desktop/tablet: table */}
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full">
                    <thead className="border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-slate-900">Service</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-slate-900">Bookings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {analytics.topServices.map((service, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-slate-900">{service.name}</td>
                          <td className="px-4 py-3">
                            <Badge className="bg-blue-100 text-blue-800">{service.bookings}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        ) : null}
      </main>
    </div>
  )
}