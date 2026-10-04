'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DateTime } from 'luxon'
import {
  Loader, AlertCircle, CheckCircle, XCircle, MessageSquare, Wallet, Send,
  History, Gift, TrendingDown, TrendingUp, X, Filter, ShoppingCart, BarChart3, RefreshCw,
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { useBusinessId } from '@/hooks/useBusinessId'
import {
  smsCreditApi,
  type SmsCreditPackage,
  type SmsCreditTransaction,
  type SmsUsageStats,
} from '@/lib/api'

const PAGE_SIZE = 10
const LOW_BALANCE = 20
const HEALTHY_BALANCE = 100 // balance at which the health bar is full

const TYPE_META: Record<SmsCreditTransaction['type'], { label: string; color: string }> = {
  PURCHASE:   { label: 'Purchased',    color: 'bg-green-100 text-green-800 hover:bg-green-100' },
  PLAN_GRANT: { label: 'Plan credits', color: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  BONUS:      { label: 'Bonus',        color: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
  USAGE:      { label: 'SMS sent',     color: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  REFUND:     { label: 'Refund',       color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  ADJUSTMENT: { label: 'Adjustment',   color: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
}

const USAGE_LABELS: Record<string, string> = {
  booking: 'Booking confirmations',
  reminder: 'Appointment reminders',
  status_change: 'Status updates',
  owner_notification: 'Owner alerts',
  verification: 'Verification codes',
}

/** eSewa expects a browser form POST, not a fetch. */
function submitToEsewa(paymentUrl: string, formData: Record<string, string>) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = paymentUrl
  Object.entries(formData).forEach(([k, v]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = k
    input.value = String(v)
    form.appendChild(input)
  })
  document.body.appendChild(form)
  form.submit()
}

function SmsCreditsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { businessId, loading: fetchingBusinessId, error: businessIdError } = useBusinessId()

  const seedAttempted = useRef(false)
  const packagesRef = useRef<HTMLDivElement>(null)

  const [stats, setStats] = useState<SmsUsageStats | null>(null)
  const [packages, setPackages] = useState<SmsCreditPackage[]>([])
  const [transactions, setTransactions] = useState<SmsCreditTransaction[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterType, setFilterType] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(false)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const status = searchParams.get('status')
  const message = searchParams.get('message')
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const balance = stats?.credits.balance ?? 0
  const isLow = balance < LOW_BALANCE
  const healthPct = Math.min(100, Math.round((balance / HEALTHY_BALANCE) * 100))

  useEffect(() => {
    if (!fetchingBusinessId && (businessIdError || !businessId)) router.push('/login')
  }, [fetchingBusinessId, businessIdError, businessId, router])

  const loadOverview = useCallback(async () => {
    if (!businessId) return
    try {
      setLoading(true)
      setError(null)
      const [bal, pk] = await Promise.all([
        smsCreditApi.getBalance(businessId),
        smsCreditApi.getPackages(),
      ])
      if (bal.data) setStats(bal.data)

    const readPackages = (r: any): SmsCreditPackage[] => r?.packages ?? r?.data ?? []

let list = readPackages(pk)

if (list.length === 0 && !seedAttempted.current) {
  seedAttempted.current = true
  const seeded = await smsCreditApi.seedPackages()
  if (seeded.success === false) {
    console.error('[sms-credits] seeding failed:', seeded.error)
    setError(`Could not load SMS packages (${seeded.error || 'seed endpoint unreachable'}).`)
  } else {
    list = readPackages(await smsCreditApi.getPackages())
  }
}

setPackages(list)
    } catch {
      setError('Failed to load SMS credit data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  const loadTransactions = useCallback(async () => {
    if (!businessId) return
    try {
      setTxLoading(true)
      const res = await smsCreditApi.getTransactions(businessId, PAGE_SIZE, (currentPage - 1) * PAGE_SIZE)
      if (res.data) {
        setTransactions(res.data.transactions)
        setTotal(res.data.total)
      }
    } finally {
      setTxLoading(false)
    }
  }, [businessId, currentPage])

  useEffect(() => { loadOverview() }, [loadOverview])
  useEffect(() => { loadTransactions() }, [loadTransactions])

  const refreshAll = () => {
    loadOverview()
    loadTransactions()
  }

  const buy = async (pkg: SmsCreditPackage) => {
    if (!businessId) return
    setBuyingId(pkg.id)
    setError(null)
    const res = await smsCreditApi.initiateEsewaPurchase(businessId, pkg.id)
    if (!res.success || !res.paymentUrl || !res.formData) {
      setError(res.error || 'Could not start the payment. Please try again.')
      setBuyingId(null)
      return
    }
    submitToEsewa(res.paymentUrl, res.formData) // page navigates away
  }

  const scrollToPackages = () =>
    packagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // Package with the best (lowest) cost per credit, counting bonus credits.
  const costPerCredit = (p: SmsCreditPackage) => p.priceNPR / (p.credits + p.bonusCredits)
  const bestValueId =
    packages.length > 1
      ? packages.reduce((best, p) => (costPerCredit(p) < costPerCredit(best) ? p : best)).id
      : null

  const filteredTransactions = transactions.filter(
    (t) => filterType === 'ALL' || t.type === filterType
  )

  const usageEntries = Object.entries(stats?.byType ?? {})
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
  const usageMax = Math.max(1, ...usageEntries.map(([, c]) => c))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Sidebar userRole="BUSINESS_OWNER" />

      <main className="md:ml-64 pt-6 px-4 md:px-8 py-8">
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'SMS Credits' },
        ]} />

        {/* Header */}
        <div className="flex justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">SMS Credits</h1>
            <p className="text-slate-500">1 credit = 1 SMS segment (160 characters). Credits never expire.</p>
          </div>
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={loading || txLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading || txLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* eSewa redirect result */}
        {status && message && (
          <div
            className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
              status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
          >
            {status === 'success'
              ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
            <p className={`flex-1 font-medium ${status === 'success' ? 'text-green-900' : 'text-red-900'}`}>
              {message}
            </p>
            <button
              aria-label="Dismiss"
              onClick={() => router.replace('/dashboard/sms-credits')}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadOverview}>Retry</Button>
          </div>
        )}

        {isLow && !loading && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-sm text-yellow-900">
              Your balance is low. When credits run out, reminders and notifications fall back to email.
            </p>
            <Button size="sm" onClick={scrollToPackages}>Buy credits</Button>
          </div>
        )}

        {/* Balance hero */}
        <Card className="border-0 shadow-md p-6 md:p-8 mb-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/15 p-3 rounded-lg">
                <Wallet className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm text-blue-100 font-medium">Available Credits</p>
                <p className="text-5xl font-bold leading-tight">{loading ? '–' : balance}</p>
              </div>
            </div>

            <div className="md:w-72">
              <div className="flex justify-between text-xs text-blue-100 mb-2">
                <span>Balance health</span>
                <span>{isLow ? 'Low' : healthPct >= 100 ? 'Healthy' : 'OK'}</span>
              </div>
              <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isLow ? 'bg-red-300' : 'bg-white'}`}
                  style={{ width: `${Math.max(4, healthPct)}%` }}
                />
              </div>
              <Button
                size="sm"
                onClick={scrollToPackages}
                className="mt-4 w-full bg-white text-blue-700 hover:bg-blue-50"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Buy more credits
              </Button>
            </div>
          </div>
        </Card>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="border border-slate-200 shadow-sm p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-2 font-medium">Used This Month</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.credits.usedThisMonth ?? 0}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <TrendingDown className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-sm p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-2 font-medium">SMS Sent</p>
                <p className="text-3xl font-bold text-green-600">{stats?.thisMonth.successful ?? 0}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <Send className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="col-span-2 lg:col-span-1 border border-slate-200 shadow-sm p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-2 font-medium">Failed</p>
                <p className="text-3xl font-bold text-red-600">{stats?.thisMonth.failed ?? 0}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Usage breakdown */}
        {usageEntries.length > 0 && (
          <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white mb-8">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Usage This Month
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {usageEntries.map(([type, count]) => (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600">{USAGE_LABELS[type] ?? type}</span>
                    <span className="font-semibold text-slate-900">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(count / usageMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Packages */}
        <div ref={packagesRef} className="scroll-mt-6">
          <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white mb-8">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Buy Credits
              </h2>
            </div>

            {loading ? (
              <div className="p-12 flex items-center justify-center">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : packages.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-lg text-slate-600 font-medium">No Packages Available</p>
                <p className="text-sm text-slate-500 mt-1">Please check back soon.</p>
              </div>
            ) : (
              <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg) => {
                  const best = pkg.id === bestValueId
                  const totalCredits = pkg.credits + pkg.bonusCredits
                  return (
                    <div
                      key={pkg.id}
                      className={`relative flex flex-col rounded-lg border p-5 transition-colors hover:bg-slate-50 ${
                        best ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200'
                      }`}
                    >
                      {best && (
                        <Badge className="absolute -top-2.5 right-4 bg-blue-600 text-white hover:bg-blue-600">
                          Best value
                        </Badge>
                      )}
                      <p className="font-medium text-slate-900">{pkg.displayName}</p>
                      <p className="mt-3 text-3xl font-bold text-slate-900">
                        Rs. {pkg.priceNPR.toLocaleString('en-IN')}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {totalCredits.toLocaleString('en-IN')} credits · Rs. {costPerCredit(pkg).toFixed(2)} each
                      </p>

                      <div className="mt-4 space-y-1.5 text-sm">
                        <p className="flex items-center gap-2 text-slate-600">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          {pkg.credits.toLocaleString('en-IN')} SMS credits
                        </p>
                        {pkg.bonusCredits > 0 && (
                          <p className="flex items-center gap-2 font-medium text-green-700">
                            <Gift className="w-4 h-4" />
                            + {pkg.bonusCredits.toLocaleString('en-IN')} bonus credits
                          </p>
                        )}
                        <p className="flex items-center gap-2 text-slate-600">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Never expires
                        </p>
                      </div>

                      <Button
                        className="mt-5"
                        variant={best ? 'default' : 'outline'}
                        disabled={buyingId !== null}
                        onClick={() => buy(pkg)}
                      >
                        {buyingId === pkg.id ? (
                          <><Loader className="mr-2 h-4 w-4 animate-spin" />Redirecting to eSewa...</>
                        ) : (
                          'Pay with eSewa'
                        )}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-600">Filter by Type:</span>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="ALL">All Types</option>
            {Object.entries(TYPE_META).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>
        </div>

        {/* Credit history */}
        <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Credit History ({filteredTransactions.length})
            </h2>
          </div>

          {txLoading && transactions.length === 0 ? (
            <div className="p-12 flex items-center justify-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-600 font-medium">No Credit Activity Found</p>
              <p className="text-sm text-slate-500 mt-1">
                {filterType === 'ALL'
                  ? 'Purchases and SMS usage will appear here.'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Credits</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <Badge className={TYPE_META[t.type].color}>{TYPE_META[t.type].label}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={t.description ?? ''}>
                        {t.description ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          t.amount > 0 ? 'text-green-600' : 'text-slate-900'
                        }`}>
                          {t.amount > 0 && <TrendingUp className="w-4 h-4" />}
                          {t.amount > 0 ? `+${t.amount}` : t.amount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{t.balanceAfter}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {DateTime.fromISO(t.createdAt, { zone: 'Asia/Kathmandu' })
                          .setLocale('en')
                          .toLocaleString({
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {total > 0 && (
          <div className="mt-8 flex justify-between items-center">
            <p className="text-sm text-slate-500">
              Page {currentPage} of {totalPages} · {total} total transaction{total === 1 ? '' : 's'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1 || txLoading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages || txLoading}
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

export default function SmsCreditsPage() {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <SmsCreditsContent />
    </Suspense>
  )
}