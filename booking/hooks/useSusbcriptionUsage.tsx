'use client'

import { useEffect, useState } from 'react'
import { useBusinessId } from './useBusinessId'

export interface UsageData {
  planName: string
  staffCount: number
  maxStaff: number
  serviceCount: number
  maxServices: number
  appointmentCount: number
  maxAppointments: number
}

export function useSubscriptionUsage() {
  const { businessId, loading: businessLoading } = useBusinessId()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!businessId || businessLoading) return

    const fetchUsage = async () => {
      try {
        setLoading(true)
        setError(null)

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
        const response = await fetch(`${API_URL}/api/subscriptions/usage/${businessId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData?.message || 'Failed to fetch usage data')
        }

        const data = await response.json()
        setUsage(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        console.error('[v0] Error fetching subscription usage:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsage()
  }, [businessId, businessLoading])

  return {
    usage,
    loading,
    error,
    staffUsage: usage
      ? {
          current: usage.staffCount,
          limit: usage.maxStaff,
          percentage: usage.maxStaff === -1 ? 0 : (usage.staffCount / usage.maxStaff) * 100,
          unlimited: usage.maxStaff === -1,
        }
      : null,
    serviceUsage: usage
      ? {
          current: usage.serviceCount,
          limit: usage.maxServices,
          percentage: usage.maxServices === -1 ? 0 : (usage.serviceCount / usage.maxServices) * 100,
          unlimited: usage.maxServices === -1,
        }
      : null,
    appointmentUsage: usage
      ? {
          current: usage.appointmentCount,
          limit: usage.maxAppointments,
          percentage:
            usage.maxAppointments === -1 ? 0 : (usage.appointmentCount / usage.maxAppointments) * 100,
          unlimited: usage.maxAppointments === -1,
        }
      : null,
  }
}
