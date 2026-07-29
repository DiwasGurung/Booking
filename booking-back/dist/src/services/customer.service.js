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
exports.CustomerService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class CustomerService {
    /**
     * Create a new customer
     */
    createCustomer(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.customer.create({
                data,
            });
        });
    }
    /**
     * Get customer by ID
     */
    getCustomerById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.customer.findUnique({
                where: { id },
                include: {
                    bookings: true,
                },
            });
        });
    }
    /**
     * Get all customers for a business
     */
    getBusinessCustomers(businessId_1) {
        return __awaiter(this, arguments, void 0, function* (businessId, page = 1, limit = 10) {
            const skip = (page - 1) * limit;
            const [customers, total] = yield Promise.all([
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
        });
    }
    /**
     * Update customer
     */
    updateCustomer(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.customer.update({
                where: { id },
                data,
            });
        });
    }
    /**
     * Delete customer
     */
    deleteCustomer(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.customer.delete({
                where: { id },
            });
        });
    }
    /**
     * Get or create customer
     */
    getOrCreateCustomer(data) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    getCustomerStats(customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const customer = yield prisma_1.default.customer.findUnique({
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
        });
    }
    /**
     * Search customers
     */
    searchCustomers(businessId_1, query_1) {
        return __awaiter(this, arguments, void 0, function* (businessId, query, limit = 10) {
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
        });
    }
}
exports.CustomerService = CustomerService;
exports.default = new CustomerService();
