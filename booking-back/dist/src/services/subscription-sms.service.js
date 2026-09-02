"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../lib/prisma"));
// Duplicated intentionally (rather than imported from sparrow-sms.service.ts)
// to avoid a circular import — that service already imports this one.
function formatPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.startsWith('977'))
        return cleaned;
    if (cleaned.length === 10 && cleaned.startsWith('9'))
        return '977' + cleaned;
    return cleaned;
}
/**
 * Single source of truth for:
 *  - checking whether a business can send an SMS right now
 *  - decrementing/tracking usage after a send
 *  - writing to SMSLog
 *
 * sparrow-sms.service.ts should NOT touch prisma.sMSLog or subscription
 * fields directly — everything routes through here so there's exactly
 * one place that owns quota + logging consistency.
 */
class SubscriptionSmsService {
    /**
     * Check if business has SMS quota available right now.
     * smsCreditBalance is the source of truth for availability;
     * smsUsedThisMonth is kept only for display/stats.
     */
    async checkSmsQuota(businessId) {
        try {
            const subscription = await prisma_1.default.subscription.findUnique({
                where: { businessId },
                include: { plan: true },
            });
            if (!subscription) {
                console.log('[v0] No subscription found for business:', businessId);
                return { available: false, remaining: 0, limit: 0 };
            }
            if (!subscription.plan.allowSmsNotifications || subscription.plan.maxSmsPerMonth <= 0) {
                console.log('[v0] SMS not enabled for plan:', subscription.planId);
                return { available: false, remaining: 0, limit: subscription.plan.maxSmsPerMonth };
            }
            const now = new Date();
            let creditBalance = subscription.smsCreditBalance;
            // Roll over to a fresh monthly allotment if the reset date has passed,
            // or if this is the first check ever for this subscription.
            if (!subscription.usageResetDate || subscription.usageResetDate < now) {
                creditBalance = subscription.plan.maxSmsPerMonth;
                await prisma_1.default.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        smsUsedThisMonth: 0,
                        smsCreditBalance: creditBalance,
                        usageResetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
                    },
                });
            }
            console.log('[v0] SMS quota check - Balance:', creditBalance, 'Limit:', subscription.plan.maxSmsPerMonth);
            return {
                available: creditBalance > 0,
                remaining: Math.max(0, creditBalance),
                limit: subscription.plan.maxSmsPerMonth,
            };
        }
        catch (error) {
            console.error('[v0] Error checking SMS quota:', error);
            return { available: false, remaining: 0, limit: 0 };
        }
    }
    /**
     * Decrement quota after a successful send. Call this only once the SMS
     * gateway has confirmed the message was actually sent.
     */
    async incrementSmsUsage(businessId, count = 1) {
        try {
            const subscription = await prisma_1.default.subscription.findUnique({ where: { businessId } });
            if (!subscription) {
                console.log('[v0] Subscription not found for SMS usage increment');
                return false;
            }
            await prisma_1.default.subscription.update({
                where: { id: subscription.id },
                data: {
                    smsUsedThisMonth: subscription.smsUsedThisMonth + count,
                    smsCreditBalance: Math.max(0, subscription.smsCreditBalance - count),
                },
            });
            return true;
        }
        catch (error) {
            console.error('[v0] Error incrementing SMS usage:', error);
            return false;
        }
    }
    /**
     * Log every send attempt — successful or failed. This is the ONLY place
     * that writes to SMSLog.
     */
    async logSmsAttempt(data) {
        try {
            let subscriptionId;
            if (data.businessId) {
                const subscription = await prisma_1.default.subscription.findUnique({
                    where: { businessId: data.businessId },
                    select: { id: true },
                });
                subscriptionId = subscription?.id;
            }
            await prisma_1.default.sMSLog.create({
                data: {
                    businessId: data.businessId,
                    subscriptionId,
                    phoneNumber: data.phoneNumber,
                    message: data.message,
                    type: data.type,
                    status: data.status,
                    messageId: data.messageId,
                    errorMessage: data.errorMessage,
                    provider: 'SPARROW',
                },
            });
        }
        catch (error) {
            console.error('[v0] Error logging SMS attempt:', error);
        }
    }
    /**
     * Paginated SMS log list — ALWAYS scoped to a single business. Never
     * expose an endpoint that queries SMSLog without a businessId filter,
     * or one business owner could read another's SMS history.
     */
    async getLogs(businessId, filters) {
        const where = { businessId };
        if (filters.phoneNumber)
            where.phoneNumber = filters.phoneNumber;
        if (filters.type)
            where.type = filters.type;
        if (filters.status)
            where.status = filters.status;
        const [logs, total] = await Promise.all([
            prisma_1.default.sMSLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: filters.limit ?? 50,
                skip: filters.offset ?? 0,
            }),
            prisma_1.default.sMSLog.count({ where }),
        ]);
        return { logs, total };
    }
    async getLogsByPhone(businessId, phoneNumber) {
        const formatted = formatPhoneNumber(phoneNumber);
        return prisma_1.default.sMSLog.findMany({
            where: { businessId, phoneNumber: formatted },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    /**
     * Aggregate send/fail counts, scoped to one business, optionally
     * bounded by a date range.
     */
    async getStatistics(businessId, startDate, endDate) {
        const where = { businessId };
        if (startDate || endDate) {
            where.createdAt = {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
            };
        }
        const [total, sent, failed, byType] = await Promise.all([
            prisma_1.default.sMSLog.count({ where }),
            prisma_1.default.sMSLog.count({ where: { ...where, status: 'SENT' } }),
            prisma_1.default.sMSLog.count({ where: { ...where, status: 'FAILED' } }),
            prisma_1.default.sMSLog.groupBy({ by: ['type'], where, _count: { id: true } }),
        ]);
        return {
            total,
            sent,
            failed,
            successRate: total > 0 ? ((sent / total) * 100).toFixed(2) + '%' : '0%',
            byType: byType.map((t) => ({ type: t.type, count: t._count.id })),
        };
    }
    /**
     * SMS usage stats for a business's dashboard.
     */
    async getSmsUsageStats(businessId) {
        try {
            const subscription = await prisma_1.default.subscription.findUnique({
                where: { businessId },
                include: { plan: true },
            });
            if (!subscription)
                return null;
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const logs = await prisma_1.default.sMSLog.findMany({
                where: { businessId, createdAt: { gte: monthStart } },
                select: { type: true, status: true, createdAt: true },
            });
            const byType = {
                owner_notification: logs.filter((l) => l.type === 'owner_notification').length,
                booking: logs.filter((l) => l.type === 'booking').length,
                reminder: logs.filter((l) => l.type === 'reminder').length,
                verification: logs.filter((l) => l.type === 'verification').length,
                status_change: logs.filter((l) => l.type === 'status_change').length,
            };
            return {
                plan: {
                    name: subscription.plan.displayName,
                    maxSmsPerMonth: subscription.plan.maxSmsPerMonth,
                    allowSms: subscription.plan.allowSmsNotifications,
                },
                usage: {
                    used: subscription.smsUsedThisMonth,
                    remaining: subscription.smsCreditBalance,
                    limit: subscription.plan.maxSmsPerMonth,
                    percentageUsed: subscription.plan.maxSmsPerMonth > 0
                        ? Math.round((subscription.smsUsedThisMonth / subscription.plan.maxSmsPerMonth) * 100)
                        : 0,
                },
                byType,
                resetDate: subscription.usageResetDate,
                thisMonth: {
                    total: logs.length,
                    successful: logs.filter((l) => l.status === 'SENT').length,
                    failed: logs.filter((l) => l.status === 'FAILED').length,
                },
            };
        }
        catch (error) {
            console.error('[v0] Error getting SMS usage stats:', error);
            return null;
        }
    }
}
exports.default = new SubscriptionSmsService();
