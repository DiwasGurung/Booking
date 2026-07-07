'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/authContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Loader, CreditCard, AlertCircle, Users, Calendar, Briefcase, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

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
  maxSmsPerMonth: number
  // Features
  allowSmsNotifications: boolean
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

export default function SubscriptionPage() {
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
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [esewaFormData, setEsewaFormData] = useState<EsewaFormData | null>(null)
  const [esewaPaymentUrl, setEsewaPaymentUrl] = useState<string>('')
  const esewaFormRef = useRef<HTMLFormElement>(null)
  
  // Check URL params for payment status
  const status = searchParams.get('status')
  const message = searchParams.get('message')
  const fromSetup = searchParams.get('from') === 'setup'

  // Show payment status messages
  useEffect(() => {
    if (status === 'success') {
      toast.success(message || 'Payment successful! Your subscription is now active.')
    } else if (status === 'failed') {
      toast.error(message || 'Payment failed. Please try again.')
    } else if (status === 'error') {
      toast.error(message || 'An error occurred during payment.')
    }
  }, [status, message])

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
        
        const response = await fetch(`${API_URL}/api/subscription-payment/plans`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch plans')
        }

        const data = await response.json()
        
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
      } catch (error) {
        console.error('[v0] Error fetching plans:', error)
        toast.error('Failed to load subscription plans')
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

  const handleStartTrial = async (plan: Plan) => {
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
        throw new Error(data.error || data.message || 'Failed to create subscription')
      }

      toast.success(`${plan.displayName || plan.name} trial activated! You have 30 days free access.`)
      router.push('/dashboard')
    } catch (error: any) {
      console.error('[v0] Subscription creation error:', error)
      toast.error(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEsewaPayment = async (plan: Plan) => {
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

      // Initiate eSewa payment
      const response = await fetch(`${API_URL}/api/subscription-payment/esewa/initiate`, {
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

  if (authLoading || isLoadingPlans) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
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
            <p className="text-sm font-semibold text-green-700">30 Days Free Trial Included</p>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with 30 days free trial. Pay with eSewa when ready.
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

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    Rs. {plan.priceNPR.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  30 days free trial included
                </p>
              </div>

              {/* Limits */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{formatLimit(plan.maxAppointmentsPerMonth)} appointments/month</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{formatLimit(plan.maxStaff)} staff members</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <span>{formatLimit(plan.maxServices)} services</span>
                </div>
                {plan.allowSmsNotifications && plan.maxSmsPerMonth > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span>{formatLimit(plan.maxSmsPerMonth)} SMS/month</span>
                  </div>
                )}
                {plan.allowSmsNotifications && plan.maxSmsPerMonth === -1 && (
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span>Unlimited SMS notifications</span>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="flex-1 mb-6">
                <ul className="space-y-3">
                  {plan.features?.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                  {plan.allowReports && (
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">Advanced Reports</span>
                    </li>
                  )}
                  {plan.prioritySupport && (
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">Priority Support</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => handleStartTrial(plan)}
                  disabled={isLoading}
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
                    'Start 30 Days Free Trial'
                  )}
                </Button>
                <Button
                  onClick={() => handleEsewaPayment(plan)}
                  disabled={isLoading}
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
          <Card className="p-6 bg-card/50">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Methods
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <img 
                  src="https://esewa.com.np/common/images/esewa-logo.png" 
                  alt="eSewa" 
                  className="h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div>
                  <p className="font-medium text-sm">eSewa</p>
                  <p className="text-xs text-muted-foreground">Digital Wallet</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg opacity-50">
                <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                  K
                </div>
                <div>
                  <p className="font-medium text-sm">Khalti</p>
                  <p className="text-xs text-muted-foreground">Coming Soon</p>
                </div>
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
                After 30 days, you can continue using the service by paying with eSewa. Your data and settings will be preserved.
              </p>
            </div>
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">Can I upgrade my plan later?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can upgrade or downgrade your plan at any time. The new limits will apply immediately.
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
