// components/payment/PaymentGatewaySelector.tsx

'use client';

import React from 'react';
import { usePayment, PaymentMethod } from '@/context/PaymentContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';

interface GatewayOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
  currency: string;
}

const GATEWAY_OPTIONS: GatewayOption[] = [
  {
    id: 'ESEWA',
    name: 'eSewa',
    description: 'Pay with eSewa (NPR)',
    icon: '🏦',
    currency: 'NPR'
  },
  {
    id: 'NABIL' as PaymentMethod,
    name: 'Nabil Bank',
    description: 'Pay with Nabil Bank (NPR)',
    icon: '🏧',
    currency: 'NPR'
  },
  {
    id: 'KHALTI',
    name: 'Khalti',
    description: 'Pay with Khalti (NPR)',
    icon: '📱',
    currency: 'NPR'
  },
  {
    id: 'STRIPE',
    name: 'Stripe',
    description: 'Pay with Stripe (USD/EUR/etc)',
    icon: '💳',
    currency: 'USD'
  }
];

interface PaymentGatewaySelectorProps {
  onSelectGateway: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export function PaymentGatewaySelector({
  onSelectGateway,
  disabled = false
}: PaymentGatewaySelectorProps) {
  const { selectedMethod, setSelectedMethod } = usePayment();

  const handleSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    onSelectGateway(method);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {GATEWAY_OPTIONS.map((gateway) => (
        <Card
          key={gateway.id}
          className={`p-4 cursor-pointer transition-all ${
            selectedMethod === gateway.id
              ? 'ring-2 ring-primary bg-primary/5'
              : 'hover:border-primary/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !disabled && handleSelect(gateway.id)}
        >
          <div className="text-center">
            <div className="text-3xl mb-2">{gateway.icon}</div>
            <h3 className="font-semibold text-sm">{gateway.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {gateway.description}
            </p>
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-secondary rounded">
              {gateway.currency}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
