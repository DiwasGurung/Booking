'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBusinessId } from '@/hooks/useBusinessId'

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

export interface UsageMetric {
  current: number
  limit: number
  unlimited: boolean
  percentage: number
}

export interface SubscriptionUsageWithHelpers extends SubscriptionUsage {
  /** Backward-compatible aliases used by existing dashboard cards. */
  staffCount: number
  bookingsThisMonth: number
  staffUsagePercent: number
  staffCanAddMore: boolean
  appointmentUsagePercent: number
  serviceUsagePercent: number
  staffUsage: UsageMetric
  serviceUsage: UsageMetric
  appointmentUsage: UsageMetric
}

export interface UseSubscriptionUsageReturn {
  usage: SubscriptionUsageWithHelpers | null
  staffUsage?: UsageMetric
  serviceUsage?: UsageMetric
  appointmentUsage?: UsageMetric
  planName?: string
  loading: boolean
  error?: string
  refetch: () => Promise<void>
}

const asNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const metric = (currentValue: unknown, limitValue: unknown, unlimitedValue: unknown): UsageMetric => {
  const current = asNumber(currentValue)
  const limit = asNumber(limitValue, -1)
  const unlimited = unlimitedValue === true || limit === -1
  return { current, limit: unlimited ? -1 : limit, unlimited, percentage: unlimited || limit <= 0 ? 0 : Math.min(100, Math.round((current / limit) * 100)) }
}

export function useSubscriptionUsage(businessIdOverride?: string | null): UseSubscriptionUsageReturn {
  const { businessId: hookBusinessId } = useBusinessId()
  const businessId = businessIdOverride ?? hookBusinessId
  const [data, setData] = useState<SubscriptionUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const fetchUsage = useCallback(async () => {
    if (!businessId) { setData(null); setLoading(false); return }
    try {
      setLoading(true); setError(undefined)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      const response = await fetch(`${apiUrl}/api/subscription-payment/usage/${businessId}`, { credentials: 'include' })
      if (!response.ok) throw new Error('Failed to fetch subscription usage')
      const payload = await response.json()
      const result = payload.data || payload
      if (payload.success === false || !result) throw new Error(payload.error || payload.message || 'Failed to load subscription data')
      const usageResult = result.usage || result.currentUsage || result
      const limits = result.limits || result.plan || {}
      const appointments = usageResult.appointmentsThisMonth ?? usageResult.appointmentCurrent
      const staff = usageResult.staff ?? usageResult.staffCurrent
      const services = usageResult.services ?? usageResult.serviceCurrent
      const appointmentLimit = limits.maxAppointmentsPerMonth ?? result.appointmentLimit
      const staffLimit = limits.maxStaff ?? result.staffLimit
      const serviceLimit = limits.maxServices ?? result.serviceLimit
      setData({
        appointmentCurrent: asNumber(appointments), appointmentLimit: asNumber(appointmentLimit, -1), appointmentUnlimited: result.appointmentUnlimited === true || appointmentLimit === -1,
        staffCurrent: asNumber(staff), staffLimit: asNumber(staffLimit, -1), staffUnlimited: result.staffUnlimited === true || staffLimit === -1,
        serviceCurrent: asNumber(services), serviceLimit: asNumber(serviceLimit, -1), serviceUnlimited: result.serviceUnlimited === true || serviceLimit === -1,
        planName: result.planName || result.subscription?.planName,
      })
    } catch (err) { setData(null); setError(err instanceof Error ? err.message : 'Failed to load subscription data') }
    finally { setLoading(false) }
  }, [businessId])

  useEffect(() => { void fetchUsage() }, [fetchUsage])

  const usage = useMemo(() => {
    if (!data) return null
    const staffUsage = metric(data.staffCurrent, data.staffLimit, data.staffUnlimited)
    const serviceUsage = metric(data.serviceCurrent, data.serviceLimit, data.serviceUnlimited)
    const appointmentUsage = metric(data.appointmentCurrent, data.appointmentLimit, data.appointmentUnlimited)
    return {
      ...data,
      staffCount: staffUsage.current,
      bookingsThisMonth: appointmentUsage.current,
      staffUsagePercent: staffUsage.percentage,
      staffCanAddMore: staffUsage.unlimited || staffUsage.current < staffUsage.limit,
      appointmentUsagePercent: appointmentUsage.percentage,
      serviceUsagePercent: serviceUsage.percentage,
      staffUsage,
      serviceUsage,
      appointmentUsage,
    }
  }, [data])

  return { usage, staffUsage: usage?.staffUsage, serviceUsage: usage?.serviceUsage, appointmentUsage: usage?.appointmentUsage, planName: usage?.planName, loading, error, refetch: fetchUsage }
}
