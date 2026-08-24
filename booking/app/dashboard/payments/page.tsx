'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import {
  Loader, AlertCircle, CreditCard, Filter, Calendar, CheckCircle, Clock, XCircle, RotateCcw
} from 'lucide-react'
import { paymentApi } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useBusinessId } from '@/hooks/useBusinessId'

interface PaymentPlan {
  id: string
  name: string
  displayName: string
  currency?: string
}

interface Payment {
  id: string
  subscriptionId: string | null
  gateway: string
  transactionId: string
  amount: number // stored in paisa (1/100 of a rupee)
  status: string // may be lower/upper case depending on gateway path
  createdAt: string
  updatedAt: string
  subscription?: {
    id: string
    planId: string
    businessId: string
    status: string
    billingPeriod?: string
    plan?: PaymentPlan
  } | null
}

// Normalize inconsistent backend status strings into a single canonical set.
type CanonicalStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED' | 'CANCELLED'

function normalizeStatus(raw: string): CanonicalStatus {
  const s = (raw || '').toUpperCase()
  if (s === 'COMPLETED' || s === 'COMPLETE' || s === 'SUCCESS' || s === 'PAID') return 'COMPLETED'
  if (s === 'FAILED' || s === 'ERROR' || s === 'DECLINED') return 'FAILED'
  if (s === 'REFUNDED') return 'REFUNDED'
  if (s === 'CANCELLED' || s === 'CANCELED') return 'CANCELLED'
  return 'PENDING'
}

// Amount is persisted in paisa; convert to rupees for display.
function formatAmount(amountPaisa: number, currency = 'NPR') {
  const rupees = (Number(amountPaisa) || 0) / 100
  const formatted = rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${currency === 'NPR' ? 'Rs.' : currency} ${formatted}`
}

const PAGE_SIZE = 10

export default function PaymentsDashboardPage() {
  const router = useRouter()
  const { businessId, loading: fetchingBusinessId, error: businessIdError } = useBusinessId()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPayments, setTotalPayments] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (businessId) {
      loadPaymentData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, businessId])

  useEffect(() => {
    if (!fetchingBusinessId && (businessIdError || !businessId)) {
      router.push('/login')
    }
  }, [fetchingBusinessId, businessIdError, businessId, router])

  async function loadPaymentData() {
    if (!businessId) return

    try {
      setLoading(true)
      setError(null)

      const response = await paymentApi.getBusinessPayments(businessId, currentPage, PAGE_SIZE)

      if (!response.success) {
        throw new Error(response.error || 'Failed to load payments')
      }

      // apiCall returns { data } where data is the full backend body:
      // { success, data: Payment[], pagination: { page, limit, total, pages } }
      const body = response.data as any
      const paymentsData: Payment[] = Array.isArray(body?.data) ? body.data : []
      const pagination = body?.pagination

      setPayments(paymentsData)
      setTotalPayments(pagination?.total ?? paymentsData.length)
      setTotalPages(pagination?.pages ?? 1)
    } catch (err) {
      console.error('[Payment] Failed to load payments:', err)
      setError('Failed to load payment data. Please try again.')
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter((payment) =>
    filterStatus === 'ALL' ? true : normalizeStatus(payment.status) === filterStatus
  )

  const paymentCounts = {
    completed: payments.filter((p) => normalizeStatus(p.status) === 'COMPLETED').length,
    pending: payments.filter((p) => normalizeStatus(p.status) === 'PENDING').length,
    failed: payments.filter((p) => normalizeStatus(p.status) === 'FAILED').length,
  }

  const totalRevenue = payments
    .filter((p) => normalizeStatus(p.status) === 'COMPLETED')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  const getStatusColor = (status: CanonicalStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      case 'FAILED':
        return 'bg-red-100 text-red-800 hover:bg-red-100'
      case 'REFUNDED':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-700 hover:bg-slate-100'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusIcon = (status: CanonicalStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'REFUNDED':
        return <RotateCcw className="w-4 h-4 text-blue-600" />
      default:
        return <CreditCard className="w-4 h-4 text-slate-600" />
    }
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
            <h1 className="text-3xl font-bold text-slate-900">Subscription Payments</h1>
            <p className="text-slate-500">Track payment status for your subscription</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadPaymentData}>Retry</Button>
          </div>
        )}

        {/* Payment Status Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border border-slate-200 shadow-sm p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-2 font-medium">Total Paid</p>
                <p className="text-2xl font-bold text-slate-900">{formatAmount(totalRevenue)}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-sm p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-2 font-medium">Completed</p>
                <p className="text-3xl font-bold text-green-600">{paymentCounts.completed}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-sm p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-2 font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{paymentCounts.pending}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-sm p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-2 font-medium">Failed</p>
                <p className="text-3xl font-bold text-red-600">{paymentCounts.failed}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-600">Filter by Status:</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Payment History Table */}
        <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Payment History ({filteredPayments.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-600 font-medium">No Payments Found</p>
              <p className="text-sm text-slate-500 mt-1">
                {filterStatus === 'ALL'
                  ? 'Payments will appear here once your subscription is billed.'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Transaction</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPayments.map((payment) => {
                    const status = normalizeStatus(payment.status)
                    const plan = payment.subscription?.plan
                    const currency = plan?.currency || 'NPR'
                    return (
                      <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">
                            {plan?.displayName || plan?.name || 'Subscription'}
                          </p>
                          {payment.subscription?.billingPeriod && (
                            <p className="text-xs text-slate-500 capitalize">
                              {payment.subscription.billingPeriod.toLowerCase()}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-900">
                            {formatAmount(payment.amount, currency)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600 capitalize">
                            {(payment.gateway || 'N/A').toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status)}
                            <Badge className={getStatusColor(status)}>
                              {status}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-500 font-mono" title={payment.transactionId}>
                            {payment.transactionId
                              ? `${payment.transactionId.slice(0, 10)}${payment.transactionId.length > 10 ? '…' : ''}`
                              : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(payment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalPayments > 0 && (
          <div className="mt-8 flex justify-between items-center">
            <p className="text-sm text-slate-500">
              Page {currentPage} of {totalPages} · {totalPayments} total payment{totalPayments === 1 ? '' : 's'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
