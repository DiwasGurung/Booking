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
const prisma_1 = __importDefault(require("../lib/prisma"));
class ServiceService {
    /**
     * Get all services
     */
    getAllServices() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.service.findMany({
                include: {
                    business: true,
                },
            });
        });
    }
    /**
     * Get service by ID
     */
    getServiceById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.service.findUnique({
                where: { id },
                include: {
                    business: true,
                },
            });
        });
    }
    /**
     * Get services by business ID
     */
    getServicesByBusinessId(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.service.findMany({
                where: { businessId },
                include: {
                    business: true,
                },
            });
        });
    }
    /**
     * Create service
     */
    createService(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.service.create({
                data,
                include: {
                    business: true,
                },
            });
        });
    }
    /**
     * Update service
     */
    updateService(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.service.update({
                where: { id },
                data,
                include: {
                    business: true,
                },
            });
        });
    }
    /**
     * Delete service
     */
    deleteService(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.service.delete({
                where: { id },
            });
        });
    }
    /**
       * Get active services for a business
       */
    getActiveServices(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.service.findMany({
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
        });
    }
    /**
     * Get services with booking statistics for a business
     */
    getServicesWithStats(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const services = yield prisma_1.default.service.findMany({
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
            return services.map(service => (Object.assign(Object.assign({}, service), { stats: {
                    totalBookings: service._count.bookings,
                    staffCount: service._count.staffServices,
                    revenue: 0, // Can be calculated from bookings if needed
                } })));
        });
    }
}
exports.default = new ServiceService();
