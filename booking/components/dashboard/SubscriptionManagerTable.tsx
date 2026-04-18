'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';

interface Subscription {
  id: string;
  userId: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'PENDING';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
}

interface SubscriptionManagerProps {
  userId?: string;
  onEdit?: (subscription: Subscription) => void;
  onCancel?: (subscriptionId: string) => void;
}

export const SubscriptionManagerTable: React.FC<SubscriptionManagerProps> = ({
  userId,
  onEdit,
  onCancel,
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        // This would fetch from your subscriptions API
        // For now, we'll use mock data - replace with actual API call
        const mockSubscriptions: Subscription[] = [
          {
            id: 'sub_1',
            userId: userId || 'user_1',
            planName: 'Pro Plan',
            amount: 29.99,
            currency: 'USD',
            status: 'ACTIVE',
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            lastPaymentDate: new Date().toISOString(),
            nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
        setSubscriptions(mockSubscriptions);
        setTotalPages(Math.ceil(mockSubscriptions.length / limit));
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load subscriptions');
        console.error('Failed to fetch subscriptions:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchSubscriptions();
    }
  }, [userId, page, limit]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-emerald-600 bg-emerald-50';
      case 'INACTIVE':
        return 'text-slate-600 bg-slate-50';
      case 'CANCELLED':
        return 'text-red-600 bg-red-50';
      case 'PENDING':
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-600 mb-4">{error}</div>}

        {loading ? (
          <div className="text-center py-4">Loading subscriptions...</div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-4 text-slate-500">No subscriptions found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Period</TableHead>
                    <TableHead>Next Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-semibold">
                        {subscription.planName}
                      </TableCell>
                      <TableCell>
                        {subscription.currency} {subscription.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-sm font-semibold ${getStatusColor(
                            subscription.status
                          )}`}
                        >
                          {subscription.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{' '}
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {subscription.nextPaymentDate
                          ? new Date(subscription.nextPaymentDate).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit?.(subscription)}
                            title="Edit subscription"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => onCancel?.(subscription.id)}
                            title="Cancel subscription"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Items per page:</span>
                <Select value={limit.toString()} onValueChange={(val) => setLimit(Number(val))}>
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
