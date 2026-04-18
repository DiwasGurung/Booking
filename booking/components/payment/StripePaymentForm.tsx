// components/payment/StripePaymentForm.tsx

'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/Button';
import { usePayment } from '@/context/PaymentContext';
import { paymentApi } from '@/lib/api';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface StripePaymentFormProps {
  subscriptionId: string;
  amount: number;
  currency: string;
  planName: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export function StripePaymentForm({
  subscriptionId,
  amount,
  currency,
  planName,
  onSuccess,
  onError
}: StripePaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { setIsProcessing, setError, setCurrentPaymentId } = usePayment();

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setIsProcessing(true);
      setError(null);

      // Initiate payment with backend using unified API
      const result = await paymentApi.initiatePayment({
        method: 'STRIPE',
        subscriptionId,
        amount,
        currency,
        planName
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      const paymentId = (result.paymentId || result.transactionId || '') as unknown as string;
      setCurrentPaymentId(paymentId);

      if (result.success) {
        // Use Stripe Elements or Checkout to complete payment
        const stripe = await stripePromise;
        if (!stripe) throw new Error('Stripe failed to load');

        // After payment success, verify with backend
        await paymentApi.verifyStripePayment(
          paymentId,
          paymentId
        );

        onSuccess?.(paymentId);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Payment failed';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          Amount: <span className="font-semibold">${amount.toFixed(2)} {currency}</span>
        </p>
        <p className="text-xs text-blue-700 mt-1">Plan: {planName}</p>
      </div>

      <Button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? 'Processing...' : 'Pay with Stripe'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Your payment is secure and encrypted
      </p>
    </div>
  );
}
