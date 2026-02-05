"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceService = void 0;
const prisma_1 = require("../lib/prisma");
class ServiceService {
    /**
     * Create a new service
     */
    async createService(data) {
        return prisma_1.prisma.service.create({
            data,
        });
    }
    /**
     * Get service by ID
     */
    async getServiceById(id) {
        return prisma_1.prisma.service.findUnique({
            where: { id },
        });
    }
    /**
     * Get all services for a business
     */
    async getBusinessServices(businessId) {
        return prisma_1.prisma.service.findMany({
            where: { businessId },
            orderBy: { createdAt: "desc" },
        });
    }
    /**
     * Update service
     */
    async updateService(id, data) {
        return prisma_1.prisma.service.update({
            where: { id },
            data,
        });
    }
    /**
     * Delete service
     */
    async deleteService(id) {
        return prisma_1.prisma.service.delete({
            where: { id },
        });
    }
    /**
     * Get all active services for a business
     */
    async getActiveServices(businessId) {
        return prisma_1.prisma.service.findMany({
            where: { businessId, isActive: true },
            orderBy: { name: "asc" },
        });
    }
    /**
     * Get services with booking stats
     */
    async getServicesWithStats(businessId) {
        return prisma_1.prisma.service.findMany({
            where: { businessId },
            include: {
                _count: {
                    select: { bookings: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
}
exports.ServiceService = ServiceService;
exports.default = new ServiceService();
