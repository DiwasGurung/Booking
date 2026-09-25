'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Check } from 'lucide-react'
import Link from 'next/link'

type BillingPeriod = 'monthly' | 'quarterly' | 'semiAnnual' | 'annual'

type Plan = {
  name: string
  displayName: string
  description: string
  prices: Record<BillingPeriod, number>
  features: string[]
  highlighted?: boolean
  cta: string
}

const periodMeta: Record<BillingPeriod, { label: string; months: number; discount: string | null }> = {
  monthly: { label: 'Monthly', months: 1, discount: null },
  quarterly: { label: 'Quarterly', months: 3, discount: 'Save 10%' },
  semiAnnual: { label: 'Semi-Annual', months: 6, discount: 'Save 20%' },
  annual: { label: 'Annual', months: 12, discount: 'Save 25%' },
}

const plans: Plan[] = [
  {
    name: 'starter',
    displayName: 'Starter',
    description: 'Perfect for solo practitioners and new businesses',
    prices: {
      monthly: 499,
      quarterly: 1347,
      semiAnnual: 2394,
      annual: 4491,
    },
    features: [
      'Up to 200 bookings/month',
      'Up to 5 services',
      'Email notifications',
      'Online booking',
      'Email support',
      '30-day booking history',
    ],
    cta: 'Get Started',
  },
  {
    name: 'professional',
    displayName: 'Professional',
    description: 'For growing salons, clinics, and small teams',
    prices: {
      monthly: 999,
      quarterly: 2697,
      semiAnnual: 4794,
      annual: 8991,
    },
    features: [
      'Unlimited bookings',
      'Staff management (up to 5 staff)',
      'Email notifications & reminders for booking date',
      'Online booking',
      'Booking analytics and reports',
      'PDF export of filtered bookings',
      'Priority email support',
    ],
    highlighted: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'For large spas, chains, and multi-location businesses',
    prices: {
      monthly: 2499,
      quarterly: 6747,
      semiAnnual: 11994,
      annual: 22491,
    },
    features: [
      'Everything in Professional',
      'Unlimited staff',
      'Advanced booking analytics',
      'Staff performance analytics',
      'Custom analytics and history',
      'Priority email support',
      'SMS reminders for booking date',
      'PDF export of filtered bookings',
    ],
    cta: 'Contact Sales',
  },
]

export default function PricingPage() {
  const [period, setPeriod] = useState<BillingPeriod>('monthly')

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <Breadcrumbs />

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Choose the plan that fits your business. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        {/* Billing period selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {(Object.keys(periodMeta) as BillingPeriod[]).map((key) => {
            const meta = periodMeta[key]
            const active = period === key
            return (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {meta.label}
                {meta.discount && (
                  <span
                    className={`ml-2 text-xs font-semibold ${
                      active ? 'text-primary-foreground/80' : 'text-primary'
                    }`}
                  >
                    {meta.discount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const price = plan.prices[period]
            const months = periodMeta[period].months
            const perMonth = price / months

            return (
              <Card
                key={plan.name}
                className={`relative border p-8 flex flex-col ${
                  plan.highlighted
                    ? 'border-primary shadow-xl scale-[1.02] md:scale-105'
                    : 'border-border shadow-lg'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}

                <h3 className="text-xl font-bold text-foreground mb-1">{plan.displayName}</h3>
                <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

                <div className="mb-1">
                  <span className="text-4xl font-bold text-foreground">
                    Rs. {price.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {' '}
                    / {periodMeta[period].label.toLowerCase()}
                  </span>
                </div>
                {months > 1 && (
                  <p className="text-xs text-muted-foreground mb-6">
                    ≈ Rs. {perMonth.toFixed(0)} / month
                  </p>
                )}
                {months === 1 && <div className="mb-6" />}

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.highlighted ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </Card>
            )
          })}
        </div>

        <Card className="border border-border shadow-lg p-8 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Have questions?</h2>
          <p className="text-muted-foreground mb-4">
            Reach out and we&apos;ll help you find the right plan.
          </p>
          <Link href="/contact">
            <Button variant="outline">Contact Us</Button>
          </Link>
        </Card>
      </div>
    </div>
  )
}