"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../lib/prisma"));
const sparrow_sms_service_1 = __importDefault(require("./sparrow-sms.service"));
const CODE_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = 5;
// Abuse guard for ungated (non-business-quota) sends — account verification,
// login OTPs, password resets. A business-scoped Booking send is instead
// bounded by that business's SMS quota, so this cap doesn't apply to it.
const MAX_CODES_PER_DESTINATION_PER_DAY = 10;
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
class VerificationService {
    /**
     * Generate and send an OTP for any entity/purpose pair.
     *
     * businessId: pass this when the entity being verified is tied to a
     * specific business's paid SMS quota (currently: BOOKING). Omit it for
     * account-level verification (USER, STAFF, BUSINESS) — those are core
     * auth flows and shouldn't be blocked by, or drain, a business's plan.
     */
    async sendCode(params) {
        const { entityType, entityId, destination, purpose, businessId } = params;
        const latest = await prisma_1.default.verificationCode.findFirst({
            where: { entityType, entityId, purpose, consumedAt: null },
            orderBy: { sentAt: 'desc' },
        });
        if (latest) {
            const elapsedSeconds = (Date.now() - latest.sentAt.getTime()) / 1000;
            if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
                const retryAfterSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsedSeconds);
                return { success: false, error: `Please wait ${retryAfterSeconds}s before requesting another code`, code: 'COOLDOWN', retryAfterSeconds };
            }
        }
        if (!businessId) {
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const countToday = await prisma_1.default.verificationCode.count({
                where: { destination, purpose, sentAt: { gte: since } },
            });
            if (countToday >= MAX_CODES_PER_DESTINATION_PER_DAY) {
                return { success: false, error: 'Too many verification codes requested for this number today', code: 'RATE_LIMITED' };
            }
        }
        const otp = generateCode();
        const smsResult = businessId
            ? await sparrow_sms_service_1.default.sendVerificationCode(businessId, destination, otp)
            : await sparrow_sms_service_1.default.sendAccountVerificationCode(destination, otp);
        if (!smsResult.success) {
            return { success: false, error: smsResult.error || 'Failed to send SMS', code: 'SEND_FAILED' };
        }
        await prisma_1.default.verificationCode.create({
            data: {
                entityType,
                entityId,
                channel: 'SMS',
                purpose,
                destination,
                code: otp,
                expiresAt: new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000),
            },
        });
        return { success: true };
    }
    /**
     * Check a submitted code against the latest unconsumed code for this
     * entity/purpose. Does NOT flip any "isVerified" flag — the caller
     * (via the resolver map) owns that, since only the caller knows which
     * model and field represents "verified" for this entity type.
     */
    async verifyCode(params) {
        const { entityType, entityId, purpose, code } = params;
        const record = await prisma_1.default.verificationCode.findFirst({
            where: { entityType, entityId, purpose, consumedAt: null },
            orderBy: { sentAt: 'desc' },
        });
        if (!record)
            return { success: false, error: 'No verification code was requested', code: 'NO_CODE' };
        if (record.expiresAt < new Date())
            return { success: false, error: 'Code expired — please request a new one', code: 'EXPIRED' };
        if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
            return { success: false, error: 'Too many incorrect attempts — please request a new code', code: 'TOO_MANY_ATTEMPTS' };
        }
        if (record.code !== code.trim()) {
            const updated = await prisma_1.default.verificationCode.update({
                where: { id: record.id },
                data: { attempts: { increment: 1 } },
            });
            return {
                success: false,
                error: 'Incorrect code',
                code: 'INVALID_CODE',
                attemptsRemaining: Math.max(0, MAX_VERIFY_ATTEMPTS - updated.attempts),
            };
        }
        await prisma_1.default.verificationCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
        return { success: true };
    }
}
exports.default = new VerificationService();
