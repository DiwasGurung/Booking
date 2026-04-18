// components/SubscriptionPayment.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PaymentGatewaySelector } from './payment/PaymentGatewaySelector';
import { StripePaymentForm } from './payment/StripePaymentForm';
import { EsewaPaymentForm } from './payment/EsewaPaymentForm';
import { KhaltiPaymentForm } from './payment/KhaltiPaymentForm';
import { usePayment, PaymentMethod } from '@/context/PaymentContext';

interface Plan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  description: string;
  features: string[];
}

interface SubscriptionPaymentProps {
  plan: Plan;
  subscriptionId: string;
  onPaymentSuccess?: (paymentId: string) => void;
}

export function SubscriptionPayment({
  plan,
  subscriptionId,
  onPaymentSuccess
}: SubscriptionPaymentProps) {
  const { selectedMethod, error, success, isProcessing } = usePayment();
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handleGatewaySelect = (method: PaymentMethod) => {
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    onPaymentSuccess?.(paymentId);
  };

  const handlePaymentError = (errorMsg: string) => {
    console.error('Payment error:', errorMsg);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Complete Your {plan.name} Subscription</CardTitle>
        <CardDescription>
          Select a payment method to proceed with your subscription
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Plan Summary */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Plan</span>
            <span className="text-sm">{plan.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Amount</span>
            <span className="text-lg font-bold">
              {plan.currency === 'NPR' ? 'Rs.' : '$'} {plan.amount.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {plan.description}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              Payment successful! Your subscription is now active.
            </AlertDescription>
          </Alert>
        )}

        {/* Gateway Selection */}
        {!showPaymentForm && !success && (
          <>
            <div>
              <h3 className="text-sm font-semibold mb-4">
                Choose a Payment Method
              </h3>
              <PaymentGatewaySelector
                onSelectGateway={handleGatewaySelect}
                disabled={isProcessing}
              />
            </div>

            <Button
              onClick={() => setShowPaymentForm(true)}
              disabled={!selectedMethod || isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? 'Processing...' : 'Continue to Payment'}
            </Button>
          </>
        )}

        {/* Payment Forms */}
        {showPaymentForm && !success && selectedMethod && (
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => setShowPaymentForm(false)}
              className="w-full"
            >
              Back to Gateway Selection
            </Button>

            {selectedMethod === 'STRIPE' && (
              <StripePaymentForm
                subscriptionId={subscriptionId}
                amount={plan.amount}
                currency={plan.currency}
                planName={plan.name}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}

            {selectedMethod === 'ESEWA' && (
              <EsewaPaymentForm
                subscriptionId={subscriptionId}
                amount={plan.amount}
                currency={plan.currency}
                planName={plan.name}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}

            {selectedMethod === 'KHALTI' && (
              <KhaltiPaymentForm
                subscriptionId={subscriptionId}
                amount={plan.amount}
                currency={plan.currency}
                planName={plan.name}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}
          </div>
        )}

        {/* Success State */}
        {success && (
          <div className="text-center space-y-4">
            <div className="text-4xl">✓</div>
            <div>
              <h3 className="font-semibold">Payment Successful</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your {plan.name} subscription is now active
              </p>
            </div>
            <Button className="w-full" onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
