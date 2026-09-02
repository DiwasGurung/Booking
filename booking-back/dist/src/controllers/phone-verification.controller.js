"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationController = void 0;
const phone_verification_service_1 = __importDefault(require("../services/phone-verification.service"));
const verification_resolvers_1 = require("../services/verification-resolvers");
const SEND_ERROR_STATUS = {
    COOLDOWN: 429,
    RATE_LIMITED: 429,
    SEND_FAILED: 502,
};
const VERIFY_ERROR_STATUS = {
    NO_CODE: 400,
    EXPIRED: 410,
    TOO_MANY_ATTEMPTS: 429,
    INVALID_CODE: 400,
};
function parseEntityType(raw) {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value)
        return null;
    const upper = value.toUpperCase();
    return upper in verification_resolvers_1.entityResolvers ? upper : null;
}
function getParamValue(raw) {
    return Array.isArray(raw) ? raw[0] || '' : raw || '';
}
exports.VerificationController = {
    async sendCode(req, res) {
        const entityType = parseEntityType(req.params.entityType);
        const entityId = getParamValue(req.params.entityId);
        const purpose = (req.body?.purpose || 'PHONE_VERIFICATION');
        if (!entityType)
            return res.status(400).json({ success: false, error: 'Unsupported entity type' });
        const resolver = verification_resolvers_1.entityResolvers[entityType];
        if (await resolver.isAlreadyVerified(entityId)) {
            return res.status(400).json({ success: false, error: 'Already verified' });
        }
        const destination = await resolver.getDestination(entityId);
        if (!destination) {
            return res.status(404).json({ success: false, error: 'No phone number on file for this record' });
        }
        const businessId = resolver.getBusinessId ? await resolver.getBusinessId(entityId) : undefined;
        const result = await phone_verification_service_1.default.sendCode({ entityType, entityId, destination, purpose, businessId });
        if (!result.success) {
            return res.status(SEND_ERROR_STATUS[result.code] || 400).json({
                success: false,
                error: result.error,
                ...('retryAfterSeconds' in result ? { retryAfterSeconds: result.retryAfterSeconds } : {}),
            });
        }
        res.json({ success: true, message: 'Verification code sent' });
    },
    async verifyCode(req, res) {
        const entityType = parseEntityType(req.params.entityType);
        const entityId = getParamValue(req.params.entityId);
        const purpose = (req.body?.purpose || 'PHONE_VERIFICATION');
        const { code } = req.body;
        if (!entityType)
            return res.status(400).json({ success: false, error: 'Unsupported entity type' });
        if (!code || typeof code !== 'string')
            return res.status(400).json({ success: false, error: 'Code is required' });
        const resolver = verification_resolvers_1.entityResolvers[entityType];
        if (await resolver.isAlreadyVerified(entityId)) {
            return res.json({ success: true, alreadyVerified: true });
        }
        const result = await phone_verification_service_1.default.verifyCode({ entityType, entityId, purpose, code });
        if (!result.success) {
            return res.status(VERIFY_ERROR_STATUS[result.code] || 400).json({
                success: false,
                error: result.error,
                ...('attemptsRemaining' in result ? { attemptsRemaining: result.attemptsRemaining } : {}),
            });
        }
        await resolver.markVerified(entityId);
        res.json({ success: true, message: 'Verified successfully' });
    },
};
exports.default = exports.VerificationController;
