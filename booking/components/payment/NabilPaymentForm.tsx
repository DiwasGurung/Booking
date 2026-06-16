'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { usePayment } from '@/context/PaymentContext';
import { paymentApi } from '@/lib/api';
import { Loader } from 'lucide-react';

interface NabilPaymentFormProps {
  subscriptionId: string;
  amount: number;
  currency: string;
  planName: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export function NabilPaymentForm({
  subscriptionId,
  amount,
  currency,
  planName,
  onSuccess,
  onError
}: NabilPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { setIsProcessing, setError, setCurrentPaymentId } = usePayment();

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setIsProcessing(true);
      setError(null);

      // Initiate payment with backend
      const result = await paymentApi.initiatePayment({
        method: 'NABIL' as any,
        subscriptionId,
        amount,
        currency,
        planName
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      const currentPaymentId =
        typeof result.paymentId === 'string'
          ? result.paymentId
          : typeof result.transactionId === 'string'
          ? result.transactionId
          : '';

      setCurrentPaymentId(currentPaymentId);

      // Redirect to Nabil Bank payment gateway
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        throw new Error('Payment URL not provided');
      }

      onSuccess?.(currentPaymentId);
    } catch (error: any) {
      const errorMsg = error.message || 'Payment initiation failed';
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
        <h3 className="font-semibold text-blue-900 mb-2">Nabil Bank Payment</h3>
        <p className="text-sm text-blue-800">
          You will be redirected to Nabil Bank's secure payment gateway to complete your payment.
        </p>
      </div>
      
      <Button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            🏧 Pay with Nabil Bank - Rs. {amount}
          </>
        )}
      </Button>
    </div>
  );
}
