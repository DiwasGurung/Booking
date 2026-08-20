"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../lib/prisma"));
class ServiceService {
    /**
     * Get all services
     */
    async getAllServices() {
        return await prisma_1.default.service.findMany({
            include: {
                business: true,
            },
        });
    }
    /**
     * Get service by ID
     */
    async getServiceById(id) {
        return await prisma_1.default.service.findUnique({
            where: { id },
            include: {
                business: true,
            },
        });
    }
    /**
     * Get services by business ID
     */
    async getServicesByBusinessId(businessId) {
        return await prisma_1.default.service.findMany({
            where: { businessId },
            include: {
                business: true,
            },
        });
    }
    /**
     * Create service
     */
    async createService(data) {
        return await prisma_1.default.service.create({
            data,
            include: {
                business: true,
            },
        });
    }
    /**
     * Update service
     */
    async updateService(id, data) {
        return await prisma_1.default.service.update({
            where: { id },
            data,
            include: {
                business: true,
            },
        });
    }
    /**
     * Delete service
     */
    async deleteService(id) {
        return await prisma_1.default.service.delete({
            where: { id },
        });
    }
    /**
       * Get active services for a business
       */
    async getActiveServices(businessId) {
        return await prisma_1.default.service.findMany({
            where: { businessId },
            include: {
                business: true,
                staffServices: {
                    include: {
                        staff: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    /**
     * Get services with booking statistics for a business
     */
    async getServicesWithStats(businessId) {
        const services = await prisma_1.default.service.findMany({
            where: { businessId },
            include: {
                business: true,
                _count: {
                    select: {
                        bookings: true,
                        staffServices: true,
                    },
                },
            },
        });
        // Enrich with stats
        return services.map(service => ({
            ...service,
            stats: {
                totalBookings: service._count.bookings,
                staffCount: service._count.staffServices,
                revenue: 0, // Can be calculated from bookings if needed
            },
        }));
    }
}
exports.default = new ServiceService();
