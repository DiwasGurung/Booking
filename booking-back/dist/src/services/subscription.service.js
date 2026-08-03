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
const prisma_1 = __importDefault(require("../lib/prisma"));
class SubscriptionService {
    /**
     * Create subscription with 1 month free trial
     */
    createSubscriptionWithTrial(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`[v0] Creating subscription with free trial for business: ${data.businessId}, planId: ${data.planId}`);
                const now = new Date();
                const trialEndsAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days trial
                const trialDays = Math.floor((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const plan = yield prisma_1.default.subscriptionPlan.findUnique({
                    where: { id: data.planId },
                });
                if (!plan) {
                    throw new Error(`Subscription plan not found: ${data.planId}`);
                }
                console.log(`[v0] Found plan: ${plan.displayName} with ID: ${plan.id}, Plan durationDays: ${plan.durationDays}`);
                console.log(`[v0] Creating trial for ${trialDays} days, trial ends at: ${trialEndsAt}`);
                yield prisma_1.default.subscription.deleteMany({
                    where: { businessId: data.businessId },
                });
                const subscription = yield prisma_1.default.subscription.create({
                    data: {
                        businessId: data.businessId,
                        planId: data.planId,
                        status: 'TRIAL',
                        trialEndsAt,
                        isTrialUsed: true,
                        startDate: now,
                        endDate: trialEndsAt,
                        autoRenew: true,
                    },
                    include: {
                        plan: true,
                        business: true,
                    },
                });
                const actualTrialDays = Math.floor((subscription.endDate.getTime() - subscription.startDate.getTime()) / (1000 * 60 * 60 * 24));
                console.log(`[v0] Subscription created - Trial: ${actualTrialDays} days, ends: ${subscription.endDate}, trialEndsAt: ${subscription.trialEndsAt}`);
                return subscription;
            }
            catch (error) {
                console.error(`[v0] Failed to create subscription:`, error);
                throw error;
            }
        });
    }
    /**
     * Get subscription by ID
     */
    getSubscriptionById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield prisma_1.default.subscription.findUnique({
                    where: { id },
                    include: {
                        plan: true,
                        business: true,
                    },
                });
                return subscription;
            }
            catch (error) {
                console.error(`[v0] Failed to get subscription by ID: ${id}`, error);
                throw error;
            }
        });
    }
    /**
     * Get business subscription
     */
    getBusinessSubscription(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield prisma_1.default.subscription.findUnique({
                    where: { businessId },
                    include: {
                        plan: true,
                        business: true,
                    },
                });
                return subscription;
            }
            catch (error) {
                console.error(`[v0] Failed to get subscription for business: ${businessId}`, error);
                throw error;
            }
        });
    }
    /**
     * Check if subscription is valid (trial or active)
     */
    isSubscriptionValid(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield this.getBusinessSubscription(businessId);
                if (!subscription) {
                    console.log(`[v0] No subscription found for business: ${businessId}`);
                    return false;
                }
                const now = new Date();
                if (subscription.status === 'TRIAL') {
                    if (subscription.trialEndsAt && subscription.trialEndsAt > now) {
                        console.log(`[v0] Trial subscription is valid`);
                        return true;
                    }
                    console.log(`[v0] Trial subscription has expired`);
                    return false;
                }
                if (subscription.status === 'ACTIVE' || subscription.status === 'CANCELLED') {
                    if (subscription.endDate && subscription.endDate > now) {
                        console.log(`[v0] ${subscription.status} subscription is still valid until ${subscription.endDate}`);
                        return true;
                    }
                    console.log(`[v0] ${subscription.status} subscription has expired`);
                    return false;
                }
                console.log(`[v0] Subscription status is: ${subscription.status}`);
                return false;
            }
            catch (error) {
                console.error(`[v0] Failed to check subscription validity:`, error);
                return false;
            }
        });
    }
    /**
     * Get subscription status details
     */
    getSubscriptionStatus(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield prisma_1.default.subscription.findUnique({
                    where: { businessId },
                    include: {
                        plan: true,
                        business: true,
                    },
                });
                if (!subscription) {
                    return {
                        hasSubscription: false,
                        status: null,
                        daysRemaining: null,
                        trialEndsAt: null,
                        expiresAt: null,
                    };
                }
                const now = new Date();
                let daysRemaining = 0;
                let expiresAt = null;
                let hasValidSubscription = true;
                if (subscription.status === 'TRIAL' && subscription.trialEndsAt) {
                    daysRemaining = Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    expiresAt = subscription.trialEndsAt;
                    // If trial has expired, subscription is no longer valid
                    if (daysRemaining <= 0) {
                        console.log(`[v0] Trial expired for business ${businessId}`);
                        hasValidSubscription = false;
                    }
                }
                else if ((subscription.status === 'ACTIVE' || subscription.status === 'CANCELLED') && subscription.endDate) {
                    daysRemaining = Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    expiresAt = subscription.endDate;
                    // If CANCELLED and already expired, subscription is no longer valid
                    if (subscription.status === 'CANCELLED' && daysRemaining <= 0) {
                        console.log(`[v0] Cancelled subscription expired for business ${businessId}`);
                        hasValidSubscription = false;
                    }
                    // If ACTIVE but somehow expired, subscription is no longer valid
                    if (subscription.status === 'ACTIVE' && daysRemaining <= 0) {
                        console.log(`[v0] Active subscription expired for business ${businessId}`);
                        hasValidSubscription = false;
                    }
                }
                return {
                    id: subscription.id,
                    hasSubscription: hasValidSubscription,
                    status: subscription.status,
                    planName: subscription.plan.displayName,
                    daysRemaining: Math.max(0, daysRemaining),
                    trialEndsAt: subscription.trialEndsAt,
                    expiresAt,
                    autoRenew: subscription.autoRenew,
                };
            }
            catch (error) {
                console.error(`[v0] Failed to get subscription status:`, error);
                return {
                    hasSubscription: false,
                    status: null,
                    daysRemaining: null,
                    trialEndsAt: null,
                    expiresAt: null,
                };
            }
        });
    }
    /**
     * Activate subscription after payment
     */
    activateSubscription(subscriptionId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`[v0] Activating subscription: ${subscriptionId}`);
                // Fetch subscription to get billing period
                const currentSubscription = yield prisma_1.default.subscription.findUnique({
                    where: { id: subscriptionId },
                });
                if (!currentSubscription) {
                    throw new Error(`Subscription not found: ${subscriptionId}`);
                }
                const now = new Date();
                // Use provided durationDays or calculate based on billing period
                let durationDays = data.durationDays || 30;
                if (currentSubscription.billingPeriod) {
                    const billingDays = {
                        MONTHLY: 30,
                        QUARTERLY: 90,
                        HALF_YEARLY: 180,
                        YEARLY: 365,
                    };
                    durationDays = billingDays[currentSubscription.billingPeriod] || 30;
                }
                const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
                const billingCycleEndDate = new Date(endDate); // Same as endDate initially
                const subscription = yield prisma_1.default.subscription.update({
                    where: { id: subscriptionId },
                    data: {
                        status: 'ACTIVE',
                        startDate: now,
                        endDate,
                        billingCycleEndDate,
                        lastPaymentId: data.paymentId,
                        nextRenewalDate: endDate,
                        isTrialUsed: true,
                    },
                    include: {
                        plan: true,
                        business: true,
                    },
                });
                console.log(`[v0] Subscription activated:`, {
                    subscriptionId,
                    billingPeriod: currentSubscription.billingPeriod,
                    durationDays,
                    activatedAt: now,
                    expiresAt: endDate,
                });
                return subscription;
            }
            catch (error) {
                console.error(`[v0] Failed to activate subscription:`, error);
                throw error;
            }
        });
    }
    /**
     * Update subscription
     */
    updateSubscription(subscriptionId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield prisma_1.default.subscription.update({
                    where: { id: subscriptionId },
                    data,
                    include: {
                        plan: true,
                        business: true,
                    },
                });
                return subscription;
            }
            catch (error) {
                console.error(`[v0] Failed to update subscription:`, error);
                throw error;
            }
        });
    }
    /**
     * Check if trial has expired
     */
    hasTrialExpired(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield this.getBusinessSubscription(businessId);
                if (!subscription || subscription.status !== 'TRIAL') {
                    return false;
                }
                if (!subscription.trialEndsAt) {
                    return true;
                }
                const now = new Date();
                return subscription.trialEndsAt <= now;
            }
            catch (error) {
                console.error(`[v0] Failed to check trial expiration:`, error);
                return false;
            }
        });
    }
    /**
     * Get all expired subscriptions
     */
    getExpiredSubscriptions() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                const subscriptions = yield prisma_1.default.subscription.findMany({
                    where: {
                        status: 'ACTIVE',
                        endDate: {
                            lte: now,
                        },
                    },
                    include: {
                        plan: true,
                        business: true,
                    },
                });
                return subscriptions;
            }
            catch (error) {
                console.error(`[v0] Failed to get expired subscriptions:`, error);
                throw error;
            }
        });
    }
    /**
     * Get expiring soon subscriptions (within 7 days)
     */
    getExpiringSoonSubscriptions() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                const subscriptions = yield prisma_1.default.subscription.findMany({
                    where: {
                        status: 'ACTIVE',
                        endDate: {
                            gte: now,
                            lte: sevenDaysFromNow,
                        },
                    },
                    include: {
                        plan: true,
                        business: true,
                    },
                });
                return subscriptions;
            }
            catch (error) {
                console.error(`[v0] Failed to get expiring soon subscriptions:`, error);
                throw error;
            }
        });
    }
    /**
     * Check if business can add more appointments
     */
    canAddAppointment(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield this.getBusinessSubscription(businessId);
                if (!subscription || !(yield this.isSubscriptionValid(businessId))) {
                    return { allowed: false, reason: 'No active subscription found' };
                }
                const plan = subscription.plan;
                if (plan.maxAppointmentsPerMonth === -1) {
                    return { allowed: true };
                }
                if (subscription.appointmentsThisMonth >= plan.maxAppointmentsPerMonth) {
                    return {
                        allowed: false,
                        reason: `Monthly booking limit (${plan.maxAppointmentsPerMonth}) reached. Upgrade to increase limit.`,
                    };
                }
                return { allowed: true };
            }
            catch (error) {
                console.error(`[v0] Failed to check appointment limit:`, error);
                return { allowed: false, reason: 'Error checking subscription' };
            }
        });
    }
    /**
     * Check if business can add more staff
     */
    canAddStaff(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield this.getBusinessSubscription(businessId);
                if (!subscription) {
                    return { allowed: false, reason: 'No subscription found' };
                }
                const plan = subscription.plan;
                if (plan.maxStaff === -1) {
                    return { allowed: true };
                }
                const staffCount = yield prisma_1.default.staff.count({
                    where: { businessId },
                });
                if (staffCount >= plan.maxStaff) {
                    return {
                        allowed: false,
                        reason: `Staff limit (${plan.maxStaff}) reached for ${plan.displayName} plan. Upgrade to add more staff.`,
                        current: staffCount,
                        limit: plan.maxStaff,
                    };
                }
                return { allowed: true, current: staffCount, limit: plan.maxStaff };
            }
            catch (error) {
                console.error(`[v0] Failed to check staff limit:`, error);
                return { allowed: false, reason: 'Error checking subscription' };
            }
        });
    }
    /**
     * Check if business can add more services
     */
    canAddService(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield this.getBusinessSubscription(businessId);
                if (!subscription) {
                    return { allowed: false, reason: 'No subscription found' };
                }
                const plan = subscription.plan;
                if (plan.maxServices === -1) {
                    return { allowed: true };
                }
                const serviceCount = yield prisma_1.default.service.count({
                    where: { businessId },
                });
                if (serviceCount >= plan.maxServices) {
                    return {
                        allowed: false,
                        reason: `Service limit (${plan.maxServices}) reached for ${plan.displayName} plan. Upgrade to add more services.`,
                        current: serviceCount,
                        limit: plan.maxServices,
                    };
                }
                return { allowed: true, current: serviceCount, limit: plan.maxServices };
            }
            catch (error) {
                console.error(`[v0] Failed to check service limit:`, error);
                return { allowed: false, reason: 'Error checking subscription' };
            }
        });
    }
    /**
     * Reset monthly usage counters
     */
    resetMonthlyUsage(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                yield prisma_1.default.subscription.updateMany({
                    where: { businessId },
                    data: {
                        appointmentsThisMonth: 0,
                        usageResetDate: now,
                    },
                });
                console.log(`[v0] Monthly usage reset for business: ${businessId}`);
            }
            catch (error) {
                console.error(`[v0] Failed to reset monthly usage:`, error);
                throw error;
            }
        });
    }
    /**
     * Get subscription usage details
     */
    getUsageDetails(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield this.getBusinessSubscription(businessId);
                if (!subscription) {
                    return null;
                }
                const plan = subscription.plan;
                const staffCount = yield prisma_1.default.staff.count({ where: { businessId } });
                const serviceCount = yield prisma_1.default.service.count({ where: { businessId } });
                return {
                    planName: plan.displayName,
                    currentUsage: {
                        appointmentsThisMonth: subscription.appointmentsThisMonth,
                        staff: staffCount,
                        services: serviceCount,
                    },
                    limits: {
                        appointmentsPerMonth: plan.maxAppointmentsPerMonth === -1 ? 'Unlimited' : plan.maxAppointmentsPerMonth,
                        maxStaff: plan.maxStaff === -1 ? 'Unlimited' : plan.maxStaff,
                        maxServices: plan.maxServices === -1 ? 'Unlimited' : plan.maxServices,
                    },
                    featuresEnabled: {
                        emailNotifications: plan.allowEmailNotifications,
                        onlineBooking: plan.allowOnlineBooking,
                        reports: plan.allowReports,
                        customBranding: plan.allowCustomBranding,
                        prioritySupport: plan.prioritySupport,
                    },
                };
            }
            catch (error) {
                console.error(`[v0] Failed to get usage details:`, error);
                return null;
            }
        });
    }
    /**
     * Upgrade subscription to a higher tier
     */
    upgradeSubscription(businessId, newPlanId, paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`[v0] Upgrading subscription for business: ${businessId} to plan: ${newPlanId}`);
                const subscription = yield prisma_1.default.subscription.findUnique({
                    where: { businessId },
                    include: { plan: true },
                });
                if (!subscription) {
                    throw new Error('No subscription found for this business');
                }
                const newPlan = yield prisma_1.default.subscriptionPlan.findUnique({
                    where: { id: newPlanId },
                });
                if (!newPlan) {
                    throw new Error('Plan not found');
                }
                const now = new Date();
                const updated = yield prisma_1.default.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        planId: newPlanId,
                        status: 'ACTIVE',
                        lastPaymentId: paymentId,
                        appointmentsThisMonth: 0,
                        usageResetDate: now,
                    },
                    include: {
                        plan: true,
                        business: true,
                    },
                });
                console.log(`[v0] Subscription upgraded successfully`);
                return updated;
            }
            catch (error) {
                console.error(`[v0] Failed to upgrade subscription:`, error);
                throw error;
            }
        });
    }
    /**
     * Downgrade subscription to a lower tier
     */
    downgradeSubscription(businessId, newPlanId, paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`[v0] Downgrading subscription for business: ${businessId} to plan: ${newPlanId}`);
                const subscription = yield prisma_1.default.subscription.findUnique({
                    where: { businessId },
                    include: { plan: true },
                });
                if (!subscription) {
                    throw new Error('No subscription found for this business');
                }
                const newPlan = yield prisma_1.default.subscriptionPlan.findUnique({
                    where: { id: newPlanId },
                });
                if (!newPlan) {
                    throw new Error('Plan not found');
                }
                const updated = yield prisma_1.default.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        planId: newPlanId,
                        lastPaymentId: paymentId,
                    },
                    include: {
                        plan: true,
                        business: true,
                    },
                });
                console.log(`[v0] Subscription downgraded successfully`);
                return updated;
            }
            catch (error) {
                console.error(`[v0] Failed to downgrade subscription:`, error);
                throw error;
            }
        });
    }
    /**
     * Renew subscription after payment
     */
    renewSubscription(subscriptionId_1, paymentId_1) {
        return __awaiter(this, arguments, void 0, function* (subscriptionId, paymentId, durationDays = 30) {
            try {
                console.log(`[v0] Renewing subscription: ${subscriptionId}`);
                const now = new Date();
                const newEndDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
                const updated = yield prisma_1.default.subscription.update({
                    where: { id: subscriptionId },
                    data: {
                        status: 'ACTIVE',
                        startDate: now,
                        endDate: newEndDate,
                        nextRenewalDate: newEndDate,
                        lastPaymentId: paymentId,
                        appointmentsThisMonth: 0,
                        usageResetDate: now,
                    },
                    include: {
                        plan: true,
                        business: true,
                    },
                });
                console.log(`[v0] Subscription renewed until: ${newEndDate}`);
                return updated;
            }
            catch (error) {
                console.error(`[v0] Failed to renew subscription:`, error);
                throw error;
            }
        });
    }
    /**
     * Increment appointment usage
     */
    incrementAppointmentUsage(businessId_1) {
        return __awaiter(this, arguments, void 0, function* (businessId, count = 1) {
            try {
                yield prisma_1.default.subscription.updateMany({
                    where: { businessId },
                    data: {
                        appointmentsThisMonth: {
                            increment: count,
                        },
                    },
                });
                console.log(`[v0] Appointment usage incremented by ${count} for business: ${businessId}`);
            }
            catch (error) {
                console.error(`[v0] Failed to increment appointment usage:`, error);
                throw error;
            }
        });
    }
    /**
     * Schedule trial to active transition
     */
    scheduleTrialToActive(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`[v0] Scheduling subscription transition from trial to active: ${businessId}`);
                const subscription = yield this.getBusinessSubscription(businessId);
                if (!subscription) {
                    throw new Error('Subscription not found');
                }
                return subscription;
            }
            catch (error) {
                console.error(`[v0] Failed to schedule trial transition:`, error);
                throw error;
            }
        });
    }
    /**
     * Auto-renew expired subscriptions
     */
    autoRenewExpiredSubscriptions() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('[v0] Starting auto-renewal of expired subscriptions');
                const expiredSubs = yield this.getExpiredSubscriptions();
                let renewedCount = 0;
                for (const sub of expiredSubs) {
                    if (sub.autoRenew) {
                        try {
                            yield this.renewSubscription(sub.id, sub.lastPaymentId || '', 30);
                            renewedCount++;
                        }
                        catch (error) {
                            console.error(`[v0] Failed to auto-renew subscription ${sub.id}:`, error);
                        }
                    }
                }
                console.log(`[v0] Auto-renewed ${renewedCount} subscriptions`);
                return renewedCount;
            }
            catch (error) {
                console.error(`[v0] Failed to auto-renew subscriptions:`, error);
                throw error;
            }
        });
    }
    /**
     * Get subscription renewal date
     */
    getNextRenewalDate(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield this.getBusinessSubscription(businessId);
                if (!subscription) {
                    return null;
                }
                if (subscription.status === 'TRIAL') {
                    return subscription.trialEndsAt;
                }
                if (subscription.status === 'ACTIVE') {
                    return subscription.endDate;
                }
                return null;
            }
            catch (error) {
                console.error(`[v0] Failed to get renewal date:`, error);
                return null;
            }
        });
    }
    /**
     * Cancel a subscription
     */
    cancelSubscription(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const subscription = yield prisma_1.default.subscription.findUnique({
                where: { id: data.subscriptionId },
                include: { plan: true, business: true },
            });
            if (!subscription) {
                throw new Error(`Subscription not found: ${data.subscriptionId}`);
            }
            console.log(`[v0] Cancelling subscription ${data.subscriptionId}`);
            const updated = yield prisma_1.default.subscription.update({
                where: { id: data.subscriptionId },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: new Date(),
                },
                include: { plan: true, business: true },
            });
            console.log(`[v0] Subscription cancelled successfully`);
            return updated;
        });
    }
}
exports.default = new SubscriptionService();
