"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
class UserService {
    /**
     * Create a new user
     */
    async createUser(data) {
        const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
        return prisma_1.prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
            },
        });
    }
    /**
     * Get user by ID
     */
    async getUserById(id) {
        return prisma_1.prisma.user.findUnique({
            where: { id },
        });
    }
    /**
     * Get user by email
     */
    async getUserByEmail(email) {
        return prisma_1.prisma.user.findUnique({
            where: { email },
        });
    }
    /**
     * Verify password
     */
    async verifyPassword(password, hashedPassword) {
        return bcrypt_1.default.compare(password, hashedPassword);
    }
    /**
     * Update user
     */
    async updateUser(id, data) {
        return prisma_1.prisma.user.update({
            where: { id },
            data,
        });
    }
    /**
     * Delete user
     */
    async deleteUser(id) {
        return prisma_1.prisma.user.delete({
            where: { id },
        });
    }
    /**
     * Get all users with pagination
     */
    async getAllUsers(page = 1, limit = 10, role) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where: role ? { role } : {},
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma_1.prisma.user.count({
                where: role ? { role } : {},
            }),
        ]);
        return { users, total };
    }
    /**
     * Update user password
     */
    async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        return prisma_1.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
    }
}
exports.UserService = UserService;
exports.default = new UserService();
