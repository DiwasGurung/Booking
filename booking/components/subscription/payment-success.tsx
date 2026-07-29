// app/subscription/payment-success/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { paymentApi } from '@/lib/api';
import { processEsewaCallback, extractEsewaResponseFromParams } from '@/lib/esewa-response-handler';

interface PaymentDetails {
  id: string;
  status: string;
  amount: number;
  currency: string;
  gateway: 'ESEWA' | 'KHALTI' | 'STRIPE';
  subscription?: {
    planName?: string;
  };
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('paymentId');
  
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        // Handle eSewa callback response (Base64-encoded in 'data' parameter)
        const esewaData = extractEsewaResponseFromParams(Object.fromEntries(searchParams));
        if (esewaData) {
          console.log('[eSewa] Processing callback response');
          
          // Process and verify the callback response
          const secretKey = process.env.NEXT_PUBLIC_ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
          const verification = processEsewaCallback(esewaData, secretKey);

          if (verification.valid && verification.data) {
            console.log('[eSewa] Payment verified successfully:', verification.data);
            
            // Only activate subscription if payment is COMPLETE
            if (verification.data.status === 'COMPLETE') {
              setPayment({
                id: verification.data.transaction_code,
                status: 'COMPLETED',
                amount: verification.data.total_amount,
                currency: 'NPR',
                gateway: 'ESEWA',
                subscription: {
                  planName: 'Active Subscription'
                }
              });
            } else {
              console.warn('[eSewa] Payment not complete. Status:', verification.data.status);
              router.push(`/subscription/payment-failed?reason=${verification.data.status}`);
              return;
            }
          } else {
            console.error('[eSewa] Payment verification failed:', verification.error);
            router.push(`/subscription/payment-failed?reason=${encodeURIComponent(verification.error || 'Verification failed')}`);
            return;
          }
          setLoading(false);
          return;
        }

        // Fetch real payment details by ID
        if (paymentId) {
          try {
            const details = await paymentApi.getPaymentDetails(paymentId);
            if (details) {
              setPayment(details as PaymentDetails);
            }
          } catch (error) {
            console.error('[v0] Failed to fetch payment details:', error);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [paymentId, searchParams, router]);

  return (
    <div className="min-h-screen py-12 px-4 bg-background">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Payment Successful! ✓
          </CardTitle>
          <CardDescription className="text-center">
            Your subscription is now active
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading payment details...</p>
            </div>
          ) : payment ? (
            <>
              {/* Payment Details */}
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Payment ID</span>
                  <span className="font-mono text-xs">{payment.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Amount</span>
                  <span className="font-bold">
                    {payment.currency === 'NPR' ? 'Rs.' : '$'} {payment.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Payment Method</span>
                  <span>{payment.gateway}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Plan</span>
                  <span>{payment.subscription?.planName || 'N/A'}</span>
                </div>
              </div>

              {/* Confirmation Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-sm text-green-800">
                  A confirmation email has been sent to your registered email address.
                </p>
              </div>

              {/* Next Steps */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">What's next?</h3>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>✓ Your subscription is now active</li>
                  <li>✓ Access all premium features</li>
                  <li>✓ Your subscription will renew on the same date each month</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => router.push('/dashboard')}
                >
                  Go to Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/subscription/my-payments')}
                >
                  View Subscription Details
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Could not load payment details
              </p>
              <Button variant="outline" onClick={() => window.location.href = '/subscription'}>
                Back to Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
