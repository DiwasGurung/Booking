'use client'

import { useRouter } from 'next/navigation'
import { Users, Briefcase, Calendar, AlertCircle, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/progess'
import { useSubscriptionUsage } from '@/hooks/useSusbcriptionUsage'

export function SubscriptionUsageCard() {
  const router = useRouter()
  const { usage, loading, staffUsage, serviceUsage, appointmentUsage } = useSubscriptionUsage()

  if (loading) {
    return (
      <div className="bg-muted/50 rounded-lg p-4 animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    )
  }

  const formatUsage = (current: number, limit: number, unlimited: boolean) => {
    if (unlimited) return `${current} / Unlimited`
    return `${current} / ${limit}`
  }

  const isNearLimit = (percentage: number) => percentage >= 80
  const isAtLimit = (percentage: number) => percentage >= 100

  if (!usage) {
    return (
      <div className="bg-muted/50 rounded-lg p-4 animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    )
  }

  // Check if all features are unlimited (Enterprise plan)
  const isUnlimited = staffUsage?.unlimited && serviceUsage?.unlimited && appointmentUsage?.unlimited

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Plan: {usage?.planName || 'Unknown'}</h3>
          <p className="text-xs text-muted-foreground">
            {isUnlimited ? 'Unlimited access' : 'Your current usage'}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => router.push('/subscription')}>
          <Zap className="w-4 h-4 mr-2" />
          Upgrade
        </Button>
      </div>

      {/* Show unlimited message for Enterprise plan */}
      {isUnlimited && (
        <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
          <p className="font-medium">Unlimited access to all features</p>
          <p className="text-xs text-green-700">You have unrestricted access to staff, services, and bookings.</p>
        </div>
      )}

      {/* Staff Usage */}
      {staffUsage && !staffUsage.unlimited && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className={`w-4 h-4 ${isAtLimit(staffUsage.percentage) ? 'text-destructive' : isNearLimit(staffUsage.percentage) ? 'text-yellow-600' : 'text-primary'}`} />
              <span className="text-sm font-medium">Staff Members</span>
            </div>
            <span className={`text-xs font-semibold ${isAtLimit(staffUsage.percentage) ? 'text-destructive' : isNearLimit(staffUsage.percentage) ? 'text-yellow-600' : 'text-primary'}`}>
              {formatUsage(staffUsage.current, staffUsage.limit, false)}
            </span>
          </div>
          <Progress value={Math.min(staffUsage.percentage, 100)} className="h-2" />
          {isAtLimit(staffUsage.percentage) && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Limit reached. Upgrade to add more staff.
            </p>
          )}
          {isNearLimit(staffUsage.percentage) && !isAtLimit(staffUsage.percentage) && (
            <p className="text-xs text-yellow-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Near limit. Consider upgrading soon.
            </p>
          )}
        </div>
      )}

      {/* Services Usage */}
      {serviceUsage && !serviceUsage.unlimited && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className={`w-4 h-4 ${isAtLimit(serviceUsage.percentage) ? 'text-destructive' : isNearLimit(serviceUsage.percentage) ? 'text-yellow-600' : 'text-primary'}`} />
              <span className="text-sm font-medium">Services</span>
            </div>
            <span className={`text-xs font-semibold ${isAtLimit(serviceUsage.percentage) ? 'text-destructive' : isNearLimit(serviceUsage.percentage) ? 'text-yellow-600' : 'text-primary'}`}>
              {formatUsage(serviceUsage.current, serviceUsage.limit, false)}
            </span>
          </div>
          <Progress value={Math.min(serviceUsage.percentage, 100)} className="h-2" />
          {isAtLimit(serviceUsage.percentage) && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Limit reached. Upgrade to add more services.
            </p>
          )}
          {isNearLimit(serviceUsage.percentage) && !isAtLimit(serviceUsage.percentage) && (
            <p className="text-xs text-yellow-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Near limit. Consider upgrading soon.
            </p>
          )}
        </div>
      )}

      {/* Appointments Usage */}
      {appointmentUsage && !appointmentUsage.unlimited && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className={`w-4 h-4 ${isAtLimit(appointmentUsage.percentage) ? 'text-destructive' : isNearLimit(appointmentUsage.percentage) ? 'text-yellow-600' : 'text-primary'}`} />
              <span className="text-sm font-medium">Monthly Bookings</span>
            </div>
            <span className={`text-xs font-semibold ${isAtLimit(appointmentUsage.percentage) ? 'text-destructive' : isNearLimit(appointmentUsage.percentage) ? 'text-yellow-600' : 'text-primary'}`}>
              {formatUsage(appointmentUsage.current, appointmentUsage.limit, false)}
            </span>
          </div>
          <Progress value={Math.min(appointmentUsage.percentage, 100)} className="h-2" />
          {isAtLimit(appointmentUsage.percentage) && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Monthly limit reached. Upgrade for more bookings.
            </p>
          )}
          {isNearLimit(appointmentUsage.percentage) && !isAtLimit(appointmentUsage.percentage) && (
            <p className="text-xs text-yellow-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Approaching monthly limit. Upgrade soon.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
