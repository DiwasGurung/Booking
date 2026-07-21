'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/Button'
import { Badge } from './ui/badge'
import { Check, X, Zap } from 'lucide-react'
import { BillingPeriodSelector, type BillingPeriod } from './BillingPeriodSelector'
import { extractPricing, type PlanPricing } from '@/lib/pricing-utils'

interface SubscriptionPlanCardProps {
  planId: string
  planName: string
  displayName: string
  description: string
  monthlyPrice?: number
  quarterlyPrice?: number
  semiAnnualPrice?: number
  annualPrice?: number
  plan?: any // Can pass full plan object instead of individual prices
  features: {
    name: string
    included: boolean
  }[]
  isPopular?: boolean
  isCurrentPlan?: boolean
  trialDays?: number
  onSelect?: (planId: string, billingPeriod: BillingPeriod) => Promise<void>
  loading?: boolean
}

export function SubscriptionPlanCard({
  planId,
  planName,
  displayName,
  description,
  monthlyPrice,
  quarterlyPrice,
  semiAnnualPrice,
  annualPrice,
  plan,
  features,
  isPopular = false,
  isCurrentPlan = false,
  trialDays = 15,
  onSelect,
  loading = false,
}: SubscriptionPlanCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<BillingPeriod>('MONTHLY')
  const [isSelecting, setIsSelecting] = useState(false)

  // Extract pricing from plan object or use provided props
  const pricing: PlanPricing = plan
    ? extractPricing(plan)
    : {
        monthlyPrice: monthlyPrice || 0,
        quarterlyPrice,
        semiAnnualPrice,
        annualPrice,
      }

  const finalMonthlyPrice = pricing.monthlyPrice

  const handleSelect = async () => {
    if (!onSelect) return

    try {
      setIsSelecting(true)
      await onSelect(planId, selectedPeriod)
    } finally {
      setIsSelecting(false)
    }
  }

  return (
    <Card
      className={`relative h-full transition-all ${
        isPopular
          ? 'ring-2 ring-primary shadow-lg border-primary'
          : 'border-border hover:border-primary/50'
      } ${isCurrentPlan ? 'bg-primary/5' : ''}`}
    >
      {isPopular && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1">
            <Zap className="w-3 h-3 mr-1 inline" />
            Most Popular
          </Badge>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute top-4 right-4">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className={isPopular ? 'pt-8' : ''}>
        <div className="space-y-2">
          <CardTitle className="text-2xl">{displayName}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Price Display */}
        <div className="space-y-2">
          <p className="text-4xl font-bold">
            ₹{finalMonthlyPrice.toLocaleString()}
            <span className="text-lg text-muted-foreground font-normal">/month</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {trialDays} days free trial, then auto-renews
          </p>
        </div>

        {/* Billing Period Selector */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Choose your billing period:</p>
          <BillingPeriodSelector
            planName={displayName}
            monthlyPrice={pricing.monthlyPrice}
            quarterlyPrice={pricing.quarterlyPrice}
            semiAnnualPrice={pricing.semiAnnualPrice}
            annualPrice={pricing.annualPrice}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            disabled={isCurrentPlan}
          />
        </div>

        {/* Features List */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Features included:</p>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                {feature.included ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-muted-foreground" />
                )}
                <span className={feature.included ? 'text-foreground' : 'text-muted-foreground'}>
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleSelect}
          disabled={isCurrentPlan || loading || isSelecting}
          className={`w-full ${isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
          size="lg"
        >
          {isCurrentPlan
            ? 'Current Plan'
            : loading || isSelecting
            ? 'Processing...'
            : `Start ${trialDays}-Day Trial`}
        </Button>
      </CardFooter>
    </Card>
  )
}
