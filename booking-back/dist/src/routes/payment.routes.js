"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = __importDefault(require("../controllers/payment.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const paymentRoutes = (0, express_1.Router)();
paymentRoutes.get('/business/:businessId', auth_middleware_1.auth, (req, res) => {
    payment_controller_1.default.getBusinessPayments(req, res);
});
/**
 * GET /api/payment/:paymentId
 * Get specific payment details (requires businessId query parameter for verification)
 */
paymentRoutes.get('/:paymentId', auth_middleware_1.auth, (req, res) => {
    payment_controller_1.default.getById(req, res);
});
/**
 * PUT /api/payment/:paymentId/status
 * Update payment status (admin only) - requires businessId in request body
 */
paymentRoutes.put('/:paymentId/status', auth_middleware_1.auth, (req, res) => {
    payment_controller_1.default.updateStatus(req, res);
});
/**
 * PUT /api/payment/:paymentId/refund
 * Refund a completed payment - requires businessId in request body
 */
// paymentRoutes.put('/:paymentId/refund', auth, (req: Request, res: Response) => {
//   PaymentController.refund(req, res);
// });
exports.default = paymentRoutes;
