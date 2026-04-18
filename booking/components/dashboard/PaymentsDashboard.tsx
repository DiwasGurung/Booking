'use client';

import React, { useState } from 'react';
import { PaymentStats } from '@/components/dashboard/PaymentStats';
import { RevenueByGateway, PaymentStatusDistribution, MonthlyRevenueChart } from '@/components/dashboard/PaymentCharts';
import { PaymentHistoryTable } from '@/components/dashboard/PaymentHistoryTable';
import { SubscriptionManagerTable } from '@/components/dashboard/SubscriptionManagerTable';
import { GatewayStatusComponent } from '@/components/dashboard/GatewayStatusComponent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PaymentsDashboardProps {
  userId?: string;
}

export const PaymentsDashboard: React.FC<PaymentsDashboardProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const handleSubscriptionEdit = (subscription: any) => {
    console.log('Edit subscription:', subscription);
    // Implement edit functionality
  };

  const handleSubscriptionCancel = (subscriptionId: string) => {
    console.log('Cancel subscription:', subscriptionId);
    // Implement cancel functionality with confirmation
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Payment Dashboard</h1>
        <p className="text-slate-600 mt-2">
          Manage your subscriptions, payments, and revenue analytics
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <PaymentStats userId={userId} />
          <GatewayStatusComponent />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <RevenueByGateway userId={userId} />
            <PaymentStatusDistribution userId={userId} />
          </div>
          <MonthlyRevenueChart userId={userId} />
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <PaymentHistoryTable userId={userId} />
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <SubscriptionManagerTable
            userId={userId}
            onEdit={handleSubscriptionEdit}
            onCancel={handleSubscriptionCancel}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentsDashboard;
