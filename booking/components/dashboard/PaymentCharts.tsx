'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { paymentApi } from '@/lib/api';

interface ChartData {
  name: string;
  value: number;
  count?: number;
}

export const RevenueByGateway: React.FC<{ userId?: string }> = ({ userId }) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userId) {
          const payments = await paymentApi.getUserPayments(userId, 1, 100);
          const paymentList = Array.isArray(payments) ? payments : payments.paymentId || [];

          // Group revenue by gateway
          const gatewayRevenue: Record<string, number> = {
            'eSewa': 0,
            'Khalti': 0,
            'Stripe': 0,
          };

          paymentList.forEach((p: { status: string; gateway: string; amount: number; }) => {
            if (p.status === 'COMPLETED') {
              const gateway = p.gateway === 'ESEWA' ? 'eSewa' : p.gateway === 'KHALTI' ? 'Khalti' : 'Stripe';
              gatewayRevenue[gateway] += p.amount;
            }
          });

          setData(
            Object.entries(gatewayRevenue).map(([name, value]) => ({
              name,
              value: Math.round(value * 100) / 100,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch revenue data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Payment Gateway</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: $${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value}`} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export const PaymentStatusDistribution: React.FC<{ userId?: string }> = ({
  userId,
}) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userId) {
          const payments = await paymentApi.getUserPayments(userId, 1, 100);
          const paymentList = Array.isArray(payments) ? payments : payments.paymentId || [];

          // Group by status
          const statusCount: Record<string, number> = {
            'Completed': 0,
            'Failed': 0,
            'Pending': 0,
          };

          paymentList.forEach((p: { status: string; }) => {
            const status = p.status === 'COMPLETED' ? 'Completed' : p.status === 'FAILED' ? 'Failed' : 'Pending';
            statusCount[status]++;
          });

          setData(
            Object.entries(statusCount).map(([name, value]) => ({
              name,
              value,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch status data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export const MonthlyRevenueChart: React.FC<{ userId?: string }> = ({
  userId,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userId) {
          const payments = await paymentApi.getUserPayments(userId, 1, 100);
          const paymentList = Array.isArray(payments) ? payments : payments.paymentId || [];

          // Group by month
          const monthlyData: Record<string, number> = {};

          paymentList.forEach((p: { status: string; createdAt: string | number | Date; amount: number; }) => {
            if (p.status === 'COMPLETED') {
              const date = new Date(p.createdAt);
              const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              monthlyData[month] = (monthlyData[month] || 0) + p.amount;
            }
          });

          setData(
            Object.entries(monthlyData).map(([month, revenue]) => ({
              month,
              revenue: Math.round(revenue * 100) / 100,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch monthly data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
