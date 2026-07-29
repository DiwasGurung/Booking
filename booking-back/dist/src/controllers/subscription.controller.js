"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const subscription_service_1 = __importDefault(require("../services/subscription.service"));
const validators_1 = require("../validators");
const prisma_1 = __importDefault(require("../lib/prisma"));
class SubscriptionController {
    /**
     * Create subscription with free trial
     */
    createWithTrial(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = (0, validators_1.parseAndValidate)(validators_1.CreateSubscriptionTrialSchema, req.body);
                if ((0, validators_1.isValidationError)(validation)) {
                    return res.status(400).json({ message: validation.error });
                }
                const { businessId, planId } = validation.data;
                console.log(`[v0] Creating free trial subscription for business: ${businessId}`);
                const subscription = yield subscription_service_1.default.createSubscriptionWithTrial({
                    businessId,
                    planId,
                });
                res.json({
                    message: 'Free trial subscription created successfully',
                    subscription,
                });
            }
            catch (error) {
                console.error('[v0] Error creating subscription with trial:', error);
                res.status(500).json({ message: 'Failed to create subscription', error: error.message });
            }
        });
    }
    /**
     * Get subscription status for a business
     */
    getStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = (0, validators_1.parseAndValidate)(validators_1.SubscriptionBusinessParamsSchema, req.params);
                if ((0, validators_1.isValidationError)(validation)) {
                    console.error('[v0] Validation error for getStatus:', validation.error);
                    return res.status(400).json({ message: validation.error });
                }
                const { businessId } = validation.data;
                console.log(`[v0] Fetching subscription status for business: ${businessId}`);
                const status = yield subscription_service_1.default.getSubscriptionStatus(businessId);
                console.log(`[v0] Subscription status fetched:`, { businessId, hasSubscription: status.hasSubscription, status: status.status });
                // Return default subscription status if none exists (first-time user)
                if (!status.hasSubscription) {
                    return res.json({
                        hasSubscription: false,
                        status: null,
                        daysRemaining: null,
                        expiresAt: null,
                        planName: 'No subscription',
                        message: 'User can create a free trial subscription',
                    });
                }
                res.json(status);
            }
            catch (error) {
                console.error('[v0] Error fetching subscription status:', error);
                res.status(500).json({ message: 'Failed to get subscription status', error: error.message });
            }
        });
    }
    /**
     * Check if subscription is valid
     */
    checkValidity(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = (0, validators_1.parseAndValidate)(validators_1.SubscriptionBusinessParamsSchema, req.params);
                if ((0, validators_1.isValidationError)(validation)) {
                    return res.status(400).json({ message: validation.error });
                }
                const { businessId } = validation.data;
                console.log(`[v0] Checking subscription validity for business: ${businessId}`);
                const isValid = yield subscription_service_1.default.isSubscriptionValid(businessId);
                res.json({
                    businessId,
                    isValid,
                });
            }
            catch (error) {
                console.error('[v0] Error checking subscription validity:', error);
                res.status(500).json({ message: 'Failed to check subscription validity', error: error.message });
            }
        });
    }
    /**
     * Activate subscription after payment
     */
    activate(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const paramsValidation = (0, validators_1.parseAndValidate)(validators_1.SubscriptionParamsSchema, req.params);
                if ((0, validators_1.isValidationError)(paramsValidation)) {
                    return res.status(400).json({ message: paramsValidation.error });
                }
                const bodyValidation = (0, validators_1.parseAndValidate)(validators_1.ActivateSubscriptionSchema, req.body);
                if ((0, validators_1.isValidationError)(bodyValidation)) {
                    return res.status(400).json({ message: bodyValidation.error });
                }
                const { subscriptionId } = paramsValidation.data;
                const { paymentId, durationDays } = bodyValidation.data;
                console.log(`[v0] Activating subscription: ${subscriptionId}`);
                const subscription = yield subscription_service_1.default.activateSubscription(subscriptionId, {
                    paymentId,
                    durationDays,
                });
                res.json({
                    message: 'Subscription activated successfully',
                    subscription,
                });
            }
            catch (error) {
                console.error('[v0] Error activating subscription:', error);
                res.status(500).json({ message: 'Failed to activate subscription', error: error.message });
            }
        });
    }
    /**
     * Check if trial has expired
     */
    checkTrialExpiration(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = (0, validators_1.parseAndValidate)(validators_1.SubscriptionBusinessParamsSchema, req.params);
                if ((0, validators_1.isValidationError)(validation)) {
                    return res.status(400).json({ message: validation.error });
                }
                const { businessId } = validation.data;
                console.log(`[v0] Checking trial expiration for business: ${businessId}`);
                const expired = yield subscription_service_1.default.hasTrialExpired(businessId);
                res.json({
                    businessId,
                    trialExpired: expired,
                });
            }
            catch (error) {
                console.error('[v0] Error checking trial expiration:', error);
                res.status(500).json({ message: 'Failed to check trial expiration', error: error.message });
            }
        });
    }
    /**
     * Cancel a subscription
     */
    cancelSubscription(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = (0, validators_1.parseAndValidate)(validators_1.SubscriptionParamsSchema, req.params);
                if ((0, validators_1.isValidationError)(validation)) {
                    return res.status(400).json({ message: validation.error });
                }
                const { subscriptionId } = validation.data;
                const userId = req.userId;
                if (!userId) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }
                console.log(`[v0] Cancelling subscription: ${subscriptionId}`);
                const result = yield subscription_service_1.default.cancelSubscription({
                    subscriptionId,
                    userId,
                });
                res.json({
                    message: 'Subscription cancelled successfully',
                    subscription: result,
                });
            }
            catch (error) {
                console.error('[v0] Error cancelling subscription:', error);
                res.status(500).json({ message: 'Failed to cancel subscription', error: error.message });
            }
        });
    }
    /**
     * Get all expired subscriptions (for admin)
     */
    getExpired(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('[v0] Fetching expired subscriptions');
                const subscriptions = yield subscription_service_1.default.getExpiredSubscriptions();
                res.json({
                    count: subscriptions.length,
                    subscriptions,
                });
            }
            catch (error) {
                console.error('[v0] Error fetching expired subscriptions:', error);
                res.status(500).json({ message: 'Failed to fetch expired subscriptions', error: error.message });
            }
        });
    }
    /**
     * Get subscriptions expiring soon (for admin)
     */
    getExpiringSoon(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('[v0] Fetching subscriptions expiring soon');
                const subscriptions = yield subscription_service_1.default.getExpiringSoonSubscriptions();
                res.json({
                    count: subscriptions.length,
                    subscriptions,
                });
            }
            catch (error) {
                console.error('[v0] Error fetching expiring soon subscriptions:', error);
                res
                    .status(500)
                    .json({ message: 'Failed to fetch expiring soon subscriptions', error: error.message });
            }
        });
    }
    /**
     * Check if business can add appointment
     */
    checkAppointmentLimit(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = (0, validators_1.parseAndValidate)(validators_1.SubscriptionBusinessParamsSchema, req.params);
                if ((0, validators_1.isValidationError)(validation)) {
                    return res.status(400).json({ message: validation.error });
                }
                const { businessId } = validation.data;
                const result = yield subscription_service_1.default.canAddAppointment(businessId);
                res.json(result);
            }
            catch (error) {
                console.error('[v0] Error checking appointment limit:', error);
                res.status(500).json({ message: 'Failed to check appointment limit', error: error.message });
            }
        });
    }
    /**
     * Check if business can add staff
     */
    checkStaffLimit(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = (0, validators_1.parseAndValidate)(validators_1.SubscriptionBusinessParamsSchema, req.params);
                if ((0, validators_1.isValidationError)(validation)) {
                    return res.status(400).json({ message: validation.error });
                }
                const { businessId } = validation.data;
                const result = yield subscription_service_1.default.canAddStaff(businessId);
                res.json(result);
            }
            catch (error) {
                console.error('[v0] Error checking staff limit:', error);
                res.status(500).json({ message: 'Failed to check staff limit', error: error.message });
            }
        });
    }
    /**
     * Check if business can add service
     */
    checkServiceLimit(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = (0, validators_1.parseAndValidate)(validators_1.SubscriptionBusinessParamsSchema, req.params);
                if ((0, validators_1.isValidationError)(validation)) {
                    return res.status(400).json({ message: validation.error });
                }
                const { businessId } = validation.data;
                const result = yield subscription_service_1.default.canAddService(businessId);
                res.json(result);
            }
            catch (error) {
                console.error('[v0] Error checking service limit:', error);
                res.status(500).json({ message: 'Failed to check service limit', error: error.message });
            }
        });
    }
    /**
     * Get subscription usage details
     */
    getUsageDetails(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            try {
                const validation = (0, validators_1.parseAndValidate)(validators_1.SubscriptionBusinessParamsSchema, req.params);
                if ((0, validators_1.isValidationError)(validation)) {
                    return res.status(400).json({ success: false, message: validation.error });
                }
                const { businessId } = validation.data;
                const usage = yield subscription_service_1.default.getUsageDetails(businessId);
                if (!usage) {
                    return res.status(404).json({ success: false, message: 'No subscription found for this business' });
                }
                // Transform the response to match frontend hook expectations
                const transformedData = {
                    staffCurrent: ((_a = usage.currentUsage) === null || _a === void 0 ? void 0 : _a.staff) || 0,
                    staffLimit: typeof ((_b = usage.limits) === null || _b === void 0 ? void 0 : _b.maxStaff) === 'number' ? usage.limits.maxStaff : -1,
                    staffUnlimited: ((_c = usage.limits) === null || _c === void 0 ? void 0 : _c.maxStaff) === 'Unlimited' || ((_d = usage.limits) === null || _d === void 0 ? void 0 : _d.maxStaff) === -1,
                    serviceCurrent: ((_e = usage.currentUsage) === null || _e === void 0 ? void 0 : _e.services) || 0,
                    serviceLimit: typeof ((_f = usage.limits) === null || _f === void 0 ? void 0 : _f.maxServices) === 'number' ? usage.limits.maxServices : -1,
                    serviceUnlimited: ((_g = usage.limits) === null || _g === void 0 ? void 0 : _g.maxServices) === 'Unlimited' || ((_h = usage.limits) === null || _h === void 0 ? void 0 : _h.maxServices) === -1,
                    appointmentCurrent: ((_j = usage.currentUsage) === null || _j === void 0 ? void 0 : _j.appointmentsThisMonth) || 0,
                    appointmentLimit: typeof ((_k = usage.limits) === null || _k === void 0 ? void 0 : _k.appointmentsPerMonth) === 'number' ? usage.limits.appointmentsPerMonth : -1,
                    appointmentUnlimited: ((_l = usage.limits) === null || _l === void 0 ? void 0 : _l.appointmentsPerMonth) === 'Unlimited' || ((_m = usage.limits) === null || _m === void 0 ? void 0 : _m.appointmentsPerMonth) === -1,
                    planName: usage.planName || 'Unknown',
                };
                res.json({
                    success: true,
                    data: transformedData,
                });
            }
            catch (error) {
                console.error('[v0] Error getting usage details:', error);
                res.status(500).json({ success: false, message: 'Failed to get usage details', error: error.message });
            }
        });
    }
    /**
     * Get all subscription plans
     */
    getAllPlans(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('[v0] Fetching all subscription plans');
                const plans = yield prisma_1.default.subscriptionPlan.findMany({
                    where: { active: true },
                    orderBy: { priceNPR: 'asc' },
                });
                res.json({
                    count: plans.length,
                    plans,
                });
            }
            catch (error) {
                console.error('[v0] Error fetching subscription plans:', error);
                res.status(500).json({ message: 'Failed to fetch subscription plans', error: error.message });
            }
        });
    }
    /**
     * Upgrade subscription to a higher tier
     */
    upgrade(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = (0, validators_1.parseAndValidate)(validators_1.UpgradeSubscriptionSchema, req.body);
                if ((0, validators_1.isValidationError)(validation)) {
                    return res.status(400).json({ message: validation.error });
                }
                const { businessId, newPlanId, paymentId } = validation.data;
                console.log(`[v0] Upgrading subscription for business: ${businessId}`);
                const subscription = yield subscription_service_1.default.upgradeSubscription(businessId, newPlanId, paymentId);
                res.json({
                    message: 'Subscription upgraded successfully',
                    subscription,
                });
            }
            catch (error) {
                console.error('[v0] Error upgrading subscription:', error);
                res.status(500).json({ message: 'Failed to upgrade subscription', error: error.message });
            }
        });
    }
    /**
     * Downgrade subscription to a lower tier
     */
    downgrade(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = (0, validators_1.parseAndValidate)(validators_1.DowngradeSubscriptionSchema, req.body);
                if ((0, validators_1.isValidationError)(validation)) {
                    return res.status(400).json({ message: validation.error });
                }
                const { businessId, newPlanId, paymentId } = validation.data;
                console.log(`[v0] Downgrading subscription for business: ${businessId}`);
                const subscription = yield subscription_service_1.default.downgradeSubscription(businessId, newPlanId, paymentId);
                res.json({
                    message: 'Subscription downgraded successfully. Changes take effect on next billing cycle.',
                    subscription,
                });
            }
            catch (error) {
                console.error('[v0] Error downgrading subscription:', error);
                res.status(500).json({ message: 'Failed to downgrade subscription', error: error.message });
            }
        });
    }
    /**
     * Renew subscription after payment
     */
    renew(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = (0, validators_1.parseAndValidate)(validators_1.RenewSubscriptionSchema, req.body);
                if ((0, validators_1.isValidationError)(validation)) {
                    return res.status(400).json({ message: validation.error });
                }
                const { subscriptionId, paymentId, durationDays } = validation.data;
                console.log(`[v0] Renewing subscription: ${subscriptionId}`);
                const subscription = yield subscription_service_1.default.renewSubscription(subscriptionId, paymentId, durationDays || 30);
                res.json({
                    message: 'Subscription renewed successfully',
                    subscription,
                });
            }
            catch (error) {
                console.error('[v0] Error renewing subscription:', error);
                res.status(500).json({ message: 'Failed to renew subscription', error: error.message });
            }
        });
    }
    /**
     * Get next renewal date
     */
    getNextRenewal(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = (0, validators_1.parseAndValidate)(validators_1.SubscriptionBusinessParamsSchema, req.params);
                if ((0, validators_1.isValidationError)(validation)) {
                    return res.status(400).json({ message: validation.error });
                }
                const { businessId } = validation.data;
                const renewalDate = yield subscription_service_1.default.getNextRenewalDate(businessId);
                res.json({
                    businessId,
                    nextRenewalDate: renewalDate,
                    daysUntilRenewal: renewalDate
                        ? Math.ceil((renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : null,
                });
            }
            catch (error) {
                console.error('[v0] Error getting renewal date:', error);
                res.status(500).json({ message: 'Failed to get renewal date', error: error.message });
            }
        });
    }
}
exports.default = new SubscriptionController();
