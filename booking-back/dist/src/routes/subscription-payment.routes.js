"use strict";
// src/routes/subscription-payment.routes.ts
// Routes for subscription payments with eSewa and Khalti
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const subscription_payment_controller_1 = require("../controllers/subscription-payment.controller");
const router = (0, express_1.Router)();
/**
 * @route POST /api/subscription-payment/esewa/initiate
 * @desc Initiate eSewa payment for subscription
 * @access Private
 */
router.post('/esewa/initiate', auth_middleware_1.auth, subscription_payment_controller_1.initiateEsewaPayment);
/**
 * @route GET /api/subscription-payment/esewa/success
 * @desc Handle eSewa payment success callback
 * @access Public (eSewa redirects here)
 */
router.get('/esewa/success', auth_middleware_1.auth, subscription_payment_controller_1.handleEsewaSuccess);
/**
 * @route GET /api/subscription-payment/esewa/failure
 * @desc Handle eSewa payment failure callback
 * @access Public (eSewa redirects here)
 */
router.get('/esewa/failure', auth_middleware_1.auth, subscription_payment_controller_1.handleEsewaFailure);
/**
 * @route GET /api/subscription-payment/usage/:businessId
 * @desc Get subscription usage and limits
 * @access Private
 */
router.get('/usage/:businessId', auth_middleware_1.auth, subscription_payment_controller_1.getSubscriptionUsage);
/**
 * @route GET /api/subscription-payment/check-limit/:businessId/:action
 * @desc Check if action is allowed based on subscription limits
 * @access Private
 */
router.get('/check-limit/:businessId/:action', auth_middleware_1.auth, subscription_payment_controller_1.checkSubscriptionLimit);
/**
 * @route GET /api/subscription-payment/plans
 * @desc Get all active subscription plans
 * @access Public
 */
router.get('/plans', subscription_payment_controller_1.getSubscriptionPlans);
exports.default = router;
