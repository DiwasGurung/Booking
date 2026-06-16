'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { paymentApi } from '@/lib/api';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface GatewayStatus {
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  currency: string[];
  features: string[];
}

export const GatewayStatusComponent: React.FC = () => {
  const [gateways, setGateways] = useState<GatewayStatus[]>([
    {
      name: 'eSewa',
      status: 'active',
      currency: ['NPR'],
      features: ['Instant Settlement', 'Low Fees', 'Local Support'],
    },
    {
      name: 'Khalti',
      status: 'active',
      currency: ['NPR'],
      features: ['Fast Checkout', 'Multiple Payment Methods', 'Nepal Only'],
    },
    {
      name: 'Nabil Bank',
      status: 'active',
      currency: ['NPR'],
      features: ['Direct Bank Transfer', 'Secure Payment', 'Merchant Account'],
    },
    {
      name: 'Stripe',
      status: 'active',
      currency: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      features: ['Global Coverage', 'Multiple Currencies', 'Advanced Reporting'],
    },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGatewayStatus = async () => {
      try {
        setLoading(true);
        // Check each gateway status
        const gateways = ['ESEWA', 'KHALTI', 'NABIL', 'STRIPE'];
        const statusResults: GatewayStatus[] = [];

        for (const gateway of gateways) {
          try {
            const result = await paymentApi.getGatewayStatus(gateway as any);
            const statusMap: Record<string, GatewayStatus> = {
              ESEWA: {
                name: 'eSewa',
                status: result.available ? 'active' : 'inactive',
                currency: ['NPR'],
                features: ['Instant Settlement', 'Low Fees', 'Local Support'],
              },
              KHALTI: {
                name: 'Khalti',
                status: result.available ? 'active' : 'inactive',
                currency: ['NPR'],
                features: ['Fast Checkout', 'Multiple Payment Methods', 'Nepal Only'],
              },
              NABIL: {
                name: 'Nabil Bank',
                status: result.available ? 'active' : 'inactive',
                currency: ['NPR'],
                features: ['Direct Bank Transfer', 'Secure Payment', 'Merchant Account'],
              },
              STRIPE: {
                name: 'Stripe',
                status: result.available ? 'active' : 'inactive',
                currency: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
                features: ['Global Coverage', 'Multiple Currencies', 'Advanced Reporting'],
              },
            };
            statusResults.push(statusMap[gateway]);
          } catch (err) {
            // If API call fails, assume gateway is available
            console.warn(`Could not check ${gateway} status:`, err);
          }
        }

        if (statusResults.length > 0) {
          setGateways(statusResults);
        }
      } catch (err) {
        console.error('Failed to fetch gateway status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGatewayStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'maintenance':
        return <Clock className="h-5 w-5 text-amber-600" />;
      case 'inactive':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 border-emerald-200';
      case 'maintenance':
        return 'bg-amber-50 border-amber-200';
      case 'inactive':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'maintenance':
        return 'Maintenance';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Gateway Status</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading gateway status...</div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {gateways.map((gateway) => (
              <div
                key={gateway.name}
                className={`border rounded-lg p-4 ${getStatusColor(gateway.status)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-base">{gateway.name}</h3>
                  {getStatusIcon(gateway.status)}
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Status: <span className="font-semibold">{getStatusText(gateway.status)}</span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {gateway.currency.map((curr) => (
                      <span
                        key={curr}
                        className="inline-block px-2 py-1 text-xs font-semibold bg-white rounded border border-slate-200"
                      >
                        {curr}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Features:</p>
                  <ul className="space-y-1">
                    {gateway.features.map((feature) => (
                      <li key={feature} className="text-xs text-slate-600">
                        • {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
