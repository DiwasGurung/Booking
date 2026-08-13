import  prisma  from "../lib/prisma.js"
import type { Payment, PaymentStatus, Prisma } from "@prisma/client"
export class PaymentService {
  

   async getBusinessPayments(
    businessId: string,
    options: {
      skip: number;
      limit: number;
      status?: string;
    } = { skip: 0, limit: 10 }
  ) {
    try {
      const where: any = {
        subscription: {
          businessId
        }
      };

      if (options.status) {
        where.status = options.status;
      }

      const payments = await prisma.payment.findMany({
        where,
        include: {
          subscription: {
            include: { plan: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: options.skip,
        take: options.limit
      });

      return payments;
    } catch (error: any) {
      console.error('[Payment] Error fetching business payments:', error);
      return [];
    }
  }

  /**
   * Get business payments count
   */
  async getBusinessPaymentsCount(businessId: string): Promise<number> {
    try {
      return await prisma.payment.count({
        where: {
          subscription: {
            businessId
          }
        }
      });
    } catch (error: any) {
      console.error('[Payment] Error counting business payments:', error);
      return 0;
    }
  }

  /**
   * Get payment by ID with ownership verification
   */
  async getPaymentById(paymentId: string, businessId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          subscription: {
            include: { plan: true }
          }
        }
      });

      if (!payment) {
        return null;
      }

      // Verify business ownership
      if (payment.subscription?.businessId !== businessId) {
        throw new Error('Unauthorized: This payment does not belong to your business');
      }

      return payment;
    } catch (error: any) {
      console.error('[Payment] Error fetching payment details:', error);
      throw error;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(paymentId: string, status: string, businessId: string) {
    try {
      // Verify ownership first
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { subscription: true }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.subscription?.businessId !== businessId) {
        throw new Error('Unauthorized: This payment does not belong to your business');
      }

      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: { status },
        include: { subscription: true }
      });

      await this.logPaymentAction(paymentId, 'STATUS_UPDATED', status);
      return updatedPayment;
    } catch (error: any) {
      console.error('[Payment] Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Refund payment
   */
  // async refundPayment(paymentId: string, businessId: string, reason?: string) {
  //   try {
  //     // Verify ownership first
  //     const payment = await prisma.payment.findUnique({
  //       where: { id: paymentId },
  //       include: { subscription: true }
  //     });

  //     if (!payment) {
  //       throw new Error('Payment not found');
  //     }

  //     if (payment.subscription?.businessId !== businessId) {
  //       throw new Error('Unauthorized: This payment does not belong to your business');
  //     }

  //     if (payment.status !== 'COMPLETED') {
  //       throw new Error('Only completed payments can be refunded');
  //     }

  //     const refundedPayment = await prisma.payment.update({
  //       where: { id: paymentId },
  //       data: {
  //         status: 'REFUNDED',
  //         refundedAt: new Date(),
  //         refundReason: reason
  //       },
  //       include: { subscription: true }
  //     });

  //     await this.logPaymentAction(paymentId, 'REFUNDED', 'REFUNDED', { reason });

  //     // Deactivate subscription if it was active
  //     if (refundedPayment.subscriptionId) {
  //       await prisma.subscription.update({
  //         where: { id: refundedPayment.subscriptionId },
  //         data: { status: 'CANCELLED' }
  //       });
  //     }

  //     return refundedPayment;
  //   } catch (error: any) {
  //     console.error('[Payment] Error refunding payment:', error);
  //     throw error;
  //   }
  // }


  /**
   * Log payment action
   */
  private async logPaymentAction(
    paymentId: string,
    action: string,
    status: string,
    metadata?: any
  ) {
    try {
      console.log(`[Payment] Action: ${action} | Payment: ${paymentId} | Status: ${status}`, metadata || '');
      // TODO: Implement payment audit logging if needed
    } catch (error: any) {
      console.error('[Payment] Error logging action:', error);
    }
  }

}

export default new PaymentService()
