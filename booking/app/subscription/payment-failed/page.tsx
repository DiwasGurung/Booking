// app/subscription/payment-failed/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const paymentId = searchParams.get('paymentId');

  return (
    <div className="min-h-screen py-12 px-4 bg-background">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Payment Failed ✕
          </CardTitle>
          <CardDescription className="text-center">
            We couldn't process your payment
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Alert */}
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'An error occurred while processing your payment. Please try again.'}
            </AlertDescription>
          </Alert>

          {/* Troubleshooting Tips */}
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-sm">What you can try:</h3>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Check your payment method details</li>
              <li>• Ensure sufficient balance/credit limit</li>
              <li>• Try a different payment method</li>
              <li>• Contact your bank or payment provider</li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-900">
              Still having issues?{' '}
              <a href="mailto:support@example.com" className="font-semibold hover:underline">
                Contact support
              </a>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button className="w-full" size="lg" onClick={() => window.history.back()}>
              Try Again
            </Button>
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/subscription'}>
              Back to Plans
            </Button>
          </div>

          {/* Payment ID for Support */}
          {paymentId && (
            <div className="text-xs text-muted-foreground text-center">
              Payment ID: <span className="font-mono">{paymentId}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
