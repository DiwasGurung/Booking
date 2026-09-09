"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class CustomerService {
    /**
     * Create a new customer
     */
    async createCustomer(data) {
        return prisma_1.default.customer.create({
            data,
        });
    }
    /**
     * Enterprise customer observations and visit-frequency loyalty insights.
     */
    async getBusinessInsights(businessId) {
        const customers = await prisma_1.default.customer.findMany({
            where: { businessId },
            select: {
                id: true, name: true, email: true, notes: true,
                bookings: { where: { status: 'COMPLETED' }, select: { startTime: true }, orderBy: { startTime: 'desc' } },
            },
        });
        return customers.map(Customer => {
            const visits = Customer.bookings.length;
            const loyalty = visits >= 10 ? 'VIP' : visits >= 5 ? 'Loyal' : visits >= 2 ? 'Returning' : 'New';
            return {
                id: Customer.id, name: Customer.name, email: Customer.email, notes: Customer.notes,
                visitCount: visits, lastVisit: Customer.bookings[0]?.startTime ?? null, loyalty,
            };
        }).sort((a, b) => b.visitCount - a.visitCount);
    }
    // customer.service.ts
    async getCustomerHistory(businessId, customerId) {
        const customer = await prisma_1.default.customer.findFirst({
            // findFirst + both fields, not findUnique(id) — this is what actually
            // enforces that businessId owns this customer. Using findUnique(id)
            // alone would let any authed business fetch any customer by id.
            where: { id: customerId, businessId },
            include: {
                bookings: {
                    orderBy: { startTime: "desc" },
                    include: {
                        service: {
                            select: { id: true, name: true, price: true, offerPrice: true },
                        },
                        staff: {
                            select: { id: true, firstName: true, lastName: true },
                        },
                    },
                },
            },
        });
        if (!customer)
            return null;
        const completed = customer.bookings.filter(b => b.status === "COMPLETED");
        const totalSpent = completed.reduce((sum, b) => sum + (b.service.offerPrice ?? b.service.price), 0);
        // bookings are already sorted desc, so the first COMPLETED one is the
        // most recent actual visit — not just the most recent booking of any status
        const lastVisit = completed[0]?.startTime ?? null;
        return {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            notes: customer.notes,
            totalBookings: customer.bookings.length,
            totalSpent,
            lastVisit,
            createdAt: customer.createdAt,
            bookings: customer.bookings.map(b => ({
                id: b.id,
                startTime: b.startTime,
                endTime: b.endTime,
                status: b.status,
                notes: b.notes,
                service: b.service,
                staff: b.staff,
            })),
        };
    }
    /**
     * Get customer by ID
     */
    async getCustomerById(id) {
        return prisma_1.default.customer.findUnique({
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
            prisma_1.default.customer.findMany({
                where: { businessId },
                skip,
                take: limit,
                include: { _count: { select: { bookings: true } } },
                orderBy: { lastVisit: "desc" },
            }),
            prisma_1.default.customer.count({ where: { businessId } }),
        ]);
        return { customers, total };
    }
    /**
     * Update customer
     */
    async updateCustomer(id, data) {
        return prisma_1.default.customer.update({
            where: { id },
            data,
        });
    }
    /**
     * Delete customer
     */
    async deleteCustomer(id) {
        return prisma_1.default.customer.delete({
            where: { id },
        });
    }
    /**
     * Get or create customer
     */
    async getOrCreateCustomer(data) {
        return prisma_1.default.customer.upsert({
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
        const customer = await prisma_1.default.customer.findUnique({
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
        return prisma_1.default.customer.findMany({
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
