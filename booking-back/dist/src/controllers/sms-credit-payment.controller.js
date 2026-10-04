"use strict";
// Controller for buying SMS credit packages with eSewa.
// Mirrors subscription-payment.controller.ts: nothing is persisted until
// eSewa's signed callback AND a server-to-server verification both pass.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSmsEsewaFailure = exports.handleSmsEsewaSuccess = exports.initiateSmsCreditPayment = exports.getSmsTransactions = exports.getSmsBalance = exports.getSmsPackages = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const esewa_service_1 = __importDefault(require("../services/esewa.service"));
const subscription_sms_service_1 = __importDefault(require("../services/subscription-sms.service"));
const FRONTEND_URL = process.env.FRONTEND_URL || '';
const BACKEND_URL = process.env.BACKEND_URL || '';
// Where the user lands after paying. Adjust to your frontend route.
const SMS_PAGE = `${FRONTEND_URL}/dashboard/sms-credits`;
const TX_PREFIX = 'SMS-';
const redirectTo = (res, status, message) => res.redirect(`${SMS_PAGE}?status=${status}&message=${encodeURIComponent(message)}`);
/** Only the logged-in owner of the business may buy credits for it. */
async function ownsBusiness(req, businessId) {
    const userId = req.userId;
    if (!userId)
        return false;
    const b = await prisma_1.default.business.findFirst({
        where: { id: businessId, userId },
        select: { id: true },
    });
    return !!b;
}
/**
 * GET /sms/packages
 */
const getSmsPackages = async (_req, res) => {
    try {
        const packages = await prisma_1.default.smsCreditPackage.findMany({
            where: { active: true },
            orderBy: { sortOrder: 'asc' },
        });
        res.set('Cache-Control', 'no-store');
        return res.json({ success: true, packages });
    }
    catch (error) {
        console.error('[SmsCreditPayment] Get packages error:', error);
        return res.status(500).json({ error: error.message || 'Failed to get SMS packages' });
    }
};
exports.getSmsPackages = getSmsPackages;
/**
 * GET /business/:businessId/sms/balance
 */
const getSmsBalance = async (req, res) => {
    try {
        const businessId = req.params.businessId;
        if (!(await ownsBusiness(req, businessId))) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const stats = await subscription_sms_service_1.default.getSmsUsageStats(businessId);
        return res.json({ success: true, data: stats });
    }
    catch (error) {
        console.error('[SmsCreditPayment] Get balance error:', error);
        return res.status(500).json({ error: error.message || 'Failed to get SMS balance' });
    }
};
exports.getSmsBalance = getSmsBalance;
/**
 * GET /business/:businessId/sms/transactions
 */
const getSmsTransactions = async (req, res) => {
    try {
        const businessId = req.params.businessId;
        if (!(await ownsBusiness(req, businessId))) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
        const offset = Math.max(0, parseInt(req.query.offset) || 0);
        const data = await subscription_sms_service_1.default.getTransactions(businessId, limit, offset);
        return res.json({ success: true, data });
    }
    catch (error) {
        console.error('[SmsCreditPayment] Get transactions error:', error);
        return res.status(500).json({ error: error.message || 'Failed to get transactions' });
    }
};
exports.getSmsTransactions = getSmsTransactions;
/**
 * Initiate an SMS credit purchase with eSewa.
 * The price always comes from the DB package, never from the client.
 */
const initiateSmsCreditPayment = async (req, res) => {
    try {
        const { businessId, packageId } = req.body;
        if (!businessId || !packageId) {
            return res.status(400).json({ error: 'Business ID and Package ID are required' });
        }
        if (!(await ownsBusiness(req, businessId))) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const pkg = await prisma_1.default.smsCreditPackage.findFirst({
            where: { id: packageId, active: true },
        });
        if (!pkg) {
            return res.status(404).json({ error: 'SMS credit package not found' });
        }
        // Reference format: SMS-{businessId}-{packageId}-{timestamp}
        // (cuids contain no hyphens, so splitting on '-' is safe.)
        const transactionUuid = `${TX_PREFIX}${businessId}-${packageId}-${Date.now()}`.replace(/[^A-Za-z0-9-]/g, '');
        const esewaResponse = await esewa_service_1.default.initiatePayment({
            amount: pkg.priceNPR,
            transactionUuid,
            successUrl: `${BACKEND_URL}/api/sms-credits/sms-payment/esewa/success`,
            failureUrl: `${BACKEND_URL}/api/sms-credits/sms-payment/esewa/failure`,
        });
        if (!esewaResponse.success) {
            return res.status(500).json({ error: esewaResponse.message });
        }
        console.log('[SmsCreditPayment] eSewa payment initiated:', {
            transactionUuid,
            amount: pkg.priceNPR,
            package: pkg.name,
            credits: pkg.credits + pkg.bonusCredits,
        });
        return res.json({
            success: true,
            formData: esewaResponse.formData,
            paymentUrl: esewaResponse.paymentUrl,
            package: {
                id: pkg.id,
                displayName: pkg.displayName,
                credits: pkg.credits,
                bonusCredits: pkg.bonusCredits,
                priceNPR: pkg.priceNPR,
            },
        });
    }
    catch (error) {
        console.error('[SmsCreditPayment] Initiation error:', error);
        return res.status(500).json({ error: error.message || 'Failed to initiate payment' });
    }
};
exports.initiateSmsCreditPayment = initiateSmsCreditPayment;
/**
 * eSewa success callback.
 */
