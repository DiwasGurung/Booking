"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const subscription_service_1 = __importDefault(require("../services/subscription.service"));
const index_1 = require("../validators/index");
const prisma_1 = __importDefault(require("../lib/prisma"));
class SubscriptionController {
    /**
     * Create subscription with free trial
     */
    async createWithTrial(req, res) {
        try {
            const validation = (0, index_1.parseAndValidate)(index_1.CreateSubscriptionTrialSchema, req.body);
            if ((0, index_1.isValidationError)(validation)) {
                return res.status(400).json({ message: validation.error });
            }
            const { businessId, planId } = validation.data;
            const subscription = await subscription_service_1.default.createSubscriptionWithTrial({
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
    }
    /**
     * Get subscription status for a business
     */
    async getStatus(req, res) {
        try {
            const validation = (0, index_1.parseAndValidate)(index_1.SubscriptionBusinessParamsSchema, req.params);
            if ((0, index_1.isValidationError)(validation)) {
                console.error('[v0] Validation error for getStatus:', validation.error);
                return res.status(400).json({ message: validation.error });
            }
            const { businessId } = validation.data;
            const status = await subscription_service_1.default.getSubscriptionStatus(businessId);
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
    }
    /**
     * Check if subscription is valid
     */
    async checkValidity(req, res) {
        try {
            const validation = (0, index_1.parseAndValidate)(index_1.SubscriptionBusinessParamsSchema, req.params);
            if ((0, index_1.isValidationError)(validation)) {
                return res.status(400).json({ message: validation.error });
            }
            const { businessId } = validation.data;
            const isValid = await subscription_service_1.default.isSubscriptionValid(businessId);
            res.json({
                businessId,
                isValid,
            });
        }
        catch (error) {
            console.error('[v0] Error checking subscription validity:', error);
            res.status(500).json({ message: 'Failed to check subscription validity', error: error.message });
        }
    }
    /**
     * Activate subscription after payment
     */
    async activate(req, res) {
        try {
            const paramsValidation = (0, index_1.parseAndValidate)(index_1.SubscriptionParamsSchema, req.params);
            if ((0, index_1.isValidationError)(paramsValidation)) {
                return res.status(400).json({ message: paramsValidation.error });
            }
            const bodyValidation = (0, index_1.parseAndValidate)(index_1.ActivateSubscriptionSchema, req.body);
            if ((0, index_1.isValidationError)(bodyValidation)) {
                return res.status(400).json({ message: bodyValidation.error });
            }
            const { subscriptionId } = paramsValidation.data;
            const { paymentId, durationDays } = bodyValidation.data;
            const subscription = await subscription_service_1.default.activateSubscription(subscriptionId, {
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
    }
    /**
     * Check if trial has expired
     */
    async checkTrialExpiration(req, res) {
        try {
            const validation = (0, index_1.parseAndValidate)(index_1.SubscriptionBusinessParamsSchema, req.params);
            if ((0, index_1.isValidationError)(validation)) {
                return res.status(400).json({ message: validation.error });
            }
            const { businessId } = validation.data;
            const expired = await subscription_service_1.default.hasTrialExpired(businessId);
            res.json({
                businessId,
                trialExpired: expired,
            });
        }
        catch (error) {
            console.error('[v0] Error checking trial expiration:', error);
            res.status(500).json({ message: 'Failed to check trial expiration', error: error.message });
        }
    }
    /**
     * Cancel a subscription
     */
    async cancelSubscription(req, res) {
        try {
            const validation = (0, index_1.parseAndValidate)(index_1.SubscriptionParamsSchema, req.params);
            if ((0, index_1.isValidationError)(validation)) {
                return res.status(400).json({ message: validation.error });
            }
            const { subscriptionId } = validation.data;
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const result = await subscription_service_1.default.cancelSubscription({
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
    }
    /**
     * Get all expired subscriptions (for admin)
     */
    async getExpired(req, res) {
        try {
            const subscriptions = await subscription_service_1.default.getExpiredSubscriptions();
            res.json({
                count: subscriptions.length,
                subscriptions,
            });
        }
        catch (error) {
            console.error('[v0] Error fetching expired subscriptions:', error);
            res.status(500).json({ message: 'Failed to fetch expired subscriptions', error: error.message });
        }
    }
    /**
     * Get subscriptions expiring soon (for admin)
     */
    async getExpiringSoon(req, res) {
        try {
            const subscriptions = await subscription_service_1.default.getExpiringSoonSubscriptions();
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
    }
    /**
     * Check if business can add appointment
     */
    async checkAppointmentLimit(req, res) {
        try {
            const validation = (0, index_1.parseAndValidate)(index_1.SubscriptionBusinessParamsSchema, req.params);
            if ((0, index_1.isValidationError)(validation)) {
                return res.status(400).json({ message: validation.error });
            }
            const { businessId } = validation.data;
            const result = await subscription_service_1.default.canAddAppointment(businessId);
            res.json(result);
        }
        catch (error) {
            console.error('[v0] Error checking appointment limit:', error);
            res.status(500).json({ message: 'Failed to check appointment limit', error: error.message });
        }
    }
    /**
     * Check if business can add staff
     */
    async checkStaffLimit(req, res) {
        try {
            const validation = (0, index_1.parseAndValidate)(index_1.SubscriptionBusinessParamsSchema, req.params);
            if ((0, index_1.isValidationError)(validation)) {
                return res.status(400).json({ message: validation.error });
            }
            const { businessId } = validation.data;
            const result = await subscription_service_1.default.canAddStaff(businessId);
            res.json(result);
        }
        catch (error) {
            console.error('[v0] Error checking staff limit:', error);
            res.status(500).json({ message: 'Failed to check staff limit', error: error.message });
        }
    }
    /**
     * Check if business can add service
     */
    async checkServiceLimit(req, res) {
        try {
            const validation = (0, index_1.parseAndValidate)(index_1.SubscriptionBusinessParamsSchema, req.params);
            if ((0, index_1.isValidationError)(validation)) {
                return res.status(400).json({ message: validation.error });
            }
            const { businessId } = validation.data;
            const result = await subscription_service_1.default.canAddService(businessId);
            res.json(result);
        }
        catch (error) {
            console.error('[v0] Error checking service limit:', error);
            res.status(500).json({ message: 'Failed to check service limit', error: error.message });
        }
    }
    /**
     * Get subscription usage details
     */
    async getUsageDetails(req, res) {
        try {
            const validation = (0, index_1.parseAndValidate)(index_1.SubscriptionBusinessParamsSchema, req.params);
            if ((0, index_1.isValidationError)(validation)) {
                return res.status(400).json({ success: false, message: validation.error });
            }
            const { businessId } = validation.data;
            const usage = await subscription_service_1.default.getUsageDetails(businessId);
            if (!usage) {
                return res.status(404).json({ success: false, message: 'No subscription found for this business' });
            }
            // Transform the response to match frontend hook expectations
            const transformedData = {
                staffCurrent: usage.currentUsage?.staff || 0,
                staffLimit: typeof usage.limits?.maxStaff === 'number' ? usage.limits.maxStaff : -1,
                staffUnlimited: usage.limits?.maxStaff === 'Unlimited' || usage.limits?.maxStaff === -1,
                serviceCurrent: usage.currentUsage?.services || 0,
                serviceLimit: typeof usage.limits?.maxServices === 'number' ? usage.limits.maxServices : -1,
                serviceUnlimited: usage.limits?.maxServices === 'Unlimited' || usage.limits?.maxServices === -1,
                appointmentCurrent: usage.currentUsage?.appointmentsThisMonth || 0,
                appointmentLimit: typeof usage.limits?.appointmentsPerMonth === 'number' ? usage.limits.appointmentsPerMonth : -1,
                appointmentUnlimited: usage.limits?.appointmentsPerMonth === 'Unlimited' || usage.limits?.appointmentsPerMonth === -1,
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
    }
    /**
     * Get all subscription plans
     */
    async getAllPlans(req, res) {
        try {
            const plans = await prisma_1.default.subscriptionPlan.findMany({
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
    }
    /**
     * Upgrade subscription to a higher tier
     */
    async upgrade(req, res) {
        try {
            const validation = (0, index_1.parseAndValidate)(index_1.UpgradeSubscriptionSchema, req.body);
            if ((0, index_1.isValidationError)(validation)) {
                return res.status(400).json({ message: validation.error });
            }
            const { businessId, newPlanId, paymentId } = validation.data;
            const subscription = await subscription_service_1.default.upgradeSubscription(businessId, newPlanId, paymentId);
            res.json({
                message: 'Subscription upgraded successfully',
                subscription,
            });
        }
        catch (error) {
            console.error('[v0] Error upgrading subscription:', error);
            res.status(500).json({ message: 'Failed to upgrade subscription', error: error.message });
        }
    }
    /**
     * Downgrade subscription to a lower tier
     */
    async downgrade(req, res) {
        try {
            const validation = (0, index_1.parseAndValidate)(index_1.DowngradeSubscriptionSchema, req.body);
            if ((0, index_1.isValidationError)(validation)) {
                return res.status(400).json({ message: validation.error });
            }
            const { businessId, newPlanId, paymentId } = validation.data;
            const subscription = await subscription_service_1.default.downgradeSubscription(businessId, newPlanId, paymentId);
            res.json({
                message: 'Subscription downgraded successfully. Changes take effect on next billing cycle.',
                subscription,
            });
        }
        catch (error) {
            console.error('[v0] Error downgrading subscription:', error);
            res.status(500).json({ message: 'Failed to downgrade subscription', error: error.message });
        }
    }
    /**
     * Renew subscription after payment
     */
    async renew(req, res) {
        try {
            const validation = (0, index_1.parseAndValidate)(index_1.RenewSubscriptionSchema, req.body);
            if ((0, index_1.isValidationError)(validation)) {
                return res.status(400).json({ message: validation.error });
            }
            const { subscriptionId, paymentId, durationDays } = validation.data;
            const subscription = await subscription_service_1.default.renewSubscription(subscriptionId, paymentId, durationDays || 30);
            res.json({
                message: 'Subscription renewed successfully',
                subscription,
            });
        }
        catch (error) {
            console.error('[v0] Error renewing subscription:', error);
            res.status(500).json({ message: 'Failed to renew subscription', error: error.message });
        }
    }
    /**
     * Get next renewal date
     */
    async getNextRenewal(req, res) {
        try {
            const validation = (0, index_1.parseAndValidate)(index_1.SubscriptionBusinessParamsSchema, req.params);
            if ((0, index_1.isValidationError)(validation)) {
                return res.status(400).json({ message: validation.error });
            }
            const { businessId } = validation.data;
            const renewalDate = await subscription_service_1.default.getNextRenewalDate(businessId);
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
    }
}
exports.default = new SubscriptionController();
