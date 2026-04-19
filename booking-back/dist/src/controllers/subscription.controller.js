"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const subscription_service_1 = __importDefault(require("../services/subscription.service"));
class SubscriptionController {
    /**
     * Create subscription with free trial
     */
    async createWithTrial(req, res) {
        try {
            const { businessId, planId } = req.body;
            if (!businessId || !planId) {
                return res.status(400).json({ message: 'businessId and planId are required' });
            }
            console.log(`[v0] Creating free trial subscription for business: ${businessId}`);
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
            const { businessId } = req.params;
            if (!businessId || Array.isArray(businessId)) {
                return res.status(400).json({ message: 'businessId is required' });
            }
            console.log(`[v0] Fetching subscription status for business: ${businessId}`);
            const status = await subscription_service_1.default.getSubscriptionStatus(businessId);
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
            const { businessId } = req.params;
            if (!businessId || Array.isArray(businessId)) {
                return res.status(400).json({ message: 'businessId is required' });
            }
            console.log(`[v0] Checking subscription validity for business: ${businessId}`);
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
            const { subscriptionId } = req.params;
            const { paymentId, durationDays } = req.body;
            if (!subscriptionId || Array.isArray(subscriptionId) || !paymentId) {
                return res.status(400).json({ message: 'subscriptionId and paymentId are required' });
            }
            console.log(`[v0] Activating subscription: ${subscriptionId}`);
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
            const { businessId } = req.params;
            if (!businessId || Array.isArray(businessId)) {
                return res.status(400).json({ message: 'businessId is required' });
            }
            console.log(`[v0] Checking trial expiration for business: ${businessId}`);
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
     * Cancel subscription
     */
    async cancel(req, res) {
        try {
            const { subscriptionId } = req.params;
            if (!subscriptionId || Array.isArray(subscriptionId)) {
                return res.status(400).json({ message: 'subscriptionId is required' });
            }
            console.log(`[v0] Cancelling subscription: ${subscriptionId}`);
            const subscription = await subscription_service_1.default.cancelSubscription(subscriptionId);
            res.json({
                message: 'Subscription cancelled successfully',
                subscription,
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
            console.log('[v0] Fetching expired subscriptions');
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
            console.log('[v0] Fetching subscriptions expiring soon');
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
}
exports.default = new SubscriptionController();
