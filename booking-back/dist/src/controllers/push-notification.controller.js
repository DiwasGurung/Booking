"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserSubscriptions = exports.getVapidPublicKey = exports.unsubscribeFromPushNotifications = exports.subscribeToPushNotifications = void 0;
const push_subscription_service_js_1 = require("../services/push-subscription.service.js");
/**
 * Subscribe user to push notifications
 */
const subscribeToPushNotifications = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { subscription } = req.body;
        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ error: 'Invalid subscription object' });
        }
        await push_subscription_service_js_1.PushSubscriptionService.createOrUpdateSubscription(userId, subscription);
        res.json({
            success: true,
            message: 'Successfully subscribed to push notifications',
        });
    }
    catch (error) {
        console.error('[PushSubscription] Subscription error:', error.message);
        res.status(500).json({ error: 'Failed to subscribe to push notifications' });
    }
};
exports.subscribeToPushNotifications = subscribeToPushNotifications;
/**
 * Unsubscribe user from push notifications
 */
const unsubscribeFromPushNotifications = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { subscriptionId } = req.body;
        if (!subscriptionId) {
            return res.status(400).json({ error: 'Subscription ID required' });
        }
        await push_subscription_service_js_1.PushSubscriptionService.deactivateSubscription(subscriptionId);
        res.json({
            success: true,
            message: 'Successfully unsubscribed from push notifications',
        });
    }
    catch (error) {
        console.error('[PushSubscription] Unsubscribe error:', error.message);
        res.status(500).json({ error: 'Failed to unsubscribe from push notifications' });
    }
};
exports.unsubscribeFromPushNotifications = unsubscribeFromPushNotifications;
/**
 * Get VAPID public key for push subscription
 */
const getVapidPublicKey = (req, res) => {
    try {
        const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
            return res.status(500).json({ error: 'Push notifications not configured' });
        }
        res.json({ vapidPublicKey });
    }
    catch (error) {
        console.error('[PushSubscription] VAPID key error:', error.message);
        res.status(500).json({ error: 'Failed to retrieve VAPID key' });
    }
};
exports.getVapidPublicKey = getVapidPublicKey;
/**
 * Get user's subscriptions
 */
const getUserSubscriptions = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const subscriptions = await push_subscription_service_js_1.PushSubscriptionService.getUserSubscriptions(userId);
        res.json({
            success: true,
            subscriptions,
        });
    }
    catch (error) {
        console.error('[PushSubscription] Get subscriptions error:', error.message);
        res.status(500).json({ error: 'Failed to retrieve subscriptions' });
    }
};
exports.getUserSubscriptions = getUserSubscriptions;
