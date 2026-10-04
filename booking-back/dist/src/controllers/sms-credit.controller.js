"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../lib/prisma"));
const sms_credit_service_1 = __importDefault(require("../services/sms-credit.service"));
const subscription_sms_service_1 = __importDefault(require("../services/subscription-sms.service"));
/** Every endpoint is scoped to a business the logged-in user owns. */
async function ownsBusiness(req, businessId) {
    const userId = req.userId;
    if (!userId)
        return false;
    const b = await prisma_1.default.business.findFirst({ where: { id: businessId, userId }, select: { id: true } });
    return !!b;
}
class SmsCreditController {
    async getPackages(_req, res) {
        try {
            res.json({ success: true, data: await sms_credit_service_1.default.getPackages() });
        }
        catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    }
    async getBalance(req, res) {
        const businessId = req.params.businessId;
        if (!(await ownsBusiness(req, businessId))) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const stats = await subscription_sms_service_1.default.getSmsUsageStats(businessId);
        res.json({ success: true, data: stats });
    }
    async getTransactions(req, res) {
        const businessId = req.params.businessId;
        if (!(await ownsBusiness(req, businessId))) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
        const offset = Math.max(0, parseInt(req.query.offset) || 0);
        const data = await subscription_sms_service_1.default.getTransactions(businessId, limit, offset);
        res.json({ success: true, data });
    }
    async initiatePurchase(req, res) {
        try {
            const businessId = req.params.businessId;
            const { packageId, gateway } = req.body;
            if (!(await ownsBusiness(req, businessId))) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
            if (!packageId || (gateway !== 'esewa' && gateway !== 'khalti')) {
                return res.status(400).json({ success: false, message: 'packageId and a valid gateway are required' });
            }
            const payment = await sms_credit_service_1.default.createPurchase(businessId, packageId, gateway);
            // Hand off to the SAME gateway-initiation code you use for subscriptions,
            // passing payment.transactionId and payment.amount (see section 4).
            res.status(201).json({
                success: true,
                data: { paymentId: payment.id, transactionId: payment.transactionId, amount: payment.amount, gateway },
            });
        }
        catch (e) {
            console.error('[v0] SMS purchase initiation failed:', e);
            res.status(500).json({ success: false, message: e.message || 'Failed to start purchase' });
        }
    }
}
exports.default = new SmsCreditController();
