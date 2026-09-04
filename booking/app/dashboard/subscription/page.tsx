'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useBusinessId } from '@/hooks/useBusinessId'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import Link from 'next/link'
import { Loader, AlertCircle, CreditCard, Calendar, CheckCircle, ArrowRight, Trash2, ArrowUpRight, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { DateTime } from 'luxon';

interface SubscriptionDetails {
  id?: string
  status: string
  planName: string
  planPrice?: number
  trialEndsAt: string | null
  expiresAt: string | null
  daysRemaining: number
  autoRenew?: boolean
  startDate?: string
  createdAt?: string
  smsUsedThisMonth?: number
  maxSmsPerMonth?: number
}

export default function SubscriptionPage() {
  const router = useRouter()
  const { businessId, loading: fetchingBusinessId, error: businessIdError } = useBusinessId()
  const { subscriptionStatus, loading: subscriptionLoading, hasValidSubscription, refetch: refetchSubscriptionStatus } = useSubscriptionStatus()
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const planPrices: Record<string, { monthly: number }> = {
  starter: {
    monthly: 499,
  },
  professional: {
    monthly: 999,
  },
  enterprise: {
    monthly: 2499,
  },
};
const currentPlanPrice = subscriptionStatus?.planName ? planPrices[subscriptionStatus.planName.toLowerCase()] : undefined;

  

  // Redirect to login if business ID error
  useEffect(() => {
    if (!fetchingBusinessId && (businessIdError || !businessId)) {
      router.push('/login')
    }
  }, [fetchingBusinessId, businessIdError, businessId, router])

  // Load subscription details
  useEffect(() => {
    if (businessId && subscriptionStatus) {
      loadSubscription()
    }
  }, [businessId, subscriptionStatus])

  const loadSubscription = async () => {
    try {
      setLoading(true)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
      
      const response = await fetch(`${API_URL}/api/subscriptions/status/${businessId}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      }
    } catch (err) {
      console.error('[v0] Error loading subscription:', err)
      setError('Failed to load subscription details')
    } finally {
      setLoading(false)
    }
  }

  

  const handleCancelSubscription = async () => {
  try {
    if (!subscription?.id) {
      throw new Error('Subscription ID not found')
    }

    setCancelling(true)
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

    const response = await fetch(`${API_URL}/api/subscriptions/cancel/${subscription.id}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error('Failed to cancel subscription')
    }

    toast.success('Subscription cancelled successfully')
    setShowCancelDialog(false)
    // Refresh BOTH copies — the hook's data (what the UI actually renders)
    // and the local `subscription` state.
    await Promise.all([loadSubscription(), refetchSubscriptionStatus()])
  } catch (err: any) {
    toast.error(err.message || 'Failed to cancel subscription')
  } finally {
    setCancelling(false)
  }
}

const formatDate = (date: string | null | undefined) => {
  if (!date) return 'N/A';

  return DateTime.fromISO(date, { zone: 'Asia/Kathmandu' })
    .setLocale('en')
    .toLocaleString({ year: 'numeric', month: 'short', day: 'numeric' });
}

  if (loading || subscriptionLoading || fetchingBusinessId) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar userRole="BUSINESS_OWNER" />
        <main className="md:ml-64 pt-6 px-4 md:px-8 py-8 flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading subscription...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!hasValidSubscription) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar userRole="BUSINESS_OWNER" />
        <main className="md:ml-64 pt-6 px-4 md:px-8 py-8">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Subscription' }]} />
          <div className="mt-8">
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-2">No Active Subscription</h3>
                    <p className="text-sm text-amber-800 mb-4">
                      You don't have an active subscription. Select a plan to get started with your free 30-day trial.
                    </p>
                    <Link href="/subscription">
                      <Button className="gap-2">
                        <ArrowUpRight className="w-4 h-4" />
                        View Plans
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole="BUSINESS_OWNER" />
      <main className="md:ml-64 pt-6 px-4 md:px-8 py-8">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Subscription' }]} />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Subscription Management</h1>
          <p className="text-muted-foreground">Manage your subscription plan and billing</p>
        </div>

        {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">{error}</p>
                </div>
              </div>
            )}

        {/* Current Subscription Card */}
            {subscriptionStatus && (
              <Card className={`mb-8 border-primary bg-gradient-to-br from-primary/5 via-primary/2 to-transparent ${
                subscriptionStatus.status === 'CANCELLED' ? 'border-amber-200 bg-gradient-to-br from-amber-50 via-amber-50/50 to-transparent' : ''
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{subscriptionStatus.planName}</CardTitle>
                      <CardDescription>
                        {subscriptionStatus.status === 'CANCELLED' 
                          ? `Subscription ends on ${subscriptionStatus.expiresAt ? new Date(subscriptionStatus.expiresAt).toLocaleDateString() : 'soon'}`
                          : 'Your current subscription plan'
                        }
                      </CardDescription>
                    </div>
                    <Badge 
                      className={
                        subscriptionStatus.status === 'TRIAL' 
                          ? 'bg-blue-500' 
                          : subscriptionStatus.status === 'CANCELLED'
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                      }
                    >
                      {subscriptionStatus.status === 'TRIAL' 
                        ? 'Trial Active' 
                        : subscriptionStatus.status === 'CANCELLED'
                        ? 'Cancelled'
                        : 'Active'
                      }
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Price */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Monthly Price</p>
                      <p className="text-2xl font-bold">
  ₨{currentPlanPrice?.monthly?.toLocaleString() || 'N/A'}
</p>
                    </div>

                    {/* Days Remaining */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {subscriptionStatus.status === 'TRIAL' ? 'Trial Ends In' : 'Days Remaining'}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-primary">{subscriptionStatus.daysRemaining}</p>
                        <p className="text-sm text-muted-foreground">days</p>
                      </div>
                    </div>

                    {/* Expiration Date */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {subscriptionStatus.status === 'TRIAL' ? 'Trial Ends' : 'Expires'}
                      </p>
                      <p className="text-lg font-semibold">{formatDate(subscriptionStatus.expiresAt as string)}</p>
                    </div>

                    {/* Auto-Renew Status */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Auto-Renewal</p>
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`w-5 h-5 ${subscriptionStatus.autoRenew ? 'text-green-500' : 'text-gray-400'}`} />
                        <p className="font-semibold">{subscriptionStatus.autoRenew ? 'Enabled' : 'Disabled'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

        {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Upgrade Plan */}
              <Card className="hover:border-primary/50 transition-all">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5" />
                    Upgrade Plan
                  </CardTitle>
                  <CardDescription>Choose a higher tier plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get more features and higher limits with a premium plan.
                  </p>
                  <Link href="/subscription">
                    <Button className="w-full" variant="outline">
                      View Plans
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Billing Information */}
              <Card className="hover:border-primary/50 transition-all">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Billing
                  </CardTitle>
                  <CardDescription>Payment and billing history</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View your invoices and payment history.
                  </p>
                  <Link href="/dashboard/payments">
                    <Button className="w-full" variant="outline">
                      View Billing
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

  

        {/* Subscription Details */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
                <CardDescription>Complete information about your current plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Plan Name</p>
                      <p className="font-semibold">{subscriptionStatus?.planName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Status</p>
                      <Badge variant={subscriptionStatus?.status === 'TRIAL' ? 'secondary' : 'default'}>
                        {subscriptionStatus?.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Started On</p>
                      <p className="font-semibold">{formatDate(subscriptionStatus?.startDate as string)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Ends On</p>
                      <p className="font-semibold">{formatDate(subscriptionStatus?.expiresAt as string)}</p>
                    </div>
                  </div>

                  {/* Cancel or Reactivate Section */}
                  <div className="border-t pt-6">
                    {subscriptionStatus?.status === 'CANCELLED' ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-sm text-amber-900 mb-4">
                          Your subscription has been cancelled and will end on{' '}
                          <span className="font-semibold">
                            {subscriptionStatus.expiresAt ? new Date(subscriptionStatus.expiresAt).toLocaleDateString() : 'soon'}
                          </span>
                          . You can still use all features until then.
                        </p>
                        <Link href="/subscription">
                          <Button className="gap-2">
                            <ArrowUpRight className="w-4 h-4" />
                            View Renewal Plans
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-4">
                          Need to cancel your subscription? You can cancel anytime. Your access will continue until the end of the current billing period.
                        </p>
                        <Button 
                          variant="destructive" 
                          className="gap-2"
                          onClick={() => setShowCancelDialog(true)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Cancel Subscription
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
      </main>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. You will lose access to premium features at the end of your current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleCancelSubscription}
            disabled={cancelling}
            className="bg-destructive hover:bg-destructive/90"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
