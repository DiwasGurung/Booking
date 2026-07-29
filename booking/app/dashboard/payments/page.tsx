'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import {
  Loader, AlertCircle, CreditCard, Filter, Calendar, CheckCircle, Clock, XCircle
} from 'lucide-react'
import { paymentApi } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useBusinessId } from '@/hooks/useBusinessId'

interface Payment {
  id: string
  subscriptionId: string
  amount: number
  currency: string
  method: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  createdAt: string
  updatedAt: string
  subscription?: {
    id: string
    planId: string
    businessId: string
    status: string
  }
}

export default function PaymentsDashboardPage() {
  const router = useRouter()
  const { businessId, loading: fetchingBusinessId, error: businessIdError } = useBusinessId()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (businessId) {
      loadPaymentData()
    }
  }, [currentPage, filterStatus, businessId])

  useEffect(() => {
    if (!fetchingBusinessId && (businessIdError || !businessId)) {
      router.push('/login')
    }
  }, [fetchingBusinessId, businessIdError, businessId, router])

  async function loadPaymentData() {
    try {
      setLoading(true)
      setError(null)

      const response = await paymentApi.getBusinessPayments(businessId as string, currentPage, 10)
      
      // response.data contains the entire backend response { success, data, pagination }
      // So we need to extract the payments array from response.data.data
      const backendResponse = response.data as any
      const paymentsData = (backendResponse?.data && Array.isArray(backendResponse.data)) 
        ? backendResponse.data 
        : []
      
      setPayments(paymentsData)
    } catch (err) {
      console.error('[Payment] Failed to load payments:', err)
      setError('Failed to load payment data')
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter((payment) => {
    return filterStatus === 'ALL' || payment.status === filterStatus
  })

  const paymentCounts = {
    completed: payments.filter((p) => p.status === 'COMPLETED').length,
    pending: payments.filter((p) => p.status === 'PENDING').length,
    failed: payments.filter((p) => p.status === 'FAILED').length,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <CreditCard className="w-5 h-5 text-slate-600" />
    }
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
            <h1 className="text-3xl font-bold text-slate-900">Subscription Payments</h1>
            <p className="text-slate-500">Track payment status for your subscription</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">{error}</p>
            </div>
          </div>
        )}

        {/* Payment Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
        <div className="mb-8 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-600">Filter by Status:</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
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
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Subscription ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">
                          {payment.currency} {payment.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 font-mono">
                          {payment.subscriptionId.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
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

