"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = __importDefault(require("../controllers/payment.controller"));
const paymentRoutes = (0, express_1.Router)();
// Create payment
paymentRoutes.post("/", payment_controller_1.default.create);
// Get business payments
paymentRoutes.get("/business/:businessId", payment_controller_1.default.getBusinessPayments);
// Revenue analytics
paymentRoutes.get("/business/:businessId/analytics", payment_controller_1.default.revenueAnalytics);
// Get payment by booking ID
paymentRoutes.get("/booking/:bookingId", payment_controller_1.default.getByBookingId);
// Get payment by ID
paymentRoutes.get("/:id", payment_controller_1.default.getById);
// Update payment
paymentRoutes.put("/:id", payment_controller_1.default.update);
// Update payment status
paymentRoutes.put("/:id/status", payment_controller_1.default.updateStatus);
// Refund payment
paymentRoutes.put("/:id/refund", payment_controller_1.default.refund);
exports.default = paymentRoutes;
