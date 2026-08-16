
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/authContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader, CreditCard, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { BillingPeriod } from '@/components/BillingPeriodSelector'

interface Plan {
  id: string
  name: string
  displayName?: string
  priceNPR: number
  description: string
  features?: string[]
  recommended?: boolean
  // Limits
  maxAppointmentsPerMonth: number
  maxStaff: number
  maxServices: number
  maxCustomers: number
  // Features
  allowEmailNotifications: boolean
  allowOnlineBooking: boolean
  allowReports: boolean
  allowCustomBranding: boolean
  prioritySupport: boolean
}

interface EsewaFormData {
  amount: string
  tax_amount: string
  total_amount: string
  transaction_uuid: string
  product_code: string
  product_service_charge: string
  product_delivery_charge: string
  success_url: string
  failure_url: string
  signed_field_names: string
  signature: string
}

const formatLimit = (limit: number): string => {
  if (limit === -1) return 'Unlimited'
  return limit.toLocaleString()
}

export default function SubscriptionPlan() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, token } = useAuth()

  // Build headers including the Bearer token (reliable across cross-origin) plus cookies
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<BillingPeriod>('MONTHLY')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [esewaFormData, setEsewaFormData] = useState<EsewaFormData | null>(null)
  const [esewaPaymentUrl, setEsewaPaymentUrl] = useState<string>('')
  const [trialUsed, setTrialUsed] = useState(false)
  const [loadingTrialStatus, setLoadingTrialStatus] = useState(true)
  const esewaFormRef = useRef<HTMLFormElement>(null)
  
  // Check URL params for payment status
  const status = searchParams.get('status')
  const message = searchParams.get('message')
  const fromSetup = searchParams.get('from') === 'setup'

   useEffect(() => {
    if (status === 'success') {
      toast.success(message || 'Payment successful! Your subscription is now active.')
      // Redirect to dashboard after payment success
      const redirectTimer = setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
      return () => clearTimeout(redirectTimer)
    } else if (status === 'failed') {
      toast.error(message || 'Payment failed. Please try again.')
    } else if (status === 'error') {
      toast.error(message || 'An error occurred during payment.')
    }
  }, [status, message, router])

  // Check if trial has been used
  useEffect(() => {
    const checkTrialStatus = async () => {
      try {
        setLoadingTrialStatus(true)
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
        
        const response = await fetch(`${API_URL}/api/businesses/current`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        })

        if (response.ok) {
          const businessData = await response.json()
          const businessId = businessData.id || businessData.business?.id
          
          if (businessId) {
            // Fetch subscription status to check if trial was used
            const subResponse = await fetch(`${API_URL}/api/subscriptions/status/${businessId}`, {
              credentials: 'include',
              headers: getAuthHeaders(),
            })
            
            if (subResponse.ok) {
              const subData = await subResponse.json()
              setTrialUsed(subData.status === 'TRIAL' || (subData.hasSubscription && subData.status !== 'TRIAL'))
            }
          }
        }
      } catch (error) {
        console.error('[v0] Error checking trial status:', error)
      } finally {
        setLoadingTrialStatus(false)
      }
    }

    checkTrialStatus()
  }, [])

  // Submit eSewa form when data is ready
  useEffect(() => {
    if (esewaFormData && esewaFormRef.current) {
      esewaFormRef.current.submit()
    }
  }, [esewaFormData])

  // Fetch plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
        
        
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        const response = await fetch(`${API_URL}/api/subscription-payment/plans`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        })

        clearTimeout(timeout)

        if (!response.ok) {
          console.error('[v0] Plans fetch failed with status:', response.status)
          
          // If no plans found, try to seed them
          if (response.status === 404 || response.status === 500) {
            try {
              const seedResponse = await fetch(`${API_URL}/api/seed/plans`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
              })

              const seedData = await seedResponse.json().catch(() => ({ error: 'Failed to parse response' }))

              if (seedResponse.ok && seedData.plans) {
                
                // Wait a moment for database to be ready
                await new Promise(resolve => setTimeout(resolve, 1000))
                
                const retryResponse = await fetch(`${API_URL}/api/subscription-payment/plans`, {
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                })

                
                if (retryResponse.ok) {
                  const data = await retryResponse.json()
                  const sortedPlans = (data.plans || [])
                    .sort((a: Plan, b: Plan) => a.priceNPR - b.priceNPR)
                    .map((plan: Plan, index: number) => ({
                      ...plan,
                      recommended: index === 1,
                    }))
                  setPlans(sortedPlans)
                  setIsLoadingPlans(false)
                  return
                } else {
                  const retryData = await retryResponse.json().catch(() => ({}))
                  console.error('[v0] Retry fetch failed - status: ' + retryResponse.status, retryData)
                }
              } else {
                console.error('[v0] Seeding failed - response ok: ' + seedResponse.ok + ', has plans:', !!seedData.plans)
              }
            } catch (seedError: any) {
              console.error('[v0] Exception during seeding:', seedError.message, seedError.stack)
            }
          }
          throw new Error(`Failed to fetch plans: ${response.status}`)
        }

        const data = await response.json()
        
        // If no plans exist, seed them
        if (!data.plans || data.plans.length === 0) {
          try {
            const seedResponse = await fetch(`${API_URL}/api/seed/plans`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
            })

            const seedData = await seedResponse.json().catch(() => ({ error: 'Failed to parse response' }))

            if (seedResponse.ok && seedData.plans) {
              
              // Wait a moment for database to be ready
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              const retryResponse = await fetch(`${API_URL}/api/subscription-payment/plans`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
              })

              
              if (retryResponse.ok) {
                const retryData = await retryResponse.json()
                const sortedPlans = (retryData.plans || [])
                  .sort((a: Plan, b: Plan) => a.priceNPR - b.priceNPR)
                  .map((plan: Plan, index: number) => ({
                    ...plan,
                    recommended: index === 1,
                  }))
                setPlans(sortedPlans)
                setIsLoadingPlans(false)
                return
              } else {
                const retryData = await retryResponse.json().catch(() => ({}))
                console.error('[v0] Retry fetch failed - status: ' + retryResponse.status, retryData)
              }
            } else {
              console.error('[v0] Seeding failed - response ok: ' + seedResponse.ok + ', has plans:', !!seedData.plans)
            }
          } catch (seedError: any) {
            console.error('[v0] Exception during seeding:', seedError.message, seedError.stack)
          }
          // Still set empty plans and show error
          setPlans([])
          setIsLoadingPlans(false)
          throw new Error('No subscription plans available')
        }
        
        // Sort plans by price and set recommended flag
        const sortedPlans = (data.plans || [])
          .sort((a: Plan, b: Plan) => a.priceNPR - b.priceNPR)
          .map((plan: Plan, index: number) => ({
            ...plan,
            recommended: index === 1,
          }))

        setPlans(sortedPlans)
        
        // Check if plan is specified in URL params
        const planFromUrl = searchParams.get('plan')
        if (planFromUrl) {
          setSelectedPlan(planFromUrl)
        } else if (sortedPlans.length > 0) {
          setSelectedPlan(sortedPlans[1]?.id || sortedPlans[0]?.id)
        }
      } catch (error: any) {
        console.error('[v0] Error fetching plans:', error.message)
        if (error.name !== 'AbortError') {
          toast.error('Failed to load subscription plans')
        }
        setPlans([]) // Clear any partial data on error
      } finally {
        setIsLoadingPlans(false)
      }
    }

    fetchPlans()
  }, [searchParams])

  // Handle redirect when user is not authenticated
  useEffect(() => {
    if (!authLoading && !user && !fromSetup) {
      router.push('/login')
    }
  }, [user, authLoading, router, fromSetup])

  const handlePlanSelect = async (planId: string, billingPeriod: BillingPeriod) => {
    // For now, this initiates trial. User can also click "Pay with eSewa" for immediate payment
    await handleStartTrial(planId, billingPeriod)
  }

  const handleStartTrial = async (planId: string, billingPeriod?: BillingPeriod) => {
    setIsLoading(true)
    try {
      if (billingPeriod) {
        setSelectedBillingPeriod(billingPeriod)
      }

      const plan = plans.find(p => p.id === planId)
      if (!plan) {
        throw new Error('Plan not found')
      }


      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

      // Get current business
      const businessResponse = await fetch(`${API_URL}/api/businesses/current`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      })

      if (!businessResponse.ok) {
        const errorData = await businessResponse.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to get business information')
      }

      const businessData = await businessResponse.json()
      const businessId = businessData.id || businessData.business?.id

      if (!businessId) {
        throw new Error('Business ID not found')
      }


      // Create subscription with free trial
      const response = await fetch(`${API_URL}/api/subscriptions/create-trial`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          businessId,
          planId: plan.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        console.error('[v0] Subscription trial error response:', { status: response.status, data })
        throw new Error(data.message || data.error || `Server error: ${response.status}`)
      }

      toast.success(`${plan.displayName || plan.name} trial activated! You have 15 days free access.`)
      router.push('/dashboard')
    } catch (error: any) {
      console.error('[v0] Subscription creation error:', error)
      toast.error(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }
const handleEsewaPayment = async (planId: string, billingPeriod: BillingPeriod) => {
  setIsLoading(true)
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

    // Get current business
    const businessResponse = await fetch(`${API_URL}/api/businesses/current`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    })

    if (!businessResponse.ok) {
      const errorData = await businessResponse.json().catch(() => ({}))
      throw new Error(errorData.error || errorData.message || 'Failed to get business information')
    }

    const businessData = await businessResponse.json()
    const businessId = businessData.id || businessData.business?.id

    if (!businessId) {
      throw new Error('Business ID not found')
    }

    const response = await fetch(`${API_URL}/api/subscription-payment/esewa/initiate`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ businessId, planId, billingPeriod }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || 'Failed to initiate payment')
    }

    const data = await response.json()

    if (data.success && data.formData && data.paymentUrl) {
      setEsewaPaymentUrl(data.paymentUrl)
      setEsewaFormData(data.formData)
      toast.info('Redirecting to eSewa...')
    } else {
      throw new Error('Invalid payment response')
    }
  } catch (error: any) {
    console.error('[v0] eSewa payment error:', error)
    toast.error(error.message || 'Failed to initiate payment')
    setIsLoading(false)
  }
}



  const formatLimit = (limit: number): string => {
    return limit === -1 ? 'Unlimited' : limit.toString()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full animate-spin">
            <Loader className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    )
  }

  // Show error if plans failed to load
  if (!authLoading && !isLoadingPlans && plans.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Unable to Load Plans</h2>
            <p className="text-muted-foreground text-sm">
              We couldn&apos;t load the subscription plans at this time. Please try again or contact support if the issue persists.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (isLoadingPlans) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full animate-spin">
            <Loader className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading subscription plans...</p>
        </div>
      </div>
    )
  }

  // Allow access from setup flow or if user is authenticated
  if (!user && !fromSetup) {
    return null
  }

  // Show loading if plans not yet loaded
  if (!plans || plans.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading subscription plans...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4 z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
            <p className="text-sm font-semibold text-green-700">15 Days Free Trial Included</p>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with 15 days free trial. No credit card required. Pay with eSewa when ready.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-col p-8 transition-all duration-300 ${
                plan.recommended
                  ? 'md:scale-105 border-primary shadow-lg'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 -translate-y-1/2">
                  <Badge className="bg-primary text-primary-foreground">Recommended</Badge>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {plan.displayName || plan.name}
                </h3>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </div>

              {/* Billing Period Selector */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-muted-foreground mb-3">Billing Period</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedBillingPeriod('MONTHLY')}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      selectedBillingPeriod === 'MONTHLY'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setSelectedBillingPeriod('QUARTERLY')}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      selectedBillingPeriod === 'QUARTERLY'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    <span>3 Months</span>
                    <span className="block text-xs opacity-75 font-normal">Save 10%</span>
                  </button>
                  <button
                    onClick={() => setSelectedBillingPeriod('HALF_YEARLY')}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      selectedBillingPeriod === 'HALF_YEARLY'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    <span>6 Months</span>
                    <span className="block text-xs opacity-75 font-normal">Save 20%</span>
                  </button>
                  <button
                    onClick={() => setSelectedBillingPeriod('YEARLY')}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      selectedBillingPeriod === 'YEARLY'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    <span>Yearly</span>
                    <span className="block text-xs opacity-75 font-normal">Save 25%</span>
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    Rs. {Math.round(
                      selectedBillingPeriod === 'MONTHLY'
                        ? plan.priceNPR
                        : selectedBillingPeriod === 'QUARTERLY'
                        ? plan.priceNPR * 3 * 0.9
                        : selectedBillingPeriod === 'HALF_YEARLY'
                        ? plan.priceNPR * 6 * 0.8
                        : plan.priceNPR * 12 * 0.75
                    ).toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    {selectedBillingPeriod === 'MONTHLY'
                      ? '/month'
                      : selectedBillingPeriod === 'QUARTERLY'
                      ? '/3 months'
                      : selectedBillingPeriod === 'HALF_YEARLY'
                      ? '/6 months'
                      : '/year'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  15 days free trial included
                </p>
              </div>

              {/* Features */}
              <div className="flex-1 mb-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span>{formatLimit(plan.maxAppointmentsPerMonth)} appointments/month</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span>{formatLimit(plan.maxStaff)} staff members</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span>{formatLimit(plan.maxServices)} services</span>
                  </li>
                  {plan.features?.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary font-bold mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}

                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {trialUsed ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-900">
                      Your free trial has already been used. Please select a paid plan to continue.
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleStartTrial(plan.id, selectedBillingPeriod)}
                    disabled={isLoading || loadingTrialStatus}
                    variant={plan.recommended ? 'default' : 'outline'}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Start 15 Days Free Trial'
                    )}
                  </Button>
                )}
                <Button
                  onClick={() => handleEsewaPayment(plan.id, selectedBillingPeriod)}
                  disabled={isLoading || loadingTrialStatus}
                  variant="outline"
                  className="w-full gap-2"
                  size="lg"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay with eSewa
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Payment Methods Info */}
        <div className="max-w-2xl mx-auto mb-12">
          <Card className="p-6 bg-card/50 border-primary/20">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Secure Payment with eSewa
            </h3>
            <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <img 
                src="https://esewa.com.np/common/images/esewa-logo.png" 
                alt="eSewa" 
                className="h-10 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">eSewa Digital Wallet</p>
                <p className="text-sm text-muted-foreground">Safe and secure payment processing with instant confirmation</p>
              </div>
            </div>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">What happens after the trial?</h3>
              <p className="text-muted-foreground text-sm">
                After 15 days, you can continue using the service by paying with eSewa. Your data and settings will be preserved. Choose your preferred billing period (monthly, quarterly, 6-month, or yearly) for automatic discounts.
              </p>
            </div>
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">Can I upgrade my plan later?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can upgrade or downgrade your plan at any time. The new limits will apply immediately.
              </p>
            </div>
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">Do you offer discounts for longer billing periods?</h3>
              <p className="text-muted-foreground text-sm">
                Yes! Choose quarterly (-10%), semi-annual (-20%), or annual (-25%) billing to save money. The discount is automatically calculated when you select your preferred billing period.
              </p>
            </div>
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">What are the appointment limits?</h3>
              <p className="text-muted-foreground text-sm">
                Appointment limits reset monthly. If you reach your limit, you can upgrade to a higher plan for more appointments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden eSewa Form */}
      {esewaFormData && (
        <form
          ref={esewaFormRef}
          action={esewaPaymentUrl}
          method="POST"
          style={{ display: 'none' }}
        >
          <input type="hidden" name="amount" value={esewaFormData.amount} />
          <input type="hidden" name="tax_amount" value={esewaFormData.tax_amount} />
          <input type="hidden" name="total_amount" value={esewaFormData.total_amount} />
          <input type="hidden" name="transaction_uuid" value={esewaFormData.transaction_uuid} />
          <input type="hidden" name="product_code" value={esewaFormData.product_code} />
          <input type="hidden" name="product_service_charge" value={esewaFormData.product_service_charge} />
          <input type="hidden" name="product_delivery_charge" value={esewaFormData.product_delivery_charge} />
          <input type="hidden" name="success_url" value={esewaFormData.success_url} />
          <input type="hidden" name="failure_url" value={esewaFormData.failure_url} />
          <input type="hidden" name="signed_field_names" value={esewaFormData.signed_field_names} />
          <input type="hidden" name="signature" value={esewaFormData.signature} />
        </form>
      )}
    </div>
  )
}
