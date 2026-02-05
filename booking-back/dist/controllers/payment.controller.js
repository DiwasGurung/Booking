"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const payment_service_1 = __importDefault(require("../services/payment.service"));
class PaymentController {
    /**
     * Create payment
     */
    async create(req, res) {
        try {
            const payment = await payment_service_1.default.createPayment(req.body);
            res.status(201).json(payment);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to create payment", error });
        }
    }
    /**
     * Get payment by ID
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const payment = await payment_service_1.default.getPaymentById(id);
            if (!payment) {
                return res.status(404).json({ message: "Payment not found" });
            }
            res.json(payment);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch payment", error });
        }
    }
    /**
     * Get payment by booking ID
     */
    async getByBookingId(req, res) {
        try {
            const { bookingId } = req.params;
            const payment = await payment_service_1.default.getPaymentByBookingId(bookingId);
            if (!payment) {
                return res.status(404).json({ message: "Payment not found" });
            }
            res.json(payment);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch payment", error });
        }
    }
    /**
     * Update payment status
     */
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const payment = await payment_service_1.default.updatePaymentStatus(id, status);
            res.json(payment);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to update payment status", error });
        }
    }
    /**
     * Update payment
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const payment = await payment_service_1.default.updatePayment(id, req.body);
            res.json(payment);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to update payment", error });
        }
    }
    /**
     * Get business payments
     */
    async getBusinessPayments(req, res) {
        try {
            const { businessId } = req.params;
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const status = req.query.status;
            const result = await payment_service_1.default.getBusinessPayments(businessId, page, limit, status);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch payments", error });
        }
    }
    /**
     * Revenue analytics
     */
    async revenueAnalytics(req, res) {
        try {
            const { businessId } = req.params;
            const analytics = await payment_service_1.default.getRevenueAnalytics(businessId);
            res.json(analytics);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch revenue analytics", error });
        }
    }
    /**
     * Refund payment
     */
    async refund(req, res) {
        try {
            const { id } = req.params;
            const payment = await payment_service_1.default.refundPayment(id);
            res.json(payment);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to refund payment", error });
        }
    }
}
exports.default = new PaymentController();
