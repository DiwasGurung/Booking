'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/authContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Loader } from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
  id: string
  name: string
  displayName?: string
  priceNPR: number
  description: string
  features?: string[]
  recommended?: boolean
}

export default function Subscription() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  
  // Check if coming from setup flow to prevent redirect loops
  const fromSetup = searchParams.get('from') === 'setup'

  // Fetch plans from API on page load
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
        console.log('[v0] Fetching subscription plans from API...')
        
        const response = await fetch(`${API_URL}/api/seed/plans`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch plans')
        }

        const data = await response.json()
        console.log('[v0] Plans fetched:', data.plans?.length)
        
        // Sort plans by price and set recommended flag
        const sortedPlans = (data.plans || []).map((plan: Plan, index: number) => ({
          ...plan,
          recommended: index === 1, // Make middle plan recommended
        }))

        setPlans(sortedPlans)
        
        // Set default selected plan to the middle one (recommended)
        if (sortedPlans.length > 0) {
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
  }, [])

  console.log('[v0] SubscriptionPage rendered, user:', user?.id, 'role:', user?.role, 'loading:', authLoading, 'fromSetup:', fromSetup)

  // Handle redirect when user is not authenticated (unless coming from setup)
  useEffect(() => {
    console.log('[v0] SubscriptionPage useEffect - checking auth, fromSetup:', fromSetup)
    if (!authLoading && !user && !fromSetup) {
      console.log('[v0] SubscriptionPage - user not authenticated, redirecting to login')
      router.push('/login')
    }
  }, [user, authLoading, router, fromSetup])

  const handleSelectPlan = async (plan: Plan) => {
    setIsLoading(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      console.log('[v0] API_URL:', API_URL)

      // Get current business
      console.log('[v0] Fetching current business...')
      const businessResponse = await fetch(`${API_URL}/api/businesses/current`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('[v0] Business response status:', businessResponse.status)
      if (!businessResponse.ok) {
        const errorData = await businessResponse.json().catch(() => ({}))
        console.error('[v0] Business fetch error:', errorData)
        throw new Error('Failed to get business information')
      }

      const businessData = await businessResponse.json()
      console.log('[v0] Business data received:', businessData.id)
      const businessId = businessData.id

      // Create subscription with free trial using the actual plan ID from database
      console.log('[v0] Creating subscription for business:', businessId, 'plan:', plan.id)
      const response = await fetch(`${API_URL}/api/subscriptions/create-trial`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          planId: plan.id, // Use the actual database UUID ID
        }),
      })

      console.log('[v0] Subscription response status:', response.status)
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        console.error('[v0] Subscription creation error response:', data)
        throw new Error(data.error || data.message || 'Failed to create subscription')
      }

      const subscriptionData = await response.json()
      console.log('[v0] Subscription created:', subscriptionData.subscription?.id)

      toast.success(`${plan.displayName || plan.name} trial activated! You have 30 days free access.`)

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      console.error('[v0] Subscription creation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || isLoadingPlans) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading subscription plans...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Trial Banner */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
            <p className="text-sm font-semibold text-green-700">30 Days Free Trial Included</p>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with 30 days free trial. No credit card required. Cancel anytime.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-col p-8 transition-all duration-300 ${plan.recommended
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
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </div>

              {/* Trial Badge */}
              <div className="mb-4 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
                <p className="text-xs font-semibold text-blue-700">30 DAYS FREE • Then ₨{plan.priceNPR}/month</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    ₨{plan.priceNPR}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Billed monthly after trial</p>
              </div>

              <div className="flex-1 mb-6">
                <ul className="space-y-3">
                  {(plan.features || []).map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={() => handleSelectPlan(plan)}
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
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">Can I change my plan?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </div>
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground text-sm">
                We accept all major credit/debit cards, Khalti, and eSewa for easy payment processing.
              </p>
            </div>
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground text-sm">
                Yes! Every plan includes 30 days of free access. No credit card required to start your trial. You can upgrade, downgrade, or cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
