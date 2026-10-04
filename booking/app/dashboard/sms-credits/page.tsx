'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MessageSquare, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/authContext'
import {
  businessApi,
  smsCreditApi,
  type SmsCreditPackage,
  type SmsCreditTransaction,
  type SmsUsageStats,
} from '@/lib/api' // adjust to wherever api.ts lives

const TYPE_LABELS: Record<SmsCreditTransaction['type'], string> = {
  PURCHASE: 'Purchased',
  PLAN_GRANT: 'Plan credits',
  BONUS: 'Bonus',
  USAGE: 'SMS sent',
  REFUND: 'Refund',
  ADJUSTMENT: 'Adjustment',
}

const PAGE_SIZE = 20

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
  const { user } = useAuth() as { user?: { id: string } }
  const router = useRouter()
  const searchParams = useSearchParams()

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [stats, setStats] = useState<SmsUsageStats | null>(null)
  const [packages, setPackages] = useState<SmsCreditPackage[]>([])
  const [transactions, setTransactions] = useState<SmsCreditTransaction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const status = searchParams.get('status')
  const message = searchParams.get('message')

  const loadAll = useCallback(async (bizId: string) => {
    const [bal, tx, pk] = await Promise.all([
      smsCreditApi.getBalance(bizId),
      smsCreditApi.getTransactions(bizId, PAGE_SIZE, 0),
      smsCreditApi.getPackages(),
    ])
    if (bal.data) setStats(bal.data)
    if (tx.data) {
      setTransactions(tx.data.transactions)
      setTotal(tx.data.total)
    }
    setPackages(pk.packages ?? [])
  }, [])

  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      const biz = await businessApi.getByUserId(user.id)
      const id = biz.data?.id ?? biz.id
      if (!id) {
        setError('No business found for this account.')
        setLoading(false)
        return
      }
      setBusinessId(id)
      await loadAll(id)
      setLoading(false)
    })()
  }, [user?.id, loadAll])

  const loadMore = async () => {
    if (!businessId) return
    const res = await smsCreditApi.getTransactions(businessId, PAGE_SIZE, transactions.length)
    if (res.data) setTransactions((prev) => [...prev, ...res.data!.transactions])
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

  const dismissBanner = () => router.replace('/dashboard/sms-credits')

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-8">
      <header className="flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">SMS Credits</h1>
          <p className="text-sm text-muted-foreground">
            1 credit = 1 SMS segment (160 characters). Credits never expire.
          </p>
        </div>
      </header>

      {/* Result of the eSewa redirect */}
      {status && message && (
        <div
          className={`flex items-start justify-between gap-3 rounded-lg border p-4 text-sm ${
            status === 'success'
              ? 'border-green-500/40 bg-green-500/10 text-green-700'
              : 'border-destructive/40 bg-destructive/10 text-destructive'
          }`}
        >
          <div className="flex items-center gap-2">
            {status === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <span>{message}</span>
          </div>
          <button onClick={dismissBanner} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Balance */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Available credits</p>
          <p className={`mt-1 text-3xl font-bold ${(stats?.credits.balance ?? 0) < 20 ? 'text-destructive' : ''}`}>
            {stats?.credits.balance ?? 0}
          </p>
          {(stats?.credits.balance ?? 0) < 20 && (
            <p className="mt-1 text-xs text-destructive">Low balance. Reminders will fall back to email.</p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Used this month</p>
          <p className="mt-1 text-3xl font-bold">{stats?.credits.usedThisMonth ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">SMS sent this month</p>
          <p className="mt-1 text-3xl font-bold">{stats?.thisMonth.successful ?? 0}</p>
          {(stats?.thisMonth.failed ?? 0) > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">{stats?.thisMonth.failed} failed</p>
          )}
        </div>
      </section>

      {/* Packages */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Buy credits</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {packages.map((pkg) => (
            <div key={pkg.id} className="flex flex-col rounded-lg border border-border bg-card p-5">
              <p className="font-medium">{pkg.displayName}</p>
              <p className="mt-2 text-2xl font-bold">NPR {pkg.priceNPR.toLocaleString()}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {pkg.credits} credits
                {pkg.bonusCredits > 0 && (
                  <span className="font-medium text-primary"> + {pkg.bonusCredits} bonus</span>
                )}
              </p>
              <Button className="mt-4" disabled={buyingId !== null} onClick={() => buy(pkg)}>
                {buyingId === pkg.id ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redirecting to eSewa...</>
                ) : (
                  'Pay with eSewa'
                )}
              </Button>
            </div>
          ))}
          {packages.length === 0 && (
            <p className="text-sm text-muted-foreground">No packages available right now.</p>
          )}
        </div>
      </section>

      {/* History */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Credit history</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 text-right font-medium">Credits</th>
                <th className="px-4 py-3 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">{new Date(t.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">{TYPE_LABELS[t.type]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.description ?? '-'}</td>
                  <td className={`px-4 py-3 text-right font-medium ${t.amount > 0 ? 'text-green-600' : ''}`}>
                    {t.amount > 0 ? `+${t.amount}` : t.amount}
                  </td>
                  <td className="px-4 py-3 text-right">{t.balanceAfter}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No credit activity yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {transactions.length < total && (
          <div className="mt-3 text-center">
            <Button variant="outline" size="sm" onClick={loadMore}>Load more</Button>
          </div>
        )}
      </section>
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