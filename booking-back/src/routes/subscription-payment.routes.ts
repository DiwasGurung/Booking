// src/routes/subscription-payment.routes.ts
// Routes for subscription payments with eSewa and Khalti

import { Router } from 'express';
import { auth } from '../middleware/auth.middleware';
import {
  initiateEsewaPayment,
  handleEsewaSuccess,
  handleEsewaFailure,
  getSubscriptionUsage,
  checkSubscriptionLimit,
  getSubscriptionPlans,
} from '../controllers/subscription-payment.controller';

const router = Router();

/**
 * @route POST /api/subscription-payment/esewa/initiate
 * @desc Initiate eSewa payment for subscription
 * @access Private
 */
router.post('/esewa/initiate', auth, initiateEsewaPayment);

/**
 * @route GET /api/subscription-payment/esewa/success
 * @desc Handle eSewa payment success callback
 * @access Public (eSewa redirects here)
 */
router.get('/esewa/success', handleEsewaSuccess);

/**
 * @route GET /api/subscription-payment/esewa/failure
 * @desc Handle eSewa payment failure callback
 * @access Public (eSewa redirects here)
 */
router.get('/esewa/failure', handleEsewaFailure);

/**
 * @route GET /api/subscription-payment/usage/:businessId
 * @desc Get subscription usage and limits
 * @access Private
 */
router.get('/usage/:businessId', auth, getSubscriptionUsage);

/**
 * @route GET /api/subscription-payment/check-limit/:businessId/:action
 * @desc Check if action is allowed based on subscription limits
 * @access Private
 */
router.get('/check-limit/:businessId/:action', auth, checkSubscriptionLimit);

/**
 * @route GET /api/subscription-payment/plans
 * @desc Get all active subscription plans
 * @access Public
 */
router.get('/plans', getSubscriptionPlans);

export default router;