const handleSmsEsewaSuccess = async (req, res) => {
    try {
        const { data } = req.query;
        if (!data || typeof data !== 'string') {
            console.error('[SmsCreditPayment] No data in eSewa callback');
            return redirectTo(res, 'error', 'Invalid callback data');
        }
        // 1. Decode + signature check
        const decoded = esewa_service_1.default.decodeEsewaResponse(data);
        if (!decoded.success || !decoded.data) {
            console.error('[SmsCreditPayment] Failed to decode eSewa response');
            return redirectTo(res, 'error', 'Invalid response signature');
        }
        const { transaction_uuid, status, total_amount, transaction_code, product_code } = decoded.data;
        // eSewa can format large amounts with thousands separators ("1,300.0").
        const parsedTotalAmount = Number.parseFloat(String(total_amount).replace(/,/g, ''));
        if (status !== 'COMPLETE' || !Number.isFinite(parsedTotalAmount) || parsedTotalAmount <= 0) {
            return redirectTo(res, 'failed', 'Payment was not completed');
        }
        if (product_code !== esewa_service_1.default.getProductCode()) {
            return redirectTo(res, 'error', 'Invalid product code');
        }
        // 2. Parse our reference
        const parts = transaction_uuid.startsWith(TX_PREFIX)
            ? transaction_uuid.slice(TX_PREFIX.length).split('-')
            : [];
        if (parts.length < 3) {
            return redirectTo(res, 'error', 'Invalid transaction reference');
        }
        const [businessId, packageId] = parts;
        const [business, pkg] = await Promise.all([
            prisma_1.default.business.findUnique({ where: { id: businessId }, select: { id: true } }),
            prisma_1.default.smsCreditPackage.findUnique({ where: { id: packageId } }),
        ]);
        if (!business || !pkg) {
            return redirectTo(res, 'error', 'Business or SMS package not found');
        }
        // 3. Server-to-server verification with eSewa
        const verification = await esewa_service_1.default.verifyPayment(transaction_uuid, parsedTotalAmount);
        if (!verification.success) {
            console.error('[SmsCreditPayment] eSewa verification failed:', verification.message);
            return redirectTo(res, 'error', 'Payment verification failed');
        }
        if (verification.productCode !== product_code || verification.totalAmount !== parsedTotalAmount) {
            return redirectTo(res, 'error', 'Payment amount verification failed');
        }
        // 4. Paid amount must match the package price
        if (pkg.priceNPR !== parsedTotalAmount) {
            console.error('[SmsCreditPayment] Amount mismatch:', { expected: pkg.priceNPR, paid: parsedTotalAmount });
            return redirectTo(res, 'error', 'Payment amount does not match the selected package');
        }
        const creditsToGrant = pkg.credits + pkg.bonusCredits;
        // 5. Create the payment record (transactionId is unique). If the callback
        //    fires twice, reuse the existing record instead of failing.
        let payment = await prisma_1.default.payment.findUnique({ where: { transactionId: transaction_uuid } });
        if (!payment) {
            try {
                payment = await prisma_1.default.payment.create({
                    data: {
                        businessId,
                        gateway: 'ESEWA',
                        transactionId: transaction_uuid,
                        amount: Math.round(parsedTotalAmount * 100), // paisa, same as subscription payments
                        status: 'completed',
                        esewaRefId: transaction_code,
                        esewaProductCode: esewa_service_1.default.getProductCode(),
                        purpose: 'SMS_CREDITS',
                        smsCreditPackageId: pkg.id,
                        reference: pkg.displayName,
                    },
                });
            }
            catch (err) {
                // Concurrent callback created it first (unique violation).
                if (err?.code === 'P2002') {
                    payment = await prisma_1.default.payment.findUnique({ where: { transactionId: transaction_uuid } });
                }
                else {
                    throw err;
                }
            }
        }
        if (!payment || payment.businessId !== businessId) {
            return redirectTo(res, 'error', 'Payment record mismatch');
        }
        // 6. Grant credits. Idempotent on paymentId, so retries and duplicate
        //    callbacks can never double-credit, and a crash between steps 5 and 6
        //    is repaired the next time the callback runs.
        const result = await subscription_sms_service_1.default.addCredits(businessId, creditsToGrant, 'PURCHASE', {
            description: `Purchased ${pkg.displayName}`,
            paymentId: payment.id,
        });
        console.log('[SmsCreditPayment] Credits', result.granted ? 'granted' : 'already granted', {
            businessId,
            credits: creditsToGrant,
            balance: result.balance,
        });
        return redirectTo(res, 'success', result.granted ? `${creditsToGrant} SMS credits added` : 'Payment already processed');
    }
    catch (error) {
        console.error('[SmsCreditPayment] Success callback error:', error);
        return redirectTo(res, 'error', 'An error occurred');
    }
};
exports.handleSmsEsewaSuccess = handleSmsEsewaSuccess;
/**
 * eSewa failure / cancel callback. Nothing was persisted, so nothing to undo.
 */
const handleSmsEsewaFailure = async (req, res) => {
    try {
        console.log('[SmsCreditPayment] eSewa failure callback:', { data: req.query.data });
        return redirectTo(res, 'failed', 'Payment was cancelled or failed');
    }
    catch (error) {
        console.error('[SmsCreditPayment] Failure callback error:', error);
        return redirectTo(res, 'error', 'An error occurred');
    }
};
exports.handleSmsEsewaFailure = handleSmsEsewaFailure;
