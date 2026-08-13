"use strict";
// src/controllers/subscription-payment.controller.ts
// Controller for handling subscription payments with eSewa
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionPlans = exports.checkSubscriptionLimit = exports.getSubscriptionUsage = exports.handleEsewaFailure = exports.handleEsewaSuccess = exports.initiateEsewaPayment = void 0;
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const esewa_service_js_1 = __importDefault(require("../services/esewa.service.js"));
const subscription_service_js_1 = __importDefault(require("../services/subscription.service.js"));
const billing_js_1 = require("../utils/billing.js");
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';
function getExpectedSubscriptionAmount(subscription, plan) {
    return (0, billing_js_1.getPriceForPeriod)(plan.priceMonthlyNPR ?? 0, subscription.billingPeriod, {
        monthly: plan.priceMonthlyNPR ?? undefined,
        quarterly: plan.priceQuarterlyNPR ?? undefined,
        semiAnnual: plan.priceSemiAnnualNPR ?? undefined,
        annual: plan.priceAnnualNPR ?? undefined,
    });
}
/**
 * Initiate subscription payment with eSewa
 */
const initiateEsewaPayment = async (req, res) => {
    try {
        const { businessId, planId, billingPeriod = billing_js_1.BillingPeriod.MONTHLY } = req.body;
        if (!businessId || !planId) {
            return res.status(400).json({ error: 'Business ID and Plan ID are required' });
        }
        // Get the subscription plan
        const plan = await prisma_js_1.default.subscriptionPlan.findUnique({
            where: { id: planId },
        });
        if (!plan) {
            return res.status(404).json({ error: 'Subscription plan not found' });
        }
        const { getDurationDays } = require('../utils/billing');
        const priceNPR = (0, billing_js_1.getPriceForPeriod)(plan.priceMonthlyNPR ?? 0, billingPeriod, {
            monthly: plan.priceMonthlyNPR ?? undefined,
            quarterly: plan.priceQuarterlyNPR ?? undefined,
            semiAnnual: plan.priceSemiAnnualNPR ?? undefined,
            annual: plan.priceAnnualNPR ?? undefined,
        });
        // Get or create subscription
        let subscription = await prisma_js_1.default.subscription.findUnique({
            where: { businessId },
        });
        if (!subscription) {
            subscription = await prisma_js_1.default.subscription.create({
                data: {
                    businessId,
                    planId,
                    status: 'TRIAL',
                    billingPeriod,
                },
            });
        }
        else {
            // Update billing period if changing plans
            await prisma_js_1.default.subscription.update({
                where: { id: subscription.id },
                data: { billingPeriod, planId },
            });
        }
        // Generate unique transaction ID
        const transactionUuid = `SUB-${subscription.id}-${Date.now()}`;
        // Generate eSewa payment form data
        const esewaResponse = await esewa_service_js_1.default.initiatePayment({
            amount: priceNPR,
            transactionUuid: transactionUuid,
            successUrl: `${BACKEND_URL}/api/subscription-payment/esewa/success`,
            failureUrl: `${BACKEND_URL}/api/subscription-payment/esewa/failure`,
        });
        if (!esewaResponse.success) {
            return res.status(500).json({ error: esewaResponse.message });
        }
        return res.json({
            success: true,
            formData: esewaResponse.formData,
            paymentUrl: esewaResponse.paymentUrl,
            billingPeriod,
            durationDays: getDurationDays(billingPeriod),
        });
    }
    catch (error) {
        console.error('[SubscriptionPayment] Initiation error:', error);
        return res.status(500).json({ error: error.message || 'Failed to initiate payment' });
    }
};
exports.initiateEsewaPayment = initiateEsewaPayment;
/**
 * Handle eSewa payment success callback
 */
