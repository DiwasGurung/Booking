import { Router } from "express"
import PaymentController from "../controllers/payment.controller"

const paymentRoutes = Router()

// Create payment
paymentRoutes.post("/", PaymentController.create)

// Get business payments
paymentRoutes.get("/business/:businessId", PaymentController.getBusinessPayments)

// Revenue analytics
paymentRoutes.get("/business/:businessId/analytics", PaymentController.revenueAnalytics)

// Get payment by booking ID
paymentRoutes.get("/booking/:bookingId", PaymentController.getByBookingId)

// Get payment by ID
paymentRoutes.get("/:id", PaymentController.getById)
// Update payment
paymentRoutes.put("/:id", PaymentController.update)

// Update payment status
paymentRoutes.put("/:id/status", PaymentController.updateStatus)

// Refund payment
paymentRoutes.put("/:id/refund", PaymentController.refund)

export default paymentRoutes