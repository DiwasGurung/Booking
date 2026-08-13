import { Request, Response } from "express"
import PaymentService from "../services/payment.service.js"
import { PaymentStatus } from "@prisma/client"

class PaymentController {
  

   async getBusinessPayments(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { page = '1', limit = '10', status } = req.query;

      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
      const skip = (pageNum - 1) * limitNum;

      const payments = await PaymentService.getBusinessPayments(businessId as string, {
        skip,
        limit: limitNum,
        status: status as string
      });

      const total = await PaymentService.getBusinessPaymentsCount(businessId as string);

      return res.json({
        success: true,
        data: payments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error: any) {
      console.error('[Payment] Error fetching business payments:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch payments'
      });
    }
  }

  /**
   * GET /api/payment/:paymentId
   * Get payment details by ID with business verification
   */
  async getById(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      const { businessId } = req.query;

      if (!businessId) {
        return res.status(400).json({
          success: false,
          message: 'Business ID is required'
        });
      }

      const payment = await PaymentService.getPaymentById(paymentId as string, businessId as string);

      return res.json({
        success: true,
        data: payment
      });
    } catch (error: any) {
      console.error('[Payment] Error fetching payment details:', error);
      const statusCode = error.message.includes('Unauthorized') ? 403 : error.message.includes('not found') ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch payment'
      });
    }
  }

  /**
   * PUT /api/payment/:paymentId/status
   * Update payment status (admin only)
   */
 async updateStatus(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      const { status, businessId } = req.body;

      if (!status || !businessId) {
        return res.status(400).json({
          success: false,
          message: 'Status and Business ID are required'
        });
      }

      const updatedPayment = await PaymentService.updatePaymentStatus(paymentId as string, status, businessId);

      return res.json({
        success: true,
        data: updatedPayment,
        message: 'Payment status updated successfully'
      });
    } catch (error: any) {
      console.error('[Payment] Error updating payment status:', error);
      const statusCode = error.message.includes('Unauthorized') ? 403 : 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update payment status'
      });
    }
  }

  /**
   * PUT /api/payment/:paymentId/refund
   * Refund payment
   */
  //  async refund(req: Request, res: Response) {
  //   try {
  //     const { paymentId } = req.params;
  //     const { businessId, reason } = req.body;

  //     if (!businessId) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'Business ID is required'
  //       });
  //     }

  //     const refundedPayment = await PaymentService.refundPayment(paymentId as string, businessId as string, reason);

  //     return res.json({
  //       success: true,
  //       data: refundedPayment,
  //       message: 'Payment refunded successfully'
  //     });
  //   } catch (error: any) {
  //     console.error('[Payment] Error refunding payment:', error);
  //     const statusCode = error.message.includes('Unauthorized') ? 403 : error.message.includes('not found') ? 404 : 500;
  //     return res.status(statusCode).json({
  //       success: false,
  //       message: error.message || 'Failed to refund payment'
  //     });
  //   }
  // }

  

}

export default new PaymentController()
