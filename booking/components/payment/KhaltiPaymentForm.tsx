// components/payment/KhaltiPaymentForm.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { usePayment } from '@/context/PaymentContext';
import { paymentApi } from '@/lib/api';

interface KhaltiPaymentFormProps {
  subscriptionId: string;
  amount: number;
  currency: string;
  planName: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export function KhaltiPaymentForm({
  subscriptionId,
  amount,
  currency,
  planName,
  onSuccess,
  onError
}: KhaltiPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { setIsProcessing, setError, setCurrentPaymentId } = usePayment();

  // Load Khalti script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/2.0.0/khalti-checkout.js';
    script.async = true;
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setIsProcessing(true);
      setError(null);

      // Initiate payment with backend using unified API
      const result = await paymentApi.initiatePayment({
        method: 'KHALTI',
        subscriptionId,
        amount,
        currency,
        planName
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      setCurrentPaymentId((result.paymentId || result.transactionId || '') as unknown as string);

      // Use Khalti checkout
      if ((window as any).KhaltiCheckout) {
        const checkout = new (window as any).KhaltiCheckout({
          publicKey: process.env.NEXT_PUBLIC_KHALTI_PUBLIC_KEY,
          productIdentity: subscriptionId,
          productName: planName,
          productUrl: window.location.origin,
          eventHandler: {
            onSuccess: async (payload: any) => {
              // Verify payment with backend using unified API
              const verifyResult = await paymentApi.verifyKhaltiPayment(
                payload.token,
                amount
              );

              if (verifyResult.success) {
                onSuccess?.((result.paymentId || result.transactionId || '') as unknown as string);
              } else {
                throw new Error(verifyResult.message);
              }
            },
            onError: (error: any) => {
              throw new Error(error.message || 'Khalti payment failed');
            },
            onClose: () => {
              console.log('Khalti payment cancelled');
            }
          },
          amount: Math.round(amount * 100) // Khalti uses paisa
        });

        checkout.show();
      } else {
        throw new Error('Khalti SDK not loaded');
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
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-purple-800">
          Amount: <span className="font-semibold">Rs. {amount.toFixed(2)}</span>
        </p>
        <p className="text-xs text-purple-700 mt-1">Plan: {planName}</p>
      </div>

      <Button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full bg-purple-600 hover:bg-purple-700"
        size="lg"
      >
        {isLoading ? 'Processing...' : 'Pay with Khalti'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Support: Khalti Wallet, Bank, Mobile Money
      </p>
    </div>
  );
}
