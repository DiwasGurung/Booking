'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

export interface SubscriptionUsage {
  appointmentCurrent: number
  appointmentLimit: number
  appointmentUnlimited: boolean
  staffCurrent: number
  staffLimit: number
  staffUnlimited: boolean
  serviceCurrent: number
  serviceLimit: number
  serviceUnlimited: boolean
  planName?: string
}

export interface SubscriptionUsageWithHelpers extends SubscriptionUsage {
  staffUsagePercent: number
  staffCanAddMore: boolean
  appointmentUsagePercent: number
  serviceUsagePercent: number
}

export function useSubscriptionUsage(businessId: string | null | undefined) {
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = useCallback(async () => {
    if (!businessId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      
      const response = await fetch(`${API_URL}/api/subscriptions/usage/${businessId}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch subscription usage')
      }

      const response_data = await response.json()
      // Extract the nested data object from the API response
      const actualUsage = response_data.data || response_data
      setUsage(actualUsage)
    } catch (err: any) {
      console.error('[v0] Error fetching subscription usage:', err.message)
      setError(err.message)
      setUsage(null)
    } finally {
      setLoading(false)
    }
  }, [businessId])

  // Compute helper values
  const usageWithHelpers = useMemo(() => {
    if (!usage) return null

    const staffUsagePercent = usage.staffUnlimited ? 0 : Math.round((usage.staffCurrent / usage.staffLimit) * 100)
    const appointmentUsagePercent = usage.appointmentUnlimited ? 0 : Math.round((usage.appointmentCurrent / usage.appointmentLimit) * 100)
    const serviceUsagePercent = usage.serviceUnlimited ? 0 : Math.round((usage.serviceCurrent / usage.serviceLimit) * 100)

    return {
      ...usage,
      staffUsagePercent,
      staffCanAddMore: usage.staffUnlimited || usage.staffCurrent < usage.staffLimit,
      appointmentUsagePercent,
      serviceUsagePercent,
    }
  }, [usage])

  useEffect(() => {
    fetchUsage()
  }, [businessId, fetchUsage])

  return { 
    usage: usageWithHelpers as SubscriptionUsageWithHelpers | null, 
    loading, 
    error, 
    refetch: fetchUsage,
    // Convenience accessors
    staff: {
      current: usage?.staffCurrent || 0,
      limit: usage?.staffLimit || 0,
      unlimited: usage?.staffUnlimited || false,
    },
    appointments: {
      current: usage?.appointmentCurrent || 0,
      limit: usage?.appointmentLimit || 0,
      unlimited: usage?.appointmentUnlimited || false,
    },
    services: {
      current: usage?.serviceCurrent || 0,
      limit: usage?.serviceLimit || 0,
      unlimited: usage?.serviceUnlimited || false,
    },
  }
}
