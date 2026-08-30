"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const email_service_1 = require("./email.service");
const crypto_1 = __importDefault(require("crypto"));
exports.userService = {
    // Create a new user
    async createUser(data) {
        // Password is already hashed by the controller
        // Do NOT hash it again here
        return prisma_1.default.user.create({
            data: {
                ...data,
                role: data.role || "CUSTOMER",
                authProvider: data.authProvider || "EMAIL",
            },
            include: {
                business: true,
            },
        });
    },
    // Get user by ID
    async findById(id) {
        return prisma_1.default.user.findUnique({
            where: { id },
            include: {
                business: true,
            },
        });
    },
    // Get user by email
    async findByEmail(email) {
        return prisma_1.default.user.findUnique({
            where: { email },
            include: {
                business: true,
            },
        });
    },
    // Get user by Google ID
    async findByGoogleId(googleId) {
        return prisma_1.default.user.findUnique({
            where: { googleId },
            include: {
                business: true,
            },
        });
    },
    // Find user by email verification token (kept for compatibility)
    async findByVerificationToken(token) {
        return prisma_1.default.user.findUnique({
            where: { emailVerificationCode: token },
            include: {
                business: true,
            },
        });
    },
    // Verify password
    async verifyPassword(password, hashedPassword) {
        if (!hashedPassword) {
            return false;
        }
        return bcrypt_1.default.compare(password, hashedPassword);
    },
    // Link Google to existing user
    async linkGoogleToUser(userId, googleId) {
        return prisma_1.default.user.update({
            where: { id: userId },
            data: {
                googleId,
                authProvider: "GOOGLE",
            },
            include: {
                business: true,
            },
        });
    },
    // Update phone verification status
    async updatePhoneVerification(userId, isVerified, phone) {
        return prisma_1.default.user.update({
            where: { id: userId },
            data: {
                isPhoneVerified: isVerified,
                ...(phone && { phone }),
            },
            include: { business: true },
        });
    },
    // Update email verification
    async updateEmailVerification(userId, isVerified) {
        return prisma_1.default.user.update({
            where: { id: userId },
            data: {
                isEmailVerified: isVerified,
                emailVerificationCode: null,
                emailVerificationCodeExpires: null,
            },
            include: { business: true },
        });
    },
    // Store phone verification code
    async storePhoneVerificationCode(userId, code, expiresAt) {
        return prisma_1.default.user.update({
            where: { id: userId },
            data: {
                phoneVerificationCode: code,
                phoneVerificationCodeExpires: expiresAt,
                phoneVerificationAttempts: 0,
            },
            include: { business: true },
        });
    },
    // Increment phone verification attempts
    async incrementPhoneVerificationAttempts(userId) {
        return prisma_1.default.user.update({
            where: { id: userId },
            data: {
                phoneVerificationAttempts: {
                    increment: 1,
                },
            },
            include: { business: true },
        });
    },
    // Verify phone code
    async verifyPhoneCode(userId, code) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new Error("User not found");
        }
        if (user.phoneVerificationCode !== code) {
            await this.incrementPhoneVerificationAttempts(userId);
            throw new Error("Invalid verification code");
        }
        if (user.phoneVerificationCodeExpires && user.phoneVerificationCodeExpires < new Date()) {
            throw new Error("Verification code expired");
        }
        if (user.phoneVerificationAttempts >= 5) {
            throw new Error("Too many failed attempts");
        }
        // Code is valid, mark phone as verified
        return prisma_1.default.user.update({
            where: { id: userId },
            data: {
                isPhoneVerified: true,
                phoneVerificationCode: null,
                phoneVerificationCodeExpires: null,
                phoneVerificationAttempts: 0,
            },
            include: { business: true },
        });
    },
    // Update user
    async updateUser(id, data) {
        return prisma_1.default.user.update({
            where: { id },
            data,
            include: {
                business: true,
            },
        });
    },
    // Update user role
    async updateUserRole(userId, role) {
        return prisma_1.default.user.update({
            where: { id: userId },
            data: { role },
            include: {
                business: true,
            },
        });
    },
    // Delete user
    async deleteUser(id) {
        return prisma_1.default.user.delete({
            where: { id },
        });
    },
    // Get all users with pagination
    async getAllUsers(page = 1, limit = 10, role) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            prisma_1.default.user.findMany({
                where: role ? { role } : {},
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    business: true,
                },
            }),
            prisma_1.default.user.count({
                where: role ? { role } : {},
            }),
        ]);
        return { users, total };
    },
    // Update user password
    async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        return prisma_1.default.user.update({
            where: { id },
            data: { password: hashedPassword },
            include: {
                business: true,
            },
        });
    },
    // Get verified users (both email and phone verified)
    async getVerifiedUsers(limit = 100) {
        return prisma_1.default.user.findMany({
            where: {
                isEmailVerified: true,
                isPhoneVerified: true,
            },
            take: limit,
            include: {
                business: true,
            },
        });
    },
    async requestPasswordReset(email) {
        const user = await prisma_1.default.user.findUnique({ where: { email: email.toLowerCase() } });
        const message = 'If an account exists, a reset link has been sent to the email';
        if (!user)
            return { message };
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetToken,
                passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });
        await email_service_1.emailService.sendPasswordResetEmail(user.email, resetToken, 'business');
        return { message };
    },
    async resetPassword(resetToken, newPassword) {
        if (newPassword.length < 8)
            throw new Error('Password must be at least 8 characters long');
        const user = await prisma_1.default.user.findFirst({
            where: { passwordResetToken: resetToken, passwordResetExpiresAt: { gt: new Date() } },
        });
        if (!user)
            throw new Error('Invalid or expired reset token');
        const password = await bcrypt_1.default.hash(newPassword, 10);
        return prisma_1.default.user.update({
            where: { id: user.id },
            data: { password, passwordResetToken: null, passwordResetExpiresAt: null },
            select: { id: true, email: true, firstName: true },
        });
    },
    // Get users needing SMS notifications
    async getUsersForSmsNotification(limit = 100) {
        return prisma_1.default.user.findMany({
            where: {
                isPhoneVerified: true,
                phone: {
                    not: null,
                },
            },
            take: limit,
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
            },
        });
    },
};