const handleEsewaSuccess = async (req, res) => {
    try {
        const { data } = req.query;
        if (!data || typeof data !== 'string') {
            console.error('[SubscriptionPayment] No data in eSewa callback');
            return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Invalid callback data`);
        }
        // Decode and verify the response
        const decoded = esewa_service_js_1.default.decodeEsewaResponse(data);
        if (!decoded.success || !decoded.data) {
            console.error('[SubscriptionPayment] Failed to decode eSewa response');
            return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Invalid response signature`);
        }
        const { transaction_uuid, status, total_amount, transaction_code, product_code } = decoded.data;
        const parsedTotalAmount = Number.parseFloat(total_amount);
        if (status !== 'COMPLETE' || !Number.isFinite(parsedTotalAmount) || parsedTotalAmount <= 0) {
            return res.redirect(`${FRONTEND_URL}/subscription?status=failed&message=Payment was not completed`);
        }
        if (product_code !== esewa_service_js_1.default.getProductCode()) {
            return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Invalid product code`);
        }
        console.log('[SubscriptionPayment] eSewa success callback:', {
            transactionUuid: transaction_uuid,
            status,
            totalAmount: parsedTotalAmount,
            transactionCode: transaction_code,
        });
        // Find the subscription using the transaction UUID format SUB-{subscriptionId}-{timestamp}
        const transactionPrefix = 'SUB-';
        if (!transaction_uuid.startsWith(transactionPrefix)) {
            return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Invalid transaction reference`);
        }
        const subscriptionId = transaction_uuid.slice(transactionPrefix.length).replace(/-\d+$/, '');
        const subscription = await prisma_js_1.default.subscription.findUnique({
            where: { id: subscriptionId },
            include: { plan: true },
        });
        if (!subscription) {
            console.error('[SubscriptionPayment] Subscription not found for transaction:', transaction_uuid);
            return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Subscription not found`);
        }
        // Verify with eSewa server (server-to-server verification)
        const verification = await esewa_service_js_1.default.verifyPayment(transaction_uuid, parsedTotalAmount);
        if (!verification.success) {
            console.error('[SubscriptionPayment] eSewa verification failed:', verification.message);
            return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Payment verification failed`);
        }
        if (verification.productCode !== product_code || verification.totalAmount !== parsedTotalAmount) {
            return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Payment amount verification failed`);
        }
        const expectedAmount = getExpectedSubscriptionAmount(subscription, subscription.plan);
        if (expectedAmount !== parsedTotalAmount) {
            console.error('[SubscriptionPayment] Amount mismatch:', { expectedAmount, parsedTotalAmount });
            return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Payment amount does not match the selected plan`);
        }
        // Create payment record AFTER successful verification; transactionId is unique.
        const existingPayment = await prisma_js_1.default.payment.findUnique({ where: { transactionId: transaction_uuid } });
        if (existingPayment) {
            return res.redirect(`${FRONTEND_URL}/subscription?status=success&message=Payment already processed`);
        }
        const payment = await prisma_js_1.default.payment.create({
            data: {
                businessId: subscription.businessId,
                subscriptionId: subscription.id,
                gateway: 'ESEWA',
                transactionId: transaction_uuid,
                amount: Math.round(parseFloat(total_amount) * 100),
                status: 'completed',
                esewaRefId: transaction_code,
                esewaProductCode: esewa_service_js_1.default.getProductCode(),
            },
        });
        console.log('[SubscriptionPayment] Payment created after verification:', payment.id);
        // Activate subscription
        if (payment.subscriptionId) {
            const plan = await prisma_js_1.default.subscriptionPlan.findFirst({
                where: {
                    subscriptions: {
                        some: { id: payment.subscriptionId },
                    },
                },
            });
            const durationDays = plan?.durationDays || 30;
            await subscription_service_js_1.default.activateSubscription(payment.subscriptionId, {
                paymentId: payment.id,
                durationDays,
            });
            console.log('[SubscriptionPayment] Subscription activated:', payment.subscriptionId);
        }
        return res.redirect(`${FRONTEND_URL}/subscription?status=success&message=Payment successful`);
    }
    catch (error) {
        console.error('[SubscriptionPayment] Success callback error:', error);
        return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=An error occurred`);
    }
};
exports.handleEsewaSuccess = handleEsewaSuccess;
/**
 * Handle eSewa payment failure callback
 */
const handleEsewaFailure = async (req, res) => {
    try {
        const { data } = req.query;
        console.log('Full failure callback:', req.query);
        console.log('[SubscriptionPayment] eSewa failure callback:', { data });
        // No need to update payment records since payments are only created after successful verification
        // Failed transactions don't have payment records
        return res.redirect(`${FRONTEND_URL}/subscription?status=failed&message=Payment was cancelled or failed`);
    }
    catch (error) {
        console.error('[SubscriptionPayment] Failure callback error:', error);
        return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=An error occurred`);
    }
};
exports.handleEsewaFailure = handleEsewaFailure;
/**
 * Get subscription usage and limits
 */
