

'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PaymentProvider } from '@/context/PaymentContext';
import { SubscriptionPayment } from '@/components/SubscriptionPayment';

interface Plan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  description: string;
  features: string[];
}

const SUBSCRIPTION_PLANS: Record<string, Plan> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    amount: 499,
    currency: 'NPR',
    description: 'Perfect for small businesses',
    features: [
      'Up to 50 bookings/month',
      'Basic analytics',
      'Email support'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    amount: 999,
    currency: 'NPR',
    description: 'For growing businesses',
    features: [
      'Unlimited bookings',
      'Advanced analytics',
      'Priority support',
      'Custom branding'
    ]
  }
};

export default function SubscriptionCheckout() {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string>('');

  useEffect(() => {
    const planId = searchParams.get('plan');
    const subId = searchParams.get('subscriptionId');

    if (planId && SUBSCRIPTION_PLANS[planId]) {
      setPlan(SUBSCRIPTION_PLANS[planId]);
    }

    if (subId) {
      setSubscriptionId(subId);
    }
  }, [searchParams]);

  if (!plan || !subscriptionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid Plan</h1>
          <p className="text-muted-foreground mb-4">
            The plan or subscription ID is missing
          </p>
          <a href="/subscription" className="text-primary hover:underline">
            Back to Plans
          </a>
        </div>
      </div>
    );
  }

  const handlePaymentSuccess = (paymentId: string) => {
    console.log('Payment successful:', paymentId);
    // Redirect to success page or dashboard
    window.location.href = `/subscription/payment-success?paymentId=${paymentId}`;
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-background">
      <PaymentProvider>
        <SubscriptionPayment
          plan={plan}
          subscriptionId={subscriptionId}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </PaymentProvider>
    </div>
  );
}
