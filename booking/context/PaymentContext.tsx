// context/PaymentContext.tsx

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type PaymentMethod = 'ESEWA' | 'KHALTI' | 'STRIPE';

export interface PaymentContextType {
  selectedMethod: PaymentMethod | null;
  setSelectedMethod: (method: PaymentMethod) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  success: boolean;
  setSuccess: (success: boolean) => void;
  currentPaymentId: string | null;
  setCurrentPaymentId: (paymentId: string | null) => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);

  return (
    <PaymentContext.Provider
      value={{
        selectedMethod,
        setSelectedMethod,
        isProcessing,
        setIsProcessing,
        error,
        setError,
        success,
        setSuccess,
        currentPaymentId,
        setCurrentPaymentId
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within PaymentProvider');
  }
  return context;
}
