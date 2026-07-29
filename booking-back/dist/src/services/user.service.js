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
exports.userService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
exports.userService = {
    // Create a new user
    createUser(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Password is already hashed by the controller
            // Do NOT hash it again here
            return prisma_1.default.user.create({
                data: Object.assign(Object.assign({}, data), { role: data.role || "CUSTOMER", authProvider: data.authProvider || "EMAIL" }),
                include: {
                    business: true,
                },
            });
        });
    },
    // Get user by ID
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.user.findUnique({
                where: { id },
                include: {
                    business: true,
                },
            });
        });
    },
    // Get user by email
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.user.findUnique({
                where: { email },
                include: {
                    business: true,
                },
            });
        });
    },
    // Get user by Google ID
    findByGoogleId(googleId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.user.findUnique({
                where: { googleId },
                include: {
                    business: true,
                },
            });
        });
    },
    // Find user by email verification token (kept for compatibility)
    findByVerificationToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.user.findUnique({
                where: { emailVerificationCode: token },
                include: {
                    business: true,
                },
            });
        });
    },
    // Verify password
    verifyPassword(password, hashedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!hashedPassword) {
                return false;
            }
            return bcrypt_1.default.compare(password, hashedPassword);
        });
    },
    // Link Google to existing user
    linkGoogleToUser(userId, googleId) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    },
    // Update phone verification status
    updatePhoneVerification(userId, isVerified, phone) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.user.update({
                where: { id: userId },
                data: Object.assign({ isPhoneVerified: isVerified }, (phone && { phone })),
                include: { business: true },
            });
        });
    },
    // Update email verification
    updateEmailVerification(userId, isVerified) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.user.update({
                where: { id: userId },
                data: {
                    isEmailVerified: isVerified,
                    emailVerificationCode: null,
                    emailVerificationCodeExpires: null,
                },
                include: { business: true },
            });
        });
    },
    // Store phone verification code
    storePhoneVerificationCode(userId, code, expiresAt) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.user.update({
                where: { id: userId },
                data: {
                    phoneVerificationCode: code,
                    phoneVerificationCodeExpires: expiresAt,
                    phoneVerificationAttempts: 0,
                },
                include: { business: true },
            });
        });
    },
    // Increment phone verification attempts
    incrementPhoneVerificationAttempts(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.user.update({
                where: { id: userId },
                data: {
                    phoneVerificationAttempts: {
                        increment: 1,
                    },
                },
                include: { business: true },
            });
        });
    },
    // Verify phone code
    verifyPhoneCode(userId, code) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma_1.default.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new Error("User not found");
            }
            if (user.phoneVerificationCode !== code) {
                yield this.incrementPhoneVerificationAttempts(userId);
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
        });
    },
    // Update user
    updateUser(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.user.update({
                where: { id },
                data,
                include: {
                    business: true,
                },
            });
        });
    },
    // Update user role
    updateUserRole(userId, role) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.user.update({
                where: { id: userId },
                data: { role },
                include: {
                    business: true,
                },
            });
        });
    },
    // Delete user
    deleteUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.user.delete({
                where: { id },
            });
        });
    },
    // Get all users with pagination
    getAllUsers() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10, role) {
            const skip = (page - 1) * limit;
            const [users, total] = yield Promise.all([
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
        });
    },
    // Update user password
    updatePassword(id, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
            return prisma_1.default.user.update({
                where: { id },
                data: { password: hashedPassword },
                include: {
                    business: true,
                },
            });
        });
    },
    // Get verified users (both email and phone verified)
    getVerifiedUsers() {
        return __awaiter(this, arguments, void 0, function* (limit = 100) {
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
        });
    },
    // Get users needing SMS notifications
    getUsersForSmsNotification() {
        return __awaiter(this, arguments, void 0, function* (limit = 100) {
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
        });
    },
};
