import { useEffect, useState } from 'react'
import { useAuth } from '@/context/authContext'
import { useBusinessId } from './useBusinessId'

interface SubscriptionStatus {
  hasSubscription: boolean
  status: string | null
  planName?: string
  planPrice?: number
  currency?: string
  maxStaff?: number
  maxAppointmentsPerMonth?: number
  maxServices?: number
  maxCustomers?: number
  daysRemaining: number | null
  trialEndsAt?: string | null
  expiresAt: string | null
  startDate?: string | null
  autoRenew?: boolean
  isTrialUsed?: boolean
}

export const useSubscriptionStatus = () => {
  const { user, loading: authLoading } = useAuth()
  const { businessId, loading: businessLoading } = useBusinessId()
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
    if (!businessId) {
      return
    }

      try {
        setLoading(true)
        setError(null)

        const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
        
        const response = await fetch(`${API_URL}/api/subscriptions/status/${businessId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData?.message || `Server returned ${response.status}: ${response.statusText}`
          console.error('[v0] Subscription status error response:', { status: response.status, error: errorData })
          throw new Error(errorMessage)
        }

        const data = await response.json()
        console.log('[v0] Subscription status fetched:', data)
        setSubscriptionStatus(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.error('[v0] Error fetching subscription status:', errorMessage)
        setError(errorMessage)
        
        // Set default subscription status when there's an error
        setSubscriptionStatus({
          hasSubscription: false,
          status: null,
          daysRemaining: null,
          expiresAt: null,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptionStatus()
  }, [businessId, businessLoading, authLoading])

  return {
    subscriptionStatus,
    loading,
    error,
    hasValidSubscription:
      subscriptionStatus?.hasSubscription &&
      (subscriptionStatus?.status === 'ACTIVE' || subscriptionStatus?.status === 'TRIAL'),
  }
}