const getSubscriptionUsage = async (req, res) => {
    try {
        const { businessId } = req.params;
        // Ensure businessId is a string
        const id = typeof businessId === 'string' ? businessId : Array.isArray(businessId) ? businessId[0] : businessId;
        const subscription = await prisma_js_1.default.subscription.findUnique({
            where: { businessId: id },
            include: { plan: true },
        });
        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }
        // Get current usage counts
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const [appointmentsCount, staffCount, servicesCount, customersCount] = await Promise.all([
            prisma_js_1.default.booking.count({
                where: {
                    businessId,
                    createdAt: { gte: startOfMonth },
                },
            }),
            prisma_js_1.default.staff.count({
                where: { businessId, isActive: true },
            }),
            prisma_js_1.default.service.count({
                where: { businessId, isActive: true },
            }),
            prisma_js_1.default.customer.count({
                where: { businessId },
            }),
        ]);
        const plan = subscription.plan;
        return res.json({
            subscription: {
                id: subscription.id,
                status: subscription.status,
                planName: plan.displayName,
                expiresAt: subscription.endDate || subscription.trialEndsAt,
                daysRemaining: subscription.endDate
                    ? Math.max(0, Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                    : subscription.trialEndsAt
                        ? Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                        : 0,
            },
            limits: {
                maxAppointmentsPerMonth: plan.maxAppointmentsPerMonth,
                maxStaff: plan.maxStaff,
                maxServices: plan.maxServices,
                maxCustomers: plan.maxCustomers,
            },
            usage: {
                appointmentsThisMonth: appointmentsCount,
                staff: staffCount,
                services: servicesCount,
                customers: customersCount,
            },
            features: {
                allowEmailNotifications: plan.allowEmailNotifications,
                allowOnlineBooking: plan.allowOnlineBooking,
                allowReports: plan.allowReports,
                allowCustomBranding: plan.allowCustomBranding,
                prioritySupport: plan.prioritySupport,
            },
        });
    }
    catch (error) {
        console.error('[SubscriptionPayment] Get usage error:', error);
        return res.status(500).json({ error: error.message || 'Failed to get subscription usage' });
    }
};
exports.getSubscriptionUsage = getSubscriptionUsage;
/**
 * Check if action is allowed based on subscription limits
 */
const checkSubscriptionLimit = async (req, res) => {
    try {
        const { businessId, action } = req.params;
        // Ensure businessId is a string
        const id = typeof businessId === 'string' ? businessId : Array.isArray(businessId) ? businessId[0] : businessId;
        const subscription = await prisma_js_1.default.subscription.findUnique({
            where: { businessId: id },
            include: { plan: true },
        });
        if (!subscription) {
            return res.json({ allowed: false, reason: 'No subscription found' });
        }
        // Check if subscription is valid
        const now = new Date();
        const isValid = (subscription.status === 'TRIAL' && subscription.trialEndsAt && subscription.trialEndsAt > now) ||
            (subscription.status === 'ACTIVE' && subscription.endDate && subscription.endDate > now);
        if (!isValid) {
            return res.json({ allowed: false, reason: 'Subscription expired' });
        }
        const plan = subscription.plan;
        let allowed = true;
        let reason = '';
        let currentUsage = 0;
        let limit = -1;
        switch (action) {
            case 'create-appointment':
                if (plan.maxAppointmentsPerMonth !== -1) {
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    currentUsage = await prisma_js_1.default.booking.count({
                        where: {
                            businessId,
                            createdAt: { gte: startOfMonth },
                        },
                    });
                    limit = plan.maxAppointmentsPerMonth;
                    allowed = currentUsage < limit;
                    reason = allowed ? '' : `Monthly appointment limit reached (${limit})`;
                }
                break;
            case 'add-staff':
                if (plan.maxStaff !== -1) {
                    currentUsage = await prisma_js_1.default.staff.count({
                        where: { businessId, isActive: true },
                    });
                    limit = plan.maxStaff;
                    allowed = currentUsage < limit;
                    reason = allowed ? '' : `Staff limit reached (${limit})`;
                }
                break;
            case 'add-service':
                if (plan.maxServices !== -1) {
                    currentUsage = await prisma_js_1.default.service.count({
                        where: { businessId, isActive: true },
                    });
                    limit = plan.maxServices;
                    allowed = currentUsage < limit;
                    reason = allowed ? '' : `Service limit reached (${limit})`;
                }
                break;
            case 'add-customer':
                if (plan.maxCustomers !== -1) {
                    currentUsage = await prisma_js_1.default.customer.count({
                        where: { businessId },
                    });
                    limit = plan.maxCustomers;
                    allowed = currentUsage < limit;
                    reason = allowed ? '' : `Customer limit reached (${limit})`;
                }
                break;
            case 'view-reports':
                allowed = plan.allowReports;
                reason = allowed ? '' : 'Reports not available in your plan';
                break;
            default:
                break;
        }
        return res.json({
            allowed,
            reason,
            currentUsage,
            limit,
        });
    }
    catch (error) {
        console.error('[SubscriptionPayment] Check limit error:', error);
        return res.status(500).json({ error: error.message || 'Failed to check subscription limit' });
    }
};
exports.checkSubscriptionLimit = checkSubscriptionLimit;
/**
 * Get all subscription plans with limits
 */
const getSubscriptionPlans = async (req, res) => {
    try {
        const plans = await prisma_js_1.default.subscriptionPlan.findMany({
            where: { active: true },
            orderBy: { priceNPR: 'asc' },
        });
        return res.json({ plans });
    }
    catch (error) {
        console.error('[SubscriptionPayment] Get plans error:', error);
        return res.status(500).json({ error: error.message || 'Failed to get plans' });
    }
};
exports.getSubscriptionPlans = getSubscriptionPlans;
