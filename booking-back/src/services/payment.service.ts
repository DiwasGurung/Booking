import { prisma } from "../lib/prisma"
import type { Payment, PaymentStatus, Prisma } from "../../prisma/src/generated/prisma/client"
export class PaymentService {
  /**
   * Create a new payment
   */
  async createPayment(data: {
    bookingId: string
    businessId: string
    amount: number
    method?: string
    currency?: string
  }): Promise<Payment> {
    return prisma.payment.create({
      data: {
        ...data,
        currency: data.currency || "USD",
      },
    })
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { id },
      include: { booking: true },
    })
  }

  /**
   * Get payment by booking ID
   */
  async getPaymentByBookingId(bookingId: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { bookingId },
    })
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<Payment> {
    return prisma.payment.update({
      where: { id },
      data: { status },
    })
  }

  /**
   * Update payment
   */
  async updatePayment(id: string, data: Prisma.PaymentUpdateInput): Promise<Payment> {
    return prisma.payment.update({
      where: { id },
      data,
    })
  }

  /**
   * Get all payments for a business
   */
  async getBusinessPayments(
    businessId: string,
    page = 1,
    limit = 10,
    status?: PaymentStatus,
  ): Promise<{ payments: Payment[]; total: number }> {
    const skip = (page - 1) * limit

    const where: Prisma.PaymentWhereInput = { businessId }
    if (status) where.status = status

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: { booking: { include: { service: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.count({ where }),
    ])

    return { payments, total }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(businessId: string) {
    const payments = await prisma.payment.findMany({
      where: {
        businessId,
        status: "COMPLETED",
      },
      select: { amount: true, createdAt: true },
    })

    const totalRevenue = payments.reduce((sum: any, p: any) => sum + p.amount, 0)
    const averageTransaction = payments.length > 0 ? totalRevenue / payments.length : 0

    return {
      totalRevenue,
      totalTransactions: payments.length,
      averageTransaction,
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(id: string): Promise<Payment> {
    return prisma.payment.update({
      where: { id },
      data: { status: "REFUNDED" },
    })
  }
}

export default new PaymentService()
