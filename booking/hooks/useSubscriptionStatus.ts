import { useEffect, useState } from 'react'
import { useAuth } from '@/context/authContext'
import { useBusinessId } from './useBusinessId'

interface SubscriptionStatus {
  hasSubscription: boolean
  status: string | null
  planName?: string
  daysRemaining: number | null
  expiresAt: string | null
  autoRenew?: boolean
}

export const useSubscriptionStatus = () => {
  const { user, loading: authLoading } = useAuth()
  const { businessId, loading: businessLoading } = useBusinessId()
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!businessId || businessLoading || authLoading) {
        return
      }

      try {
        setLoading(true)
        setError(null)

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
        const response = await fetch(`${API_URL}/api/subscriptions/status/${businessId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch subscription status')
        }

        const data = await response.json()
        setSubscriptionStatus(data)
      } catch (err) {
        console.error('[v0] Error fetching subscription status:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
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