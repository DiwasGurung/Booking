import { Request, Response } from "express"
import PaymentService from "../services/payment.service"
import { PaymentStatus } from "../generated/prisma/client"

class PaymentController {
  /**
   * Create payment
   */
  async create(req: Request, res: Response) {
    try {
      const payment = await PaymentService.createPayment(req.body)
      res.status(201).json(payment)
    } catch (error) {
      res.status(500).json({ message: "Failed to create payment", error })
    }
  }

  /**
   * Get payment by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const payment = await PaymentService.getPaymentById(id as string)

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" })
      }

      res.json(payment)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment", error })
    }
  }

  /**
   * Get payment by booking ID
   */
  async getByBookingId(req: Request, res: Response) {
    try {
      const { bookingId } = req.params
      const payment = await PaymentService.getPaymentByBookingId(bookingId as string)

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" })
      }

      res.json(payment)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment", error })
    }
  }

  /**
   * Update payment status
   */
  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { status } = req.body as { status: PaymentStatus }

      const payment = await PaymentService.updatePaymentStatus(id as string, status)
      res.json(payment)
    } catch (error) {
      res.status(500).json({ message: "Failed to update payment status", error })
    }
  }

  /**
   * Update payment
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      const payment = await PaymentService.updatePayment(id as string, req.body)
      res.json(payment)
    } catch (error) {
      res.status(500).json({ message: "Failed to update payment", error })
    }
  }

  /**
   * Get business payments
   */
  async getBusinessPayments(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 10
      const status = req.query.status as PaymentStatus | undefined

      const result = await PaymentService.getBusinessPayments(
        businessId as string,
        page,
        limit,
        status,
      )

      res.json(result)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments", error })
    }
  }

  /**
   * Revenue analytics
   */
  async revenueAnalytics(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      const analytics = await PaymentService.getRevenueAnalytics(businessId as string)
      res.json(analytics)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch revenue analytics", error })
    }
  }

  /**
   * Refund payment
   */
  async refund(req: Request, res: Response) {
    try {
      const { id } = req.params
      const payment = await PaymentService.refundPayment(id as string)
      res.json(payment)
    } catch (error) {
      res.status(500).json({ message: "Failed to refund payment", error })
    }
  }
}

export default new PaymentController()
