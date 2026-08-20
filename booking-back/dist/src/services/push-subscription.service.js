"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushSubscriptionService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class PushSubscriptionService {
    /**
     * Create or update a push subscription for a user
     */
    static async createOrUpdateSubscription(userId, subscription) {
        try {
            const existing = await prisma_1.default.pushSubscription.findFirst({
                where: {
                    userId,
                    endpoint: subscription.endpoint,
                },
            });
            if (existing) {
                // Update existing subscription
                return await prisma_1.default.pushSubscription.update({
                    where: { id: existing.id },
                    data: {
                        p256dh: subscription.keys.p256dh,
                        auth: subscription.keys.auth,
                        isActive: true,
                        updatedAt: new Date(),
                    },
                });
            }
            else {
                // Create new subscription
                return await prisma_1.default.pushSubscription.create({
                    data: {
                        userId,
                        endpoint: subscription.endpoint,
                        p256dh: subscription.keys.p256dh,
                        auth: subscription.keys.auth,
                        isActive: true,
                    },
                });
            }
        }
        catch (error) {
            console.error('[PushSubscription] Failed to save subscription:', error);
            throw error;
        }
    }
    /**
     * Get all active push subscriptions for a user
     */
    static async getUserSubscriptions(userId) {
        try {
            const subscriptions = await prisma_1.default.pushSubscription.findMany({
                where: {
                    userId,
                    isActive: true,
                },
            });
            // Convert back to subscription objects
            return subscriptions.map((sub) => ({
                id: sub.id,
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth,
                },
            }));
        }
        catch (error) {
            console.error('[PushSubscription] Failed to get subscriptions:', error);
            return [];
        }
    }
    /**
     * Deactivate a push subscription
     */
    static async deactivateSubscription(subscriptionId) {
        try {
            return await prisma_1.default.pushSubscription.update({
                where: { id: subscriptionId },
                data: {
                    isActive: false,
                    updatedAt: new Date(),
                },
            });
        }
        catch (error) {
            console.error('[PushSubscription] Failed to deactivate subscription:', error);
        }
    }
    /**
     * Remove an invalid subscription
     */
    static async removeSubscription(subscriptionId) {
        try {
            return await prisma_1.default.pushSubscription.delete({
                where: { id: subscriptionId },
            });
        }
        catch (error) {
            console.error('[PushSubscription] Failed to remove subscription:', error);
        }
    }
    /**
     * Check if user has any active push subscriptions
     */
    static async hasActiveSubscriptions(userId) {
        try {
            const count = await prisma_1.default.pushSubscription.count({
                where: {
                    userId,
                    isActive: true,
                },
            });
            return count > 0;
        }
        catch (error) {
            console.error('[PushSubscription] Failed to check subscriptions:', error);
            return false;
        }
    }
}
exports.PushSubscriptionService = PushSubscriptionService;
