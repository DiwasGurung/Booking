"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessService = void 0;
const prisma_1 = require("../lib/prisma");
class BusinessService {
    /**
     * Create a new business
     */
    async createBusiness(data) {
        return prisma_1.prisma.business.create({
            data,
        });
    }
    /**
     * Get business by ID
     */
    async getBusinessById(id) {
        return prisma_1.prisma.business.findUnique({
            where: { id },
            include: {
                user: true,
                services: true,
                hours: true,
            },
        });
    }
    /**
     * Get business by user ID
     */
    async getBusinessByUserId(userId) {
        return prisma_1.prisma.business.findUnique({
            where: { userId },
            include: {
                user: true,
                services: true,
                hours: true,
            },
        });
    }
    /**
     * Update business
     */
    async updateBusiness(id, data) {
        return prisma_1.prisma.business.update({
            where: { id },
            data,
        });
    }
    /**
     * Delete business
     */
    async deleteBusiness(id) {
        return prisma_1.prisma.business.delete({
            where: { id },
        });
    }
    /**
     * Get all businesses with pagination
     */
    async getAllBusinesses(page = 1, limit = 10, category, isActive) {
        const skip = (page - 1) * limit;
        const where = {};
        if (category)
            where.category = category;
        if (isActive !== undefined)
            where.isActive = isActive;
        const [businesses, total] = await Promise.all([
            prisma_1.prisma.business.findMany({
                where,
                skip,
                take: limit,
                include: { user: true },
                orderBy: { createdAt: "desc" },
            }),
            prisma_1.prisma.business.count({ where }),
        ]);
        return { businesses, total };
    }
    /**
     * Get business statistics
     */
    async getBusinessStats(businessId) {
        const [totalBookings, totalRevenue, completedBookings, averageRating] = await Promise.all([
            prisma_1.prisma.booking.count({
                where: { businessId },
            }),
            prisma_1.prisma.payment.aggregate({
                where: { businessId, status: "COMPLETED" },
                _sum: { amount: true },
            }),
            prisma_1.prisma.booking.count({
                where: { businessId, status: "COMPLETED" },
            }),
            prisma_1.prisma.business.findUnique({
                where: { id: businessId },
                select: { rating: true },
            }),
        ]);
        return {
            totalBookings,
            totalRevenue: totalRevenue._sum.amount || 0,
            completedBookings,
            averageRating: averageRating?.rating || 0,
            conversionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
        };
    }
    /**
     * Get monthly revenue
     */
    async getMonthlyRevenue(businessId, months = 6) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);
        const payments = await prisma_1.prisma.payment.findMany({
            where: {
                businessId,
                status: "COMPLETED",
                createdAt: { gte: startDate },
            },
            select: { amount: true, createdAt: true },
        });
        // Group by month
        const monthlyData = {};
        payments.forEach((payment) => {
            const monthKey = payment.createdAt.toISOString().slice(0, 7);
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + payment.amount;
        });
        return monthlyData;
    }
    /**
     * Search businesses
     */
    async searchBusinesses(query, limit = 10) {
        return prisma_1.prisma.business.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                    { category: { contains: query, mode: "insensitive" } },
                ],
            },
            take: limit,
            include: { user: true },
        });
    }
}
exports.BusinessService = BusinessService;
exports.default = new BusinessService();
