'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/Button'
import { Badge } from './ui/badge'
import { Check, Zap } from 'lucide-react'

export type BillingPeriod = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY'

interface BillingPeriodOption {
  id: BillingPeriod
  label: string
  months: number
  price: number
  discountPercent: number
  monthlyEquivalent: number
}

interface BillingPeriodSelectorProps {
  planName: string
  monthlyPrice: number
  quarterlyPrice?: number
  semiAnnualPrice?: number
  annualPrice?: number
  selectedPeriod: BillingPeriod
  onPeriodChange: (period: BillingPeriod) => void
  disabled?: boolean
}

export function BillingPeriodSelector({
  planName,
  monthlyPrice,
  quarterlyPrice,
  semiAnnualPrice,
  annualPrice,
  selectedPeriod,
  onPeriodChange,
  disabled = false,
}: BillingPeriodSelectorProps) {
  const calculateDiscount = (originalMonthly: number, period: number, price: number) => {
    const fullPrice = originalMonthly * period
    const discount = ((fullPrice - price) / fullPrice) * 100
    return Math.round(discount)
  }

  const periods: BillingPeriodOption[] = [
    {
      id: 'MONTHLY',
      label: 'Monthly',
      months: 1,
      price: monthlyPrice,
      discountPercent: 0,
      monthlyEquivalent: monthlyPrice,
    },
    {
      id: 'QUARTERLY',
      label: '3 Months',
      months: 3,
      price: quarterlyPrice || monthlyPrice * 3,
      discountPercent: calculateDiscount(monthlyPrice, 3, quarterlyPrice || monthlyPrice * 3),
      monthlyEquivalent: Math.round((quarterlyPrice || monthlyPrice * 3) / 3),
    },
    {
      id: 'HALF_YEARLY',
      label: '6 Months',
      months: 6,
      price: semiAnnualPrice || monthlyPrice * 6,
      discountPercent: calculateDiscount(monthlyPrice, 6, semiAnnualPrice || monthlyPrice * 6),
      monthlyEquivalent: Math.round((semiAnnualPrice || monthlyPrice * 6) / 6),
    },
    {
      id: 'YEARLY',
      label: 'Yearly',
      months: 12,
      price: annualPrice || monthlyPrice * 12,
      discountPercent: calculateDiscount(monthlyPrice, 12, annualPrice || monthlyPrice * 12),
      monthlyEquivalent: Math.round((annualPrice || monthlyPrice * 12) / 12),
    },
  ]

  const selectedOption = periods.find(p => p.id === selectedPeriod) || periods[0]
  const savings = monthlyPrice * selectedOption.months - selectedOption.price

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {periods.map((period) => (
          <div
            key={period.id}
            onClick={() => !disabled && onPeriodChange(period.id)}
            className={`cursor-pointer transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Card
              className={`h-full relative overflow-hidden transition-all ${
                selectedPeriod === period.id
                  ? 'border-primary shadow-lg ring-2 ring-primary/50'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {selectedPeriod === period.id && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
              )}

              {period.discountPercent > 0 && (
                <Badge className="absolute top-2 left-2 bg-green-500 hover:bg-green-600">
                  Save {period.discountPercent}%
                </Badge>
              )}

              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{period.label}</CardTitle>
                <CardDescription className="text-xs">
                  {period.months === 1 ? 'Best for trying' : `Save ${savings} NPR`}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2">
                <div>
                  <p className="text-2xl font-bold text-primary">₹{period.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    ₹{period.monthlyEquivalent.toLocaleString()}/month
                  </p>
                </div>

                {period.discountPercent > 0 && (
                  <p className="text-xs font-medium text-green-600">
                    <Zap className="w-3 h-3 inline mr-1" />
                    Best value!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Summary Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">You selected</p>
              <p className="text-lg font-semibold">
                {selectedOption.label} - ₹{selectedOption.price.toLocaleString()}
              </p>
            </div>
            {savings > 0 && (
              <div className="text-right">
                <p className="text-sm text-green-600 font-medium">
                  Save ₹{savings.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  vs monthly billing
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
