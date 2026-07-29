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
exports.staffAuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;
class StaffAuthService {
    /**
     * Hash a password
     */
    hashPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            return bcrypt_1.default.hash(password, SALT_ROUNDS);
        });
    }
    /**
     * Compare password with hash
     */
    comparePassword(password, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            return bcrypt_1.default.compare(password, hash);
        });
    }
    /**
     * Set password for staff after email verification
     */
    setPassword(staffId, password) {
        return __awaiter(this, void 0, void 0, function* () {
            if (password.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }
            const hashedPassword = yield this.hashPassword(password);
            const staff = yield prisma_1.default.staff.update({
                where: { id: staffId },
                data: {
                    password: hashedPassword,
                    emailVerified: true,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    businessId: true,
                },
            });
            return staff;
        });
    }
    /**
     * Login staff with email and password
     */
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const staff = yield prisma_1.default.staff.findFirst({
                where: {
                    email: email.toLowerCase(),
                    isActive: true,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    password: true,
                    businessId: true,
                    emailVerified: true,
                    avatar: true,
                    role: true,
                },
            });
            if (!staff) {
                throw new Error('Staff member not found');
            }
            if (!staff.emailVerified) {
                throw new Error('Email not verified. Please verify your email first.');
            }
            if (!staff.password) {
                throw new Error('Password not set. Please check your email for setup instructions.');
            }
            const isPasswordValid = yield this.comparePassword(password, staff.password);
            if (!isPasswordValid) {
                throw new Error('Invalid password');
            }
            // Generate JWT token
            const token = this.generateToken({
                staffId: staff.id,
                email: staff.email,
                businessId: staff.businessId,
            });
            return {
                token,
                staff: {
                    id: staff.id,
                    email: staff.email,
                    firstName: staff.firstName,
                    lastName: staff.lastName,
                    avatar: staff.avatar,
                    role: staff.role,
                    businessId: staff.businessId,
                },
            };
        });
    }
    /**
     * Generate JWT token
     */
    generateToken(payload) {
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
            expiresIn: '7d',
        });
    }
    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
    /**
     * Request password reset
     */
    requestPasswordReset(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const staff = yield prisma_1.default.staff.findFirst({
                where: { email: email.toLowerCase() },
                select: { id: true, email: true, firstName: true, businessId: true, business: { select: { name: true } } },
            });
            if (!staff) {
                // Don't reveal if email exists for security
                return { message: 'If an account exists, a reset link has been sent' };
            }
            // Generate reset token
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
            yield prisma_1.default.staff.update({
                where: { id: staff.id },
                data: {
                    passwordResetToken: resetToken,
                    passwordResetExpiresAt: resetTokenExpiry,
                },
            });
            // TODO: Send password reset email
            console.log('[v0] Password reset token generated for:', email);
            return { message: 'If an account exists, a reset link has been sent' };
        });
    }
    /**
     * Reset password with token
     */
    resetPassword(resetToken, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            if (newPassword.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }
            const staff = yield prisma_1.default.staff.findFirst({
                where: {
                    passwordResetToken: resetToken,
                    passwordResetExpiresAt: {
                        gt: new Date(),
                    },
                },
            });
            if (!staff) {
                throw new Error('Invalid or expired reset token');
            }
            const hashedPassword = yield this.hashPassword(newPassword);
            const updatedStaff = yield prisma_1.default.staff.update({
                where: { id: staff.id },
                data: {
                    password: hashedPassword,
                    passwordResetToken: null,
                    passwordResetExpiresAt: null,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                },
            });
            return updatedStaff;
        });
    }
    /**
     * Check if staff has password set
     */
    hasPasswordSet(staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            const staff = yield prisma_1.default.staff.findUnique({
                where: { id: staffId },
                select: { password: true },
            });
            return !!(staff === null || staff === void 0 ? void 0 : staff.password);
        });
    }
}
exports.staffAuthService = new StaffAuthService();
