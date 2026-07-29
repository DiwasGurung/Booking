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
exports.staffVerificationService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const crypto_1 = __importDefault(require("crypto"));
const email_service_1 = require("./email.service");
class StaffVerificationService {
    /**
     * Generate a verification token for staff
     */
    generateVerificationToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    /**
     * Send verification email to staff
     */
    sendVerificationEmail(staffId, staffEmail, staffName, businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if staff exists
                const staff = yield prisma_1.default.staff.findUnique({
                    where: { id: staffId },
                    include: { business: true },
                });
                if (!staff) {
                    throw new Error('Staff not found');
                }
                // Generate verification token
                const verificationToken = this.generateVerificationToken();
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
                // Update staff with verification token
                yield prisma_1.default.staff.update({
                    where: { id: staffId },
                    data: {
                        verificationToken,
                        verificationTokenExpiresAt: expiresAt,
                    },
                });
                // Send verification email to staff
                yield email_service_1.emailService.sendStaffVerificationEmail(staffEmail, staffName, verificationToken, staff.business.name);
                console.log(`[v0] Verification email sent to ${staffEmail}`);
                return { success: true, message: 'Verification email sent' };
            }
            catch (error) {
                console.error('[v0] Error sending verification email:', error);
                throw error;
            }
        });
    }
    /**
     * Verify staff email with token
     */
    verifyEmail(token, staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const staff = yield prisma_1.default.staff.findUnique({
                    where: { id: staffId },
                });
                if (!staff) {
                    throw new Error('Staff not found');
                }
                if (staff.verificationToken !== token) {
                    throw new Error('Invalid verification token');
                }
                if (!staff.verificationTokenExpiresAt || staff.verificationTokenExpiresAt < new Date()) {
                    throw new Error('Verification token expired');
                }
                // Mark email as verified
                yield prisma_1.default.staff.update({
                    where: { id: staffId },
                    data: {
                        emailVerified: true,
                        verificationToken: null,
                        verificationTokenExpiresAt: null,
                    },
                });
                console.log(`[v0] Email verified for staff ${staffId}`);
                return { success: true, message: 'Email verified successfully' };
            }
            catch (error) {
                console.error('[v0] Error verifying email:', error);
                throw error;
            }
        });
    }
    /**
     * Resend verification email
     */
    resendVerificationEmail(staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const staff = yield prisma_1.default.staff.findUnique({
                    where: { id: staffId },
                    include: { business: true },
                });
                if (!staff) {
                    throw new Error('Staff not found');
                }
                if (staff.emailVerified) {
                    throw new Error('Email already verified');
                }
                // Check if token exists and is still valid (not expired)
                if (staff.verificationToken && staff.verificationTokenExpiresAt && staff.verificationTokenExpiresAt > new Date()) {
                    console.log('[v0] Using existing verification token for resend');
                    // Send using the existing token
                    yield email_service_1.emailService.sendStaffVerificationEmail(staff.email, staff.firstName, staff.verificationToken, staff.business.name);
                }
                else {
                    // Generate new token and send
                    yield this.sendVerificationEmail(staffId, staff.email, staff.firstName, staff.businessId);
                }
                return { success: true, message: 'Verification email resent' };
            }
            catch (error) {
                console.error('[v0] Error resending verification email:', error);
                throw error;
            }
        });
    }
    /**
     * Get verification status for staff
     */
    getVerificationStatus(staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const staff = yield prisma_1.default.staff.findUnique({
                    where: { id: staffId },
                    select: {
                        id: true,
                        email: true,
                        emailVerified: true,
                        verificationTokenExpiresAt: true,
                        staffCode: true,
                    },
                });
                if (!staff) {
                    throw new Error('Staff not found');
                }
                return {
                    id: staff.id,
                    email: staff.email,
                    emailVerified: staff.emailVerified,
                    verificationTokenExpired: staff.verificationTokenExpiresAt ? staff.verificationTokenExpiresAt < new Date() : false,
                    staffCode: staff.staffCode,
                };
            }
            catch (error) {
                console.error('[v0] Error getting verification status:', error);
                throw error;
            }
        });
    }
}
exports.staffVerificationService = new StaffVerificationService();
