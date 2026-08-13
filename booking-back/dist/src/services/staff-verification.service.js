"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffVerificationService = void 0;
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const crypto_1 = __importDefault(require("crypto"));
const email_service_js_1 = require("./email.service.js");
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
    async sendVerificationEmail(staffId, staffEmail, staffName, businessId) {
        try {
            // Check if staff exists
            const staff = await prisma_js_1.default.staff.findUnique({
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
            await prisma_js_1.default.staff.update({
                where: { id: staffId },
                data: {
                    verificationToken,
                    verificationTokenExpiresAt: expiresAt,
                },
            });
            // Send verification email to staff
            await email_service_js_1.emailService.sendStaffVerificationEmail(staffEmail, staffName, verificationToken, staff.business.name);
            return { success: true, message: 'Verification email sent' };
        }
        catch (error) {
            console.error('[v0] Error sending verification email:', error);
            throw error;
        }
    }
    /**
     * Send a fresh first-login verification link by email.
     */
    async requestVerificationEmail(email) {
        const staff = await prisma_js_1.default.staff.findUnique({
            where: { email: email.trim().toLowerCase() },
        });
        if (!staff) {
            return { success: false, status: 'not_found', message: 'No staff account was found for this email address.' };
        }
        if (staff.emailVerified) {
            return { success: true, status: 'already_verified', message: 'This email address is already verified. You can log in or reset your password.' };
        }
        await this.sendVerificationEmail(staff.id, staff.email, staff.firstName, staff.businessId);
        return { success: true, status: 'sent', message: 'Verification email sent. Please check your inbox.' };
    }
    /**
     * Verify staff email with token
     */
    async verifyEmail(token, staffId) {
        try {
            const staff = staffId
                ? await prisma_js_1.default.staff.findUnique({ where: { id: staffId } })
                : await prisma_js_1.default.staff.findUnique({ where: { verificationToken: token } });
            if (!staff) {
                throw new Error('Invalid verification link');
            }
            if (staff.verificationToken !== token) {
                throw new Error('Invalid verification token');
            }
            if (!staff.verificationTokenExpiresAt || staff.verificationTokenExpiresAt < new Date()) {
                throw new Error('Verification token expired');
            }
            // Keep the token until the password is set. The set-password endpoint
            // uses this same token to authorize the first password creation.
            await prisma_js_1.default.staff.update({
                where: { id: staff.id },
                data: { emailVerified: true },
            });
            return { success: true, staffId: staff.id, message: 'Email verified successfully' };
        }
        catch (error) {
            console.error('[v0] Error verifying email:', error);
            throw error;
        }
    }
    /**
     * Resend verification email
     */
    async resendVerificationEmail(staffId, token) {
        try {
            const staff = staffId
                ? await prisma_js_1.default.staff.findUnique({ where: { id: staffId } })
                : token
                    ? await prisma_js_1.default.staff.findUnique({ where: { verificationToken: token } })
                    : null;
            if (!staff) {
                throw new Error('Staff not found for this verification link');
            }
            if (staff.emailVerified) {
                throw new Error('Email already verified');
            }
            // Always rotate the token so an expired or rejected link gets replaced.
            await this.sendVerificationEmail(staff.id, staff.email, staff.firstName, staff.businessId);
            return { success: true, message: 'Verification email resent' };
        }
        catch (error) {
            console.error('[v0] Error resending verification email:', error);
            throw error;
        }
    }
    /**
     * Get verification status for staff
     */
    async getVerificationStatus(staffId) {
        try {
            const staff = await prisma_js_1.default.staff.findUnique({
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
    }
}
exports.staffVerificationService = new StaffVerificationService();
