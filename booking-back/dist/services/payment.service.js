"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const prisma_1 = require("../lib/prisma");
class PaymentService {
    /**
     * Create a new payment
     */
    async createPayment(data) {
        return prisma_1.prisma.payment.create({
            data: {
                ...data,
                currency: data.currency || "USD",
            },
        });
    }
    /**
     * Get payment by ID
     */
    async getPaymentById(id) {
        return prisma_1.prisma.payment.findUnique({
            where: { id },
            include: { booking: true },
        });
    }
    /**
     * Get payment by booking ID
     */
    async getPaymentByBookingId(bookingId) {
        return prisma_1.prisma.payment.findUnique({
            where: { bookingId },
        });
    }
    /**
     * Update payment status
     */
    async updatePaymentStatus(id, status) {
        return prisma_1.prisma.payment.update({
            where: { id },
            data: { status },
        });
    }
    /**
     * Update payment
     */
    async updatePayment(id, data) {
        return prisma_1.prisma.payment.update({
            where: { id },
            data,
        });
    }
    /**
     * Get all payments for a business
     */
    async getBusinessPayments(businessId, page = 1, limit = 10, status) {
        const skip = (page - 1) * limit;
        const where = { businessId };
        if (status)
            where.status = status;
        const [payments, total] = await Promise.all([
            prisma_1.prisma.payment.findMany({
                where,
                skip,
                take: limit,
                include: { booking: { include: { service: true } } },
                orderBy: { createdAt: "desc" },
            }),
            prisma_1.prisma.payment.count({ where }),
        ]);
        return { payments, total };
    }
    /**
     * Get revenue analytics
     */
    async getRevenueAnalytics(businessId) {
        const payments = await prisma_1.prisma.payment.findMany({
            where: {
                businessId,
                status: "COMPLETED",
            },
            select: { amount: true, createdAt: true },
        });
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const averageTransaction = payments.length > 0 ? totalRevenue / payments.length : 0;
        return {
            totalRevenue,
            totalTransactions: payments.length,
            averageTransaction,
        };
    }
    /**
     * Refund payment
     */
    async refundPayment(id) {
        return prisma_1.prisma.payment.update({
            where: { id },
            data: { status: "REFUNDED" },
        });
    }
}
exports.PaymentService = PaymentService;
exports.default = new PaymentService();
