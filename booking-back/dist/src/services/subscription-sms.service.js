"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSmsCredits = calculateSmsCredits;
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
/** 1 credit per SMS segment. ASCII/GSM text = 160 chars (153 when multipart); anything else = 70 (67). */
function calculateSmsCredits(text) {
    const isAscii = /^[\x00-\x7F]*$/.test(text);
    const single = isAscii ? 160 : 70;
    const multi = isAscii ? 153 : 67;
    if (text.length <= single)
        return 1;
    return Math.ceil(text.length / multi);
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
    async getBalance(businessId) {
        const b = await prisma_1.default.business.findUnique({ where: { id: businessId }, select: { smsCredits: true } });
        return b?.smsCredits ?? 0;
    }
    /** Atomically deduct credits. Fails (ok:false) if the balance is too low. */
    async reserveCredits(businessId, credits, description) {
        return prisma_1.default.$transaction(async (tx) => {
            const res = await tx.business.updateMany({
                where: { id: businessId, smsCredits: { gte: credits } },
                data: { smsCredits: { decrement: credits } },
            });
            if (res.count === 0)
                return { ok: false, balance: await this.getBalance(businessId) };
            const { smsCredits } = await tx.business.findUniqueOrThrow({
                where: { id: businessId }, select: { smsCredits: true },
            });
            await tx.smsCreditTransaction.create({
                data: { businessId, type: 'USAGE', amount: -credits, balanceAfter: smsCredits, description },
            });
            return { ok: true, balance: smsCredits };
        });
    }
    /** Return credits after a failed send. */
    async refundCredits(businessId, credits, description) {
        return this.addCredits(businessId, credits, 'REFUND', { description });
    }
    /** Single entry point for every credit increase (purchase, plan grant, bonus, refund, adjustment). */
    async addCredits(businessId, credits, type, opts) {
        return prisma_1.default.$transaction(async (tx) => {
            // Idempotency: one payment can only ever grant credits once.
            if (opts?.paymentId) {
                const existing = await tx.smsCreditTransaction.findUnique({ where: { paymentId: opts.paymentId } });
                if (existing)
                    return { granted: false, balance: existing.balanceAfter };
            }
            const { smsCredits } = await tx.business.update({
                where: { id: businessId },
                data: { smsCredits: { increment: credits } },
                select: { smsCredits: true },
            });
            await tx.smsCreditTransaction.create({
                data: {
                    businessId, type, amount: credits, balanceAfter: smsCredits,
                    description: opts?.description, paymentId: opts?.paymentId,
                },
            });
            return { granted: true, balance: smsCredits };
        });
    }
    async logSmsAttempt(data) {
        const subscription = data.businessId
            ? await prisma_1.default.subscription.findUnique({ where: { businessId: data.businessId }, select: { id: true } })
            : null;
        return prisma_1.default.sMSLog.create({
            data: {
                businessId: data.businessId,
                subscriptionId: subscription?.id,
                phoneNumber: data.phoneNumber,
                message: data.message,
                type: data.type,
                status: data.status,
                messageId: data.messageId,
                errorMessage: data.errorMessage,
                creditsUsed: data.status === 'SENT' ? data.creditsUsed ?? 0 : 0,
            },
        });
    }
    /**
    * Paginated SMS log list, ALWAYS scoped to a single business. Never
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
    /** Aggregate send/fail counts, scoped to one business, optionally date-bounded. */
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
    /** Credit ledger for the business's "credit history" screen. */
    async getTransactions(businessId, limit = 50, offset = 0) {
        const [transactions, total] = await Promise.all([
            prisma_1.default.smsCreditTransaction.findMany({
                where: { businessId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma_1.default.smsCreditTransaction.count({ where: { businessId } }),
        ]);
        return { transactions, total };
    }
    /** SMS usage stats for a business's dashboard (credit-based). */
    async getSmsUsageStats(businessId) {
        try {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const where = { businessId, createdAt: { gte: monthStart } };
            const [balance, logs, creditAgg] = await Promise.all([
                this.getBalance(businessId),
                prisma_1.default.sMSLog.findMany({ where, select: { type: true, status: true } }),
                prisma_1.default.sMSLog.aggregate({ where, _sum: { creditsUsed: true } }),
            ]);
            const byType = {
                owner_notification: 0, booking: 0, reminder: 0, verification: 0, status_change: 0,
            };
            for (const l of logs)
                byType[l.type] = (byType[l.type] ?? 0) + 1;
            return {
                credits: {
                    balance,
                    usedThisMonth: creditAgg._sum.creditsUsed ?? 0,
                },
                byType,
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
