"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessService = void 0;
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
class BusinessService {
    /**
     * Create a new business
     */
    async createBusiness(data) {
        if (!data.userId)
            throw new Error("userId is required to create a business");
        // Check if user already has a business
        const existingBusiness = await prisma_js_1.default.business.findUnique({ where: { userId: data.userId } });
        if (existingBusiness) {
            throw new Error("This user already has a business");
        }
        // Create business and update user role to business_owner
        const business = await prisma_js_1.default.business.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                category: data.category,
                address: data.address,
                city: data.city,
                state: data.state || '',
                zipCode: data.zipCode || '',
                country: data.country,
                description: data.description,
                website: data.website,
                logo: data.logo,
                user: {
                    connect: { id: data.userId },
                },
            },
        });
        // Update user role to BUSINESS_OWNER (must match the UserRole enum)
        await prisma_js_1.default.user.update({
            where: { id: data.userId },
            data: { role: 'BUSINESS_OWNER' }
        });
        return business;
    }
    /**
     * Get business by ID
     */
    async getBusinessById(id) {
        return prisma_js_1.default.business.findUnique({
            where: { id },
            include: {
                user: true,
                services: true,
                staff: true,
                hours: true,
            },
        });
    }
    /**
     * Get business by user ID
     */
    async getBusinessByUserId(userId) {
        return prisma_js_1.default.business.findUnique({
            where: { userId },
            include: {
                user: true,
                services: true,
                staff: true,
                hours: true,
            },
        });
    }
    /**
     * Update business
     */
    async updateBusiness(id, data) {
        return prisma_js_1.default.business.update({
            where: { id },
            data,
        });
    }
    /**
     * Delete business
     */
    async deleteBusiness(id) {
        return prisma_js_1.default.business.delete({
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
            prisma_js_1.default.business.findMany({
                where,
                skip,
                take: limit,
                include: { user: true },
                orderBy: { createdAt: "desc" },
            }),
            prisma_js_1.default.business.count({ where }),
        ]);
        return { businesses, total };
    }
    /**
     * Get business statistics
     */
    async getBusinessStats(businessId) {
        const [totalBookings, totalRevenue, completedBookings, averageRating] = await Promise.all([
            prisma_js_1.default.booking.count({
                where: { businessId },
            }),
            prisma_js_1.default.payment.aggregate({
                where: { businessId, status: "COMPLETED" },
                _sum: { amount: true },
            }),
            prisma_js_1.default.booking.count({
                where: { businessId, status: "COMPLETED" },
            }),
            prisma_js_1.default.business.findUnique({
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
     * Search businesses
     */
    async searchBusinesses(query, limit = 10) {
        return prisma_js_1.default.business.findMany({
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
    /**
     * Get business settings
     */
    async getBusinessSettings(businessId) {
        try {
            const business = await prisma_js_1.default.business.findUnique({
                where: { id: businessId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    address: true,
                    city: true,
                    state: true,
                    zipCode: true,
                    country: true,
                    description: true,
                    website: true,
                    category: true,
                    logo: true,
                    coverImage: true,
                    socialMedia: true,
                    notificationSettings: true,
                }
            });
            if (!business) {
                throw new Error("Business not found");
            }
            return {
                businessName: business.name,
                email: business.email,
                phone: business.phone || '',
                address: business.address || '',
                city: business.city || '',
                state: business.state || '',
                zipCode: business.zipCode || '',
                country: business.country || '',
                description: business.description || '',
                website: business.website || '',
                category: business.category || '',
                logo: business.logo || '',
                coverImage: business.coverImage || '',
                socialMedia: business.socialMedia || {
                    facebook: '',
                    instagram: '',
                    twitter: ''
                },
                notificationSettings: business.notificationSettings || {
                    emailNotifications: true,
                    smsNotifications: false,
                    bookingReminders: true,
                    paymentAlerts: true,
                    marketingEmails: false
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Get booking and customer analytics. Subscription payments are intentionally excluded.
     */
    async getBusinessAnalytics(businessId, days = 30) {
        const safeDays = Math.min(Math.max(days, 1), 365);
        const now = new Date();
        const currentStart = new Date(now);
        currentStart.setDate(now.getDate() - safeDays);
        const previousStart = new Date(currentStart);
        previousStart.setDate(currentStart.getDate() - safeDays);
        const [currentBookings, previousBookings, customers, currentCustomers, previousCustomers, statusRows, serviceRows] = await Promise.all([
            prisma_js_1.default.booking.findMany({
                where: { businessId, createdAt: { gte: currentStart } },
                select: { id: true, status: true, service: { select: { name: true } }, createdAt: true },
            }),
            prisma_js_1.default.booking.count({ where: { businessId, createdAt: { gte: previousStart, lt: currentStart } } }),
            prisma_js_1.default.customer.count({ where: { businessId } }),
            prisma_js_1.default.customer.count({ where: { businessId, createdAt: { gte: currentStart } } }),
            prisma_js_1.default.customer.count({ where: { businessId, createdAt: { gte: previousStart, lt: currentStart } } }),
            prisma_js_1.default.booking.groupBy({ by: ['status'], where: { businessId, createdAt: { gte: currentStart } }, _count: { _all: true } }),
            prisma_js_1.default.booking.groupBy({ by: ['serviceId'], where: { businessId, createdAt: { gte: currentStart } }, _count: { _all: true }, orderBy: { _count: { serviceId: 'desc' } }, take: 5 }),
        ]);
        const serviceIds = serviceRows.map((row) => row.serviceId);
        const services = await prisma_js_1.default.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true } });
        const serviceNames = new Map(services.map((service) => [service.id, service.name]));
        const bookingsByStatus = Object.fromEntries(statusRows.map((row) => [row.status, row._count._all]));
        const bookingGrowth = previousBookings === 0 ? (currentBookings.length ? 100 : 0) : ((currentBookings.length - previousBookings) / previousBookings) * 100;
        const customerGrowth = previousCustomers === 0 ? (currentCustomers ? 100 : 0) : ((currentCustomers - previousCustomers) / previousCustomers) * 100;
        return {
            totalBookings: currentBookings.length,
            bookingGrowth,
            totalCustomers: customers,
            newCustomers: currentCustomers,
            customersGrowth: customerGrowth,
            conversionRate: currentBookings.length ? ((bookingsByStatus.COMPLETED || 0) / currentBookings.length) * 100 : 0,
            bookingsByStatus,
            topServices: serviceRows.map((row) => ({ name: serviceNames.get(row.serviceId) || 'Unknown service', bookings: row._count._all })),
        };
    }
    /**
     * Update business settings
     */
    async updateBusinessSettings(businessId, settings) {
        try {
            const business = await prisma_js_1.default.business.update({
                where: { id: businessId },
                data: {
                    name: settings.businessName,
                    email: settings.email,
                    phone: settings.phone,
                    address: settings.address,
                    city: settings.city,
                    state: settings.state,
                    zipCode: settings.zipCode,
                    country: settings.country,
                    description: settings.description,
                    website: settings.website,
                    category: settings.category,
                    ...(settings.logo && { logo: settings.logo }),
                    ...(settings.coverImage && { coverImage: settings.coverImage }),
                    ...(settings.socialMedia && { socialMedia: settings.socialMedia }),
                    ...(settings.notificationSettings && { notificationSettings: settings.notificationSettings }),
                }
            });
            return {
                businessName: business.name,
                email: business.email,
                phone: business.phone,
                address: business.address,
                city: business.city,
                state: business.state,
                zipCode: business.zipCode,
                country: business.country,
                description: business.description,
                website: business.website,
                category: business.category,
                logo: business.logo,
                coverImage: business.coverImage,
                socialMedia: business.socialMedia,
                notificationSettings: business.notificationSettings,
            };
        }
        catch (error) {
            throw error;
        }
    }
}
exports.BusinessService = BusinessService;
exports.default = new BusinessService();
