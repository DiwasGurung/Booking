'use client';

import React, { useEffect, useState } from 'react';
import { PaymentStatsCard } from './PaymentStatusCard';
import { paymentApi } from '@/lib/api';
import {
  CreditCard,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Package,
} from 'lucide-react';

interface PaymentStatsData {
  totalRevenue: number;
  activeSubscriptions: number;
  successRate: number;
  failedPayments: number;
  pendingPayments: number;
  monthlyGrowth: number;
}

export const PaymentStats: React.FC<{ userId?: string }> = ({ userId }) => {
  const [stats, setStats] = useState<PaymentStatsData>({
    totalRevenue: 0,
    activeSubscriptions: 0,
    successRate: 0,
    failedPayments: 0,
    pendingPayments: 0,
    monthlyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        if (userId) {
          // Fetch user payment history for stats
          const paymentHistory = await paymentApi.getUserPayments(userId, 1, 100);
          const payments = Array.isArray(paymentHistory) ? paymentHistory : paymentHistory.paymentId || [];

          // Calculate stats from payments
          const completed = payments.filter((p: { status: string; }) => p.status === 'COMPLETED').length;
          const failed = payments.filter((p: { status: string; }) => p.status === 'FAILED').length;
          const pending = payments.filter((p: { status: string; }) => p.status === 'PENDING').length;
          
          const totalRevenue = payments
            .filter((p: { status: string; }) => p.status === 'COMPLETED')
            .reduce((sum: any, p: { amount: any; }) => sum + p.amount, 0);

          const successRate = payments.length > 0 
            ? Math.round((completed / payments.length) * 100) 
            : 0;

          setStats({
            totalRevenue,
            activeSubscriptions: completed,
            successRate,
            failedPayments: failed,
            pendingPayments: pending,
            monthlyGrowth: 12, // This would be calculated from historical data
          });
        }
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch payment stats:', err);
        setError(err.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return <div className="text-center py-4">Loading stats...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-600">{error}</div>;
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <PaymentStatsCard
        title="Total Revenue"
        value={`$${stats.totalRevenue.toFixed(2)}`}
        subtext="All time"
        icon={CreditCard}
        trend={{ value: stats.monthlyGrowth, isPositive: true }}
        variant="success"
      />
      <PaymentStatsCard
        title="Active Subscriptions"
        value={stats.activeSubscriptions}
        subtext="Paid subscriptions"
        icon={Package}
        variant="default"
      />
      <PaymentStatsCard
        title="Success Rate"
        value={`${stats.successRate}%`}
        subtext="Payment success"
        icon={CheckCircle}
        variant="success"
      />
      <PaymentStatsCard
        title="Failed Payments"
        value={stats.failedPayments}
        subtext={`${stats.pendingPayments} pending`}
        icon={AlertCircle}
        variant={stats.failedPayments > 0 ? 'danger' : 'default'}
      />
    </div>
  );
};
