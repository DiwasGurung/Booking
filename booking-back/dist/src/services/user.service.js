"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
exports.userService = {
    // Create a new user
    async createUser(data) {
        return prisma_1.prisma.user.create({
            data: {
                ...data,
                role: data.role || "CUSTOMER",
                password: data.password,
                authProvider: data.authProvider || "EMAIL",
            },
            include: {
                business: true,
            },
        });
    },
    // Get user by ID
    async findById(id) {
        return prisma_1.prisma.user.findUnique({
            where: { id },
            include: {
                business: true,
            },
        });
    },
    // Get user by email
    async findByEmail(email) {
        return prisma_1.prisma.user.findUnique({
            where: { email },
            include: {
                business: true,
            },
        });
    },
    // Get user by Google ID
    async findByGoogleId(googleId) {
        return prisma_1.prisma.user.findUnique({
            where: { googleId },
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
        return prisma_1.prisma.user.update({
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
    // Update user
    async updateUser(id, data) {
        return prisma_1.prisma.user.update({
            where: { id },
            data,
            include: {
                business: true,
            },
        });
    },
    // Update user role
    async updateUserRole(userId, role) {
        return prisma_1.prisma.user.update({
            where: { id: userId },
            data: { role },
            include: {
                business: true,
            },
        });
    },
    // Delete user
    async deleteUser(id) {
        return prisma_1.prisma.user.delete({
            where: { id },
        });
    },
    // Get all users with pagination
    async getAllUsers(page = 1, limit = 10, role) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where: role ? { role } : {},
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    business: true,
                },
            }),
            prisma_1.prisma.user.count({
                where: role ? { role } : {},
            }),
        ]);
        return { users, total };
    },
    // Update user password
    async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        return prisma_1.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
            include: {
                business: true,
            },
        });
    },
};
