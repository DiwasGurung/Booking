'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Loader, DollarSign, TrendingUp, AlertCircle, CreditCard, Download,
  Filter, ChevronLeft, BarChart3, PieChart as PieChartIcon, Calendar, Zap
} from 'lucide-react'
import { paymentApi } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useBusinessId } from '@/hooks/useBusinessId'

interface Payment {
  id: string
  subscriptionId: string
  amount: number
  currency: string
  gateway: 'ESEWA' | 'KHALTI' | 'STRIPE'
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  transactionId?: string
  createdAt: string
  updatedAt: string
}

interface PaymentStats {
  totalRevenue: number
  totalPayments: number
  completedPayments: number
  failedPayments: number
  pendingPayments: number
  avgTransactionValue: number
  revenueByGateway: { [key: string]: number }
  monthlyRevenue: { month: string; amount: number }[]
}

export default function PaymentsDashboardPage() {
  const router = useRouter()
  const { businessId, loading: fetchingBusinessId, error: businessIdError } = useBusinessId()
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterGateway, setFilterGateway] = useState<string>('ALL')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (businessId) {
      loadPaymentData()
    }
  }, [currentPage, filterStatus, filterGateway, businessId])

  // Redirect to login if business ID error or not found
  useEffect(() => {
    if (!fetchingBusinessId && (businessIdError || !businessId)) {
      router.push('/login')
    }
  }, [fetchingBusinessId, businessIdError, businessId, router])

  async function loadPaymentData() {
    try {
      setLoading(true)
      setError(null)

      if (!businessId) {
        setError('Business ID not found')
        return
      }

      const paymentsResponse = await paymentApi.getUserPayments(businessId, currentPage, 10)
      const payments = Array.isArray(paymentsResponse.data)
        ? paymentsResponse.data
        : (paymentsResponse.data as any).payments || []

      setPayments(payments)

      // Calculate stats
      const completedPayments = payments.filter((p: Payment) => p.status === 'COMPLETED')
      const totalRevenue = completedPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0)

      const revenueByGateway: { [key: string]: number } = {}
      payments.forEach((p: Payment) => {
        if (!revenueByGateway[p.gateway]) {
          revenueByGateway[p.gateway] = 0
        }
        if (p.status === 'COMPLETED') {
          revenueByGateway[p.gateway] += p.amount
        }
      })

      const statsData: PaymentStats = {
        totalRevenue,
        totalPayments: payments.length,
        completedPayments: completedPayments.length,
        failedPayments: payments.filter((p: Payment) => p.status === 'FAILED').length,
        pendingPayments: payments.filter((p: Payment) => p.status === 'PENDING').length,
        avgTransactionValue: completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0,
        revenueByGateway,
        monthlyRevenue: [],
      }

      setStats(statsData)
    } catch (err) {
      console.error('[v0] Failed to load payments:', err)
      setError('Failed to load payment data')
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter((payment) => {
    const statusMatch = filterStatus === 'ALL' || payment.status === filterStatus
    const gatewayMatch = filterGateway === 'ALL' || payment.gateway === filterGateway
    return statusMatch && gatewayMatch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getGatewayIcon = (gateway: string) => {
    const icons: { [key: string]: string } = {
      ESEWA: '🇳🇵',
      KHALTI: '💳',
      STRIPE: '💰',
    }
    return icons[gateway] || '💳'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Sidebar userRole="BUSINESS_OWNER" />

      <main className="md:ml-64 pt-6 px-4 md:px-8 py-8">
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Payments' },
        ]} />

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Payment Analytics</h1>
            <p className="text-slate-500">Subscription payments and revenue tracking</p>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card className="border border-slate-200 shadow-sm p-6 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-2 font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-slate-900">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="border border-slate-200 shadow-sm p-6 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-2 font-medium">Completed</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.completedPayments}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="border border-slate-200 shadow-sm p-6 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-2 font-medium">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pendingPayments}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <Zap className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </Card>

            <Card className="border border-slate-200 shadow-sm p-6 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-2 font-medium">Failed</p>
                  <p className="text-3xl font-bold text-red-600">{stats.failedPayments}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </Card>

            <Card className="border border-slate-200 shadow-sm p-6 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-2 font-medium">Avg Transaction</p>
                  <p className="text-3xl font-bold text-slate-900">${stats.avgTransactionValue.toFixed(2)}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Revenue by Gateway */}
        {stats && Object.keys(stats.revenueByGateway).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {Object.entries(stats.revenueByGateway).map(([gateway, revenue]) => (
              <Card key={gateway} className="border border-slate-200 shadow-sm p-6 bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{getGatewayIcon(gateway)}</span>
                  <div>
                    <p className="text-sm text-slate-500">Revenue from</p>
                    <p className="font-semibold text-slate-900">{gateway}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">${revenue.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {stats.totalRevenue > 0 ? ((revenue / stats.totalRevenue) * 100).toFixed(1) : 0}% of total
                </p>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-600">Filters:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-1 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={filterGateway}
              onChange={(e) => {
                setFilterGateway(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-1 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="ALL">All Gateways</option>
              <option value="ESEWA">eSewa</option>
              <option value="KHALTI">Khalti</option>
              <option value="STRIPE">Stripe</option>
            </select>
          </div>
        </div>

        {/* Payment History Table */}
        <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Payment History ({filteredPayments.length})
            </h2>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-600 font-medium">No Payments Found</p>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Gateway</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Transaction ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getGatewayIcon(payment.gateway)}</span>
                          <span className="font-medium text-slate-900">{payment.gateway}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">
                          ${payment.amount.toFixed(2)} {payment.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500 font-mono">
                          {payment.transactionId?.slice(0, 8) || 'N/A'}...
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pagination */}
        <div className="mt-8 flex justify-between items-center">
          <p className="text-sm text-slate-500">
            Showing {Math.min(filteredPayments.length, 10)} of {payments.length} payments
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

