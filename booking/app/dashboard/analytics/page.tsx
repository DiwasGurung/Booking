'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Loader, AlertCircle, TrendingUp, TrendingDown, BarChart3, Users, Calendar, DollarSign } from 'lucide-react'
import { businessApi } from '@/lib/api'

interface AnalyticsData {
  totalRevenue: number
  revenueGrowth: number
  totalBookings: number
  bookingGrowth: number
  totalCustomers: number
  customersGrowth: number
  conversionRate: number
  monthlyRevenue: Array<{ month: string; amount: number }>
  topServices: Array<{ name: string; bookings: number; revenue: number }>
}

export default function AnalyticsPage() {
  const params = useParams()
  const businessId = params?.businessId as string || 'demo-business-id'
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('30')

  useEffect(() => {
    loadAnalytics()
  }, [dateRange, businessId])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await businessApi.getAnalytics(businessId, { days: parseInt(dateRange) })
      setAnalytics(response.data as AnalyticsData)
      setError(null)
    } catch (err) {
      setError('Failed to load analytics')
      console.error('[v0] Error loading analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, title, value, change, trend }: any) => (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-4 flex items-center gap-1">
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
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
      <Header />
      <Sidebar userRole="BUSINESS_OWNER" />

      <main className="md:ml-64 pt-24 md:pt-20 px-4 md:px-8 py-8">
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Analytics' },
        ]} />

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
            <p className="text-slate-500">Business performance and insights</p>
          </div>
          <div className="flex gap-2">
            {['7', '30', '90'].map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'default' : 'outline'}
                size="sm"
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
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={DollarSign}
                title="Total Revenue"
                value={`$${analytics.totalRevenue.toFixed(2)}`}
                change={analytics.revenueGrowth}
                trend={analytics.revenueGrowth >= 0 ? 'up' : 'down'}
              />
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
                icon={BarChart3}
                title="Conversion Rate"
                value={`${analytics.conversionRate.toFixed(1)}%`}
              />
            </div>

            {/* Monthly Revenue */}
            {analytics.monthlyRevenue && analytics.monthlyRevenue.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">Monthly Revenue</h2>
                <div className="space-y-3">
                  {analytics.monthlyRevenue.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-slate-600">{item.month}</span>
                      <div className="flex items-center gap-3 flex-1 ml-4">
                        <div className="h-8 bg-blue-100 rounded flex-1">
                          <div
                            className="h-full bg-blue-600 rounded"
                            style={{
                              width: `${
                                (item.amount / Math.max(...analytics.monthlyRevenue.map(m => m.amount))) * 100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="font-semibold text-slate-900 w-24 text-right">
                          ${item.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Top Services */}
            {analytics.topServices && analytics.topServices.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">Top Services</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-slate-900">Service</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-slate-900">Bookings</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-slate-900">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {analytics.topServices.map((service, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-slate-900">{service.name}</td>
                          <td className="px-4 py-3">
                            <Badge className="bg-blue-100 text-blue-800">{service.bookings}</Badge>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            ${service.revenue.toFixed(2)}
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
