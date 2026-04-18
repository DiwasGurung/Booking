// components/payment/EsewaPaymentForm.tsx

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { usePayment } from '@/context/PaymentContext';
import { paymentApi } from '@/lib/api';

interface EsewaPaymentFormProps {
  subscriptionId: string;
  amount: number;
  currency: string;
  planName: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export function EsewaPaymentForm({
  subscriptionId,
  amount,
  currency,
  planName,
  onSuccess,
  onError
}: EsewaPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { setIsProcessing, setError, setCurrentPaymentId } = usePayment();

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setIsProcessing(true);
      setError(null);

      // Initiate payment with backend using unified API
      const result = await paymentApi.initiatePayment({
        method: 'ESEWA',
        subscriptionId,
        amount,
        currency,
        planName
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      const paymentId = String(result.paymentId || result.transactionId || '');
      setCurrentPaymentId(paymentId);

      if (result.data && typeof result.data === 'object') {
        // Create eSewa payment form dynamically
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://esewa.com.np/api/v2/payment/initiate/';
        form.target = '_blank';

        const paymentData = result.data as unknown as Record<string, string>;
        Object.keys(paymentData).forEach((key) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = paymentData[key];
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

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
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800">
          Amount: <span className="font-semibold">Rs. {amount.toFixed(2)}</span>
        </p>
        <p className="text-xs text-green-700 mt-1">Plan: {planName}</p>
      </div>

      <Button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700"
        size="lg"
      >
        {isLoading ? 'Processing...' : 'Pay with eSewa'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        You will be redirected to eSewa to complete payment
      </p>
    </div>
  );
}
