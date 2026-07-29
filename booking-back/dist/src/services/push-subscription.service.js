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
exports.PushSubscriptionService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class PushSubscriptionService {
    /**
     * Create or update a push subscription for a user
     */
    static createOrUpdateSubscription(userId, subscription) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existing = yield prisma_1.default.pushSubscription.findFirst({
                    where: {
                        userId,
                        endpoint: subscription.endpoint,
                    },
                });
                if (existing) {
                    // Update existing subscription
                    return yield prisma_1.default.pushSubscription.update({
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
                    return yield prisma_1.default.pushSubscription.create({
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
        });
    }
    /**
     * Get all active push subscriptions for a user
     */
    static getUserSubscriptions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscriptions = yield prisma_1.default.pushSubscription.findMany({
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
        });
    }
    /**
     * Deactivate a push subscription
     */
    static deactivateSubscription(subscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma_1.default.pushSubscription.update({
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
        });
    }
    /**
     * Remove an invalid subscription
     */
    static removeSubscription(subscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma_1.default.pushSubscription.delete({
                    where: { id: subscriptionId },
                });
            }
            catch (error) {
                console.error('[PushSubscription] Failed to remove subscription:', error);
            }
        });
    }
    /**
     * Check if user has any active push subscriptions
     */
    static hasActiveSubscriptions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield prisma_1.default.pushSubscription.count({
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
        });
    }
}
exports.PushSubscriptionService = PushSubscriptionService;
