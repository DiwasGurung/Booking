"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const payment_service_js_1 = __importDefault(require("../services/payment.service.js"));
class PaymentController {
    async getBusinessPayments(req, res) {
        try {
            const { businessId } = req.params;
            const { page = '1', limit = '10', status } = req.query;
            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
            const skip = (pageNum - 1) * limitNum;
            const payments = await payment_service_js_1.default.getBusinessPayments(businessId, {
                skip,
                limit: limitNum,
                status: status
            });
            const total = await payment_service_js_1.default.getBusinessPaymentsCount(businessId);
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
        }
        catch (error) {
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
    async getById(req, res) {
        try {
            const { paymentId } = req.params;
            const { businessId } = req.query;
            if (!businessId) {
                return res.status(400).json({
                    success: false,
                    message: 'Business ID is required'
                });
            }
            const payment = await payment_service_js_1.default.getPaymentById(paymentId, businessId);
            return res.json({
                success: true,
                data: payment
            });
        }
        catch (error) {
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
    async updateStatus(req, res) {
        try {
            const { paymentId } = req.params;
            const { status, businessId } = req.body;
            if (!status || !businessId) {
                return res.status(400).json({
                    success: false,
                    message: 'Status and Business ID are required'
                });
            }
            const updatedPayment = await payment_service_js_1.default.updatePaymentStatus(paymentId, status, businessId);
            return res.json({
                success: true,
                data: updatedPayment,
                message: 'Payment status updated successfully'
            });
        }
        catch (error) {
            console.error('[Payment] Error updating payment status:', error);
            const statusCode = error.message.includes('Unauthorized') ? 403 : 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to update payment status'
            });
        }
    }
}
exports.default = new PaymentController();
