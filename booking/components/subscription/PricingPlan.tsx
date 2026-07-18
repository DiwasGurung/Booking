'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface SubscriptionPlan {
  id: string
  displayName: string
  name: string
  priceNPR: number
  description: string
  features: string[]
  maxAppointmentsPerMonth: number
  maxStaff: number
  maxServices: number
}

export default function PricingPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/subscriptions/plans/all`)

      if (!response.ok) {
        throw new Error('Failed to fetch plans')
      }

      const data = await response.json()
      setPlans(data.plans)
      // Set Professional as default (most popular)
      const professionalPlan = data.plans.find((p: SubscriptionPlan) => p.name === 'professional')
      if (professionalPlan) {
        setSelectedPlan(professionalPlan.id)
      }
    } catch (error) {
      console.error('[v0] Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pricing plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing for Nepal Businesses
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the perfect plan for your business. All plans include a 30-day free trial.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg border transition-all cursor-pointer ${
                selectedPlan === plan.id
                  ? 'border-primary shadow-lg ring-2 ring-primary'
                  : 'border-input hover:border-primary/50'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {/* Badge for popular plan */}
              {plan.name === 'professional' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Plan name and description */}
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {plan.displayName}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">
                    ₹{plan.priceNPR}
                  </span>
                  <span className="text-muted-foreground ml-2">/month</span>
                  <p className="text-xs text-muted-foreground mt-2">
                    or ₹{Math.round(plan.priceNPR * 10)} annually (2 months free)
                  </p>
                </div>

                {/* CTA Button */}
                <Link
                  href={`/subscription/select?planId=${plan.id}`}
                  className="w-full"
                >
                  <Button
                    className="w-full"
                    variant={selectedPlan === plan.id ? 'default' : 'outline'}
                  >
                    Get Started
                  </Button>
                </Link>

                {/* Features */}
                <div className="mt-8 space-y-4">
                  <p className="text-sm font-semibold text-foreground">Key Features:</p>

                  {/* Limits */}
                  <div className="space-y-2">
                    <FeatureItem
                      label="Bookings/Month"
                      value={
                        plan.maxAppointmentsPerMonth === -1
                          ? 'Unlimited'
                          : `${plan.maxAppointmentsPerMonth}`
                      }
                      highlight={plan.maxAppointmentsPerMonth === -1}
                    />
                    <FeatureItem
                      label="Staff Members"
                      value={plan.maxStaff === -1 ? 'Unlimited' : `Up to ${plan.maxStaff}`}
                      highlight={plan.maxStaff === -1}
                    />
                    <FeatureItem
                      label="Services"
                      value={plan.maxServices === -1 ? 'Unlimited' : `Up to ${plan.maxServices}`}
                      highlight={plan.maxServices === -1}
                    />
                  </div>

                  {/* Features list */}
                  <div className="border-t pt-4">
                    <ul className="space-y-2">
                      {plan.features.slice(0, 5).map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm text-muted-foreground">
                          <CheckIcon />
                          <span className="ml-2">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
            Detailed Feature Comparison
          </h3>
          <ComparisonTable plans={plans} />
        </div>

        {/* FAQ */}
        <div className="mt-16 space-y-8">
          <h3 className="text-2xl font-bold text-foreground text-center mb-8">
            Frequently Asked Questions
          </h3>
          <FAQItem
            question="Can I change my plan later?"
            answer="Yes! You can upgrade or downgrade your plan at any time. Changes will take effect on your next billing cycle."
          />
          <FAQItem
            question="What payment methods do you accept?"
            answer="We accept eSewa, Khalti, and Stripe for secure payments in Nepal."
          />
          <FAQItem
            question="Is there a free trial?"
            answer="Yes! All plans include a 30-day free trial with full access to all features."
          />
          <FAQItem
            question="What happens after my trial ends?"
            answer="Your trial will expire and you'll need to choose a paid plan to continue using the service. You'll receive reminders before your trial ends."
          />
        </div>
      </div>
    </div>
  )
}

function FeatureItem({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </span>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-primary flex-shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function ComparisonTable({ plans }: { plans: SubscriptionPlan[] }) {
  const comparisonFeatures = [
    { label: 'Bookings per Month', key: 'bookings' },
    { label: 'Staff Members', key: 'staff' },
    { label: 'Services', key: 'services' },
    { label: 'SMS Reminders', key: 'sms' },
    { label: 'Email Notifications', key: 'email' },
    { label: 'Payment Collection', key: 'payment' },
    { label: 'Analytics', key: 'analytics' },
    { label: 'Custom Branding', key: 'branding' },
    { label: 'Priority Support', key: 'support' },
    { label: 'API Access', key: 'api' },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-4 px-4 font-semibold">Feature</th>
            {plans.map((plan) => (
              <th key={plan.id} className="text-center py-4 px-4 font-semibold">
                {plan.displayName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparisonFeatures.map((feature) => (
            <tr key={feature.key} className="border-b">
              <td className="py-4 px-4 text-sm text-muted-foreground">{feature.label}</td>
              {plans.map((plan) => (
                <td key={plan.id} className="py-4 px-4 text-center">
                  <FeatureComparison feature={feature.key} plan={plan} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FeatureComparison({
  feature,
  plan,
}: {
  feature: string
  plan: SubscriptionPlan
}) {
  const features: Record<string, boolean | string> = {
    bookings: plan.maxAppointmentsPerMonth === -1 ? 'Unlimited' : `${plan.maxAppointmentsPerMonth}`,
    staff: plan.maxStaff === -1 ? 'Unlimited' : `${plan.maxStaff}`,
    services: plan.maxServices === -1 ? 'Unlimited' : `${plan.maxServices}`,
    sms: plan.name !== 'starter' ? 'Yes' : 'Limited',
    email: true,
    payment: plan.name !== 'starter' ? true : false,
    analytics: plan.name !== 'starter' ? true : false,
    branding: plan.name === 'enterprise' ? true : false,
    support: plan.name !== 'starter' ? true : false,
    api: plan.name === 'enterprise' ? true : false,
  }

  const value = features[feature]

  if (typeof value === 'boolean') {
    return value ? <CheckIcon /> : <XIcon />
  }

  return <span className="text-sm font-semibold">{value}</span>
}

function XIcon() {
  return (
    <svg
      className="w-5 h-5 text-muted-foreground inline"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border rounded-lg p-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex justify-between items-center w-full text-left"
      >
        <h4 className="font-semibold text-foreground">{question}</h4>
        <span className={`transform transition-transform ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {open && <p className="mt-4 text-muted-foreground">{answer}</p>}
    </div>
  )
}
