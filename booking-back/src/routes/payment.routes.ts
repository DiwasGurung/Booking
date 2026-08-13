import { Router, Request, Response } from "express"
import PaymentController from "../controllers/payment.controller.js"
import { auth } from "../middleware/auth.middleware.js"

const paymentRoutes = Router()




paymentRoutes.get('/business/:businessId', auth, (req: Request, res: Response) => {
  PaymentController.getBusinessPayments(req, res);
});

/**
 * GET /api/payment/:paymentId
 * Get specific payment details (requires businessId query parameter for verification)
 */
paymentRoutes.get('/:paymentId', auth, (req: Request, res: Response) => {
  PaymentController.getById(req, res);
});

/**
 * PUT /api/payment/:paymentId/status
 * Update payment status (admin only) - requires businessId in request body
 */
paymentRoutes.put('/:paymentId/status', auth, (req: Request, res: Response) => {
  PaymentController.updateStatus(req, res);
});

/**
 * PUT /api/payment/:paymentId/refund
 * Refund a completed payment - requires businessId in request body
 */
// paymentRoutes.put('/:paymentId/refund', auth, (req: Request, res: Response) => {
//   PaymentController.refund(req, res);
// });

export default paymentRoutes