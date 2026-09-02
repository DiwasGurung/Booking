"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const sparrow_sms_service_1 = __importDefault(require("../services/sparrow-sms.service"));
const subscription_sms_service_1 = __importDefault(require("../services/subscription-sms.service"));
/**
 * Resolves the calling user's own business. Every handler below scopes
 * its query/send to this id — never trust a businessId from the request
 * body/query, or one owner could read or send SMS on another's behalf.
 */
async function getOwnedBusinessId(req) {
    if (!req.userId)
        return null;
    const business = await prisma_1.default.business.findUnique({ where: { userId: req.userId } });
    return business?.id ?? null;
}
const VALID_TYPES = ['verification', 'booking', 'reminder', 'status_change', 'owner_notification'];
exports.SmsController = {
    /**
     * Send test SMS
     */
    async sendTest(req, res) {
        try {
            const businessId = await getOwnedBusinessId(req);
            if (!businessId)
                return res.status(403).json({ success: false, error: 'No business found for this account' });
            const { phoneNumber, message } = req.body;
            if (!phoneNumber || !message) {
                return res.status(400).json({ success: false, error: 'Phone number and message are required' });
            }
            const result = await sparrow_sms_service_1.default.sendBulk(businessId, [phoneNumber], message, 'booking');
            res.json({
                success: result.successful > 0,
                message: `SMS ${result.successful > 0 ? 'sent' : 'failed'}`,
                result,
            });
        }
        catch (error) {
            console.error('[v0] Error sending test SMS:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },
    /**
     * Get SMS logs for the logged-in business owner (scoped to their own business only)
     */
    async getLogs(req, res) {
        try {
            const businessId = await getOwnedBusinessId(req);
            if (!businessId)
                return res.status(403).json({ success: false, error: 'No business found for this account' });
            const { phoneNumber, type, status, limit = '50', offset = '0' } = req.query;
            const { logs, total } = await subscription_sms_service_1.default.getLogs(businessId, {
                phoneNumber: phoneNumber,
                type: type,
                status: status,
                limit: parseInt(limit),
                offset: parseInt(offset),
            });
            res.json({ success: true, logs, total, limit: parseInt(limit), offset: parseInt(offset) });
        }
        catch (error) {
            console.error('[v0] Error fetching SMS logs:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },
    /**
     * Get SMS statistics, scoped to the logged-in owner's business
     */
    async getStatistics(req, res) {
        try {
            const businessId = await getOwnedBusinessId(req);
            if (!businessId)
                return res.status(403).json({ success: false, error: 'No business found for this account' });
            const { startDate, endDate } = req.query;
            const stats = await subscription_sms_service_1.default.getStatistics(businessId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            res.json({ success: true, statistics: stats });
        }
        catch (error) {
            console.error('[v0] Error fetching SMS statistics:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },
    /**
     * Get logs by phone number, scoped to the logged-in owner's business
     */
    async getLogsByPhone(req, res) {
        try {
            const businessId = await getOwnedBusinessId(req);
            if (!businessId)
                return res.status(403).json({ success: false, error: 'No business found for this account' });
            const phoneNumberParam = req.params.phoneNumber;
            const phoneNumber = Array.isArray(phoneNumberParam) ? phoneNumberParam[0] : phoneNumberParam;
            if (!phoneNumber)
                return res.status(400).json({ success: false, error: 'Phone number is required' });
            const logs = await subscription_sms_service_1.default.getLogsByPhone(businessId, phoneNumber);
            res.json({ success: true, phoneNumber, logs });
        }
        catch (error) {
            console.error('[v0] Error fetching logs by phone:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },
    /**
     * Send bulk SMS — counts against the owner's own SMS quota
     */
    async sendBulk(req, res) {
        try {
            const businessId = await getOwnedBusinessId(req);
            if (!businessId)
                return res.status(403).json({ success: false, error: 'No business found for this account' });
            const { phoneNumbers, message, type = 'booking' } = req.body;
            if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
                return res.status(400).json({ success: false, error: 'Phone numbers array is required' });
            }
            if (!message)
                return res.status(400).json({ success: false, error: 'Message is required' });
            if (!VALID_TYPES.includes(type)) {
                return res.status(400).json({ success: false, error: `type must be one of: ${VALID_TYPES.join(', ')}` });
            }
            const result = await sparrow_sms_service_1.default.sendBulk(businessId, phoneNumbers, message, type);
            res.json({ success: true, message: `${result.successful} sent, ${result.failed} failed`, result });
        }
        catch (error) {
            console.error('[v0] Error sending bulk SMS:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },
    /**
     * Resend SMS for a specific phone number
     */
    async resendSMS(req, res) {
        try {
            const businessId = await getOwnedBusinessId(req);
            if (!businessId)
                return res.status(403).json({ success: false, error: 'No business found for this account' });
            const { phoneNumber, message, type = 'booking' } = req.body;
            if (!phoneNumber || !message) {
                return res.status(400).json({ success: false, error: 'Phone number and message are required' });
            }
            if (!VALID_TYPES.includes(type)) {
                return res.status(400).json({ success: false, error: `type must be one of: ${VALID_TYPES.join(', ')}` });
            }
            const result = await sparrow_sms_service_1.default.sendBulk(businessId, [phoneNumber], message, type);
            res.json({
                success: result.successful > 0,
                message: result.successful > 0 ? 'SMS sent' : 'SMS failed',
                result: result.results[0],
            });
        }
        catch (error) {
            console.error('[v0] Error resending SMS:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },
    /**
     * Get plan quota / usage summary for the dashboard
     */
    async getUsage(req, res) {
        try {
            const businessId = await getOwnedBusinessId(req);
            if (!businessId)
                return res.status(403).json({ success: false, error: 'No business found for this account' });
            const stats = await subscription_sms_service_1.default.getSmsUsageStats(businessId);
            if (!stats)
                return res.status(404).json({ success: false, error: 'No subscription found' });
            res.json({ success: true, ...stats });
        }
        catch (error) {
            console.error('[v0] Error fetching SMS usage:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },
};
exports.default = exports.SmsController;
