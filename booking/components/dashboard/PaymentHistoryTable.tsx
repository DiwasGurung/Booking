'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { paymentApi, Payment } from '@/lib/api';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaymentHistoryTableProps {
  userId?: string;
  subscriptionId?: string;
}

export const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({
  userId,
  subscriptionId,
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        let result;

        if (subscriptionId) {
          result = await paymentApi.getPaymentHistory(subscriptionId, page, limit);
        } else if (userId) {
          result = await paymentApi.getUserPayments(userId, page, limit);
        }

        if (result) {
          const paymentList = Array.isArray(result) ? result : result.paymentId || [];
          setPayments(paymentList);
          setTotalPages(Math.ceil(paymentList.length / limit));
        }
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load payments');
        console.error('Failed to fetch payments:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId || subscriptionId) {
      fetchPayments();
    }
  }, [userId, subscriptionId, page, limit]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-emerald-600 bg-emerald-50';
      case 'FAILED':
        return 'text-red-600 bg-red-50';
      case 'PENDING':
        return 'text-amber-600 bg-amber-50';
      case 'CANCELLED':
        return 'text-slate-600 bg-slate-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const getGatewayDisplay = (gateway: string) => {
    switch (gateway) {
      case 'ESEWA':
        return 'eSewa';
      case 'KHALTI':
        return 'Khalti';
      case 'STRIPE':
        return 'Stripe';
      default:
        return gateway;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-600 mb-4">{error}</div>}

        {loading ? (
          <div className="text-center py-4">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-4 text-slate-500">No payments found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>${payment.amount.toFixed(2)}</TableCell>
                      <TableCell>{payment.currency}</TableCell>
                      <TableCell>{getGatewayDisplay(payment.gateway)}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-sm font-semibold ${getStatusColor(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {payment.transactionId || payment.id}
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
                    <SelectItem value="50">50</SelectItem>
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
