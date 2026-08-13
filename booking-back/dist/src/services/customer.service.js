"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
class CustomerService {
    /**
     * Create a new customer
     */
    async createCustomer(data) {
        return prisma_js_1.default.customer.create({
            data,
        });
    }
    /**
     * Get customer by ID
     */
    async getCustomerById(id) {
        return prisma_js_1.default.customer.findUnique({
            where: { id },
            include: {
                bookings: true,
            },
        });
    }
    /**
     * Get all customers for a business
     */
    async getBusinessCustomers(businessId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [customers, total] = await Promise.all([
            prisma_js_1.default.customer.findMany({
                where: { businessId },
                skip,
                take: limit,
                include: { _count: { select: { bookings: true } } },
                orderBy: { lastVisit: "desc" },
            }),
            prisma_js_1.default.customer.count({ where: { businessId } }),
        ]);
        return { customers, total };
    }
    /**
     * Update customer
     */
    async updateCustomer(id, data) {
        return prisma_js_1.default.customer.update({
            where: { id },
            data,
        });
    }
    /**
     * Delete customer
     */
    async deleteCustomer(id) {
        return prisma_js_1.default.customer.delete({
            where: { id },
        });
    }
    /**
     * Get or create customer
     */
    async getOrCreateCustomer(data) {
        return prisma_js_1.default.customer.upsert({
            where: {
                businessId_email: {
                    businessId: data.businessId,
                    email: data.email,
                },
            },
            update: {
                name: data.name,
                phone: data.phone,
            },
            create: data,
        });
    }
    async getCustomerStats(customerId) {
        const customer = await prisma_js_1.default.customer.findUnique({
            where: { id: customerId },
            include: {
                bookings: true,
            },
        });
        if (!customer)
            throw new Error('Customer not found');
        const completedBookings = customer.bookings.filter((b) => b.status === 'COMPLETED');
        const cancelledBookings = customer.bookings.filter((b) => b.status === 'CANCELLED');
        const pendingBookings = customer.bookings.filter((b) => b.status === 'PENDING');
        return {
            totalBookings: customer.bookings.length,
            completedBookings: completedBookings.length,
            pendingBookings: pendingBookings.length,
            cancelledBookings: cancelledBookings.length,
            lastVisit: customer.lastVisit,
        };
    }
    /**
     * Search customers
     */
    async searchCustomers(businessId, query, limit = 10) {
        return prisma_js_1.default.customer.findMany({
            where: {
                businessId,
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } },
                    { phone: { contains: query, mode: "insensitive" } },
                ],
            },
            take: limit,
        });
    }
}
exports.CustomerService = CustomerService;
exports.default = new CustomerService();
