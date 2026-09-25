'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Check } from 'lucide-react'
import Link from 'next/link'

type Plan = {
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  highlighted?: boolean
  cta: string
}

const plans: Plan[] = [
  {
    name: 'Basic',
    description: 'For individuals just getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Up to 10 bookings / month',
      'Email support',
      'Basic scheduling tools',
      '1 team member',
    ],
    cta: 'Get Started',
  },
  {
    name: 'Pro',
    description: 'For growing businesses that need more',
    monthlyPrice: 1499,
    yearlyPrice: 14990,
    features: [
      'Unlimited bookings',
      'Priority email & chat support',
      'Advanced scheduling tools',
      'Up to 5 team members',
      'Custom booking page',
      'SMS reminders',
    ],
    highlighted: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'Business',
    description: 'For teams that need full control',
    monthlyPrice: 3499,
    yearlyPrice: 34990,
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Dedicated account manager',
      'API access',
      'Custom integrations',
      'Advanced analytics',
    ],
    cta: 'Contact Sales',
  },
]

export default function PricingPage() {
  const [yearly, setYearly] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <Breadcrumbs />

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Choose the plan that fits your needs. Upgrade or cancel anytime.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-10">
          <span className={`text-sm font-medium ${!yearly ? 'text-foreground' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <button
            onClick={() => setYearly(!yearly)}
            className="relative w-14 h-7 rounded-full bg-primary/20 transition-colors"
            aria-label="Toggle yearly billing"
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-primary transition-transform ${
                yearly ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${yearly ? 'text-foreground' : 'text-muted-foreground'}`}>
            Yearly <span className="text-primary">(save ~17%)</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice
            const period = yearly ? '/year' : '/month'

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

                <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">
                    {price === 0 ? 'Free' : `Rs. ${price.toLocaleString()}`}
                  </span>
                  {price !== 0 && (
                    <span className="text-muted-foreground text-sm">{period}</span>
                  )}
                </div>

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