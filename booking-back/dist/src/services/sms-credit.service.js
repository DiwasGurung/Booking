"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const prisma_1 = __importDefault(require("../lib/prisma"));
const subscription_sms_service_1 = __importDefault(require("./subscription-sms.service"));
class SmsCreditService {
    getPackages() {
        return prisma_1.default.smsCreditPackage.findMany({
            where: { active: true },
            orderBy: { sortOrder: 'asc' },
        });
    }
    /** Step 1: create a pending payment for a package. Price comes from the DB, never the client. */
    async createPurchase(businessId, packageId, gateway) {
        const pkg = await prisma_1.default.smsCreditPackage.findFirst({ where: { id: packageId, active: true } });
        if (!pkg)
            throw new Error('SMS package not found');
        return prisma_1.default.payment.create({
            data: {
                businessId,
                gateway,
                transactionId: `SMS-${(0, crypto_1.randomUUID)()}`,
                amount: pkg.priceNPR,
                status: 'pending',
                purpose: 'SMS_CREDITS',
                smsCreditPackageId: pkg.id,
                currency: 'NPR',
                reference: pkg.displayName,
            },
        });
    }
    /**
     * Step 3: call ONLY after the gateway has confirmed the payment server-side.
     * Safe to call repeatedly (callback + redirect + retries): the unique
     * paymentId on the ledger means credits are granted at most once.
     */
    async completePurchase(transactionId) {
        const payment = await prisma_1.default.payment.findUnique({ where: { transactionId } });
        if (!payment)
            throw new Error('Payment not found');
        if (payment.purpose !== 'SMS_CREDITS' || !payment.smsCreditPackageId) {
            throw new Error('Not an SMS credit payment');
        }
        const pkg = await prisma_1.default.smsCreditPackage.findUnique({ where: { id: payment.smsCreditPackageId } });
        if (!pkg)
            throw new Error('SMS package no longer exists');
        const result = await subscription_sms_service_1.default.addCredits(payment.businessId, pkg.credits + pkg.bonusCredits, 'PURCHASE', { description: `Purchased ${pkg.displayName}`, paymentId: payment.id });
        if (payment.status !== 'completed') {
            await prisma_1.default.payment.update({ where: { id: payment.id }, data: { status: 'completed' } });
        }
        return { ...result, credits: pkg.credits + pkg.bonusCredits };
    }
    async failPurchase(transactionId, reason) {
        await prisma_1.default.payment.updateMany({
            where: { transactionId, purpose: 'SMS_CREDITS', status: 'pending' },
            data: { status: 'failed', errorMessage: reason },
        });
    }
}
exports.default = new SmsCreditService();
