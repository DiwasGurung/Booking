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
exports.BusinessService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class BusinessService {
    /**
     * Create a new business
     */
    createBusiness(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!data.userId)
                throw new Error("userId is required to create a business");
            // Check if user already has a business
            const existingBusiness = yield prisma_1.default.business.findUnique({ where: { userId: data.userId } });
            if (existingBusiness) {
                throw new Error("This user already has a business");
            }
            // Create business and update user role to business_owner
            const business = yield prisma_1.default.business.create({
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
            yield prisma_1.default.user.update({
                where: { id: data.userId },
                data: { role: 'BUSINESS_OWNER' }
            });
            return business;
        });
    }
    /**
     * Get business by ID
     */
    getBusinessById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.business.findUnique({
                where: { id },
                include: {
                    user: true,
                    services: true,
                    staff: true,
                    hours: true,
                },
            });
        });
    }
    /**
     * Get business by user ID
     */
    getBusinessByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.business.findUnique({
                where: { userId },
                include: {
                    user: true,
                    services: true,
                    staff: true,
                    hours: true,
                },
            });
        });
    }
    /**
     * Update business
     */
    updateBusiness(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.business.update({
                where: { id },
                data,
            });
        });
    }
    /**
     * Delete business
     */
    deleteBusiness(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.business.delete({
                where: { id },
            });
        });
    }
    /**
     * Get all businesses with pagination
     */
    getAllBusinesses() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10, category, isActive) {
            const skip = (page - 1) * limit;
            const where = {};
            if (category)
                where.category = category;
            if (isActive !== undefined)
                where.isActive = isActive;
            const [businesses, total] = yield Promise.all([
                prisma_1.default.business.findMany({
                    where,
                    skip,
                    take: limit,
                    include: { user: true },
                    orderBy: { createdAt: "desc" },
                }),
                prisma_1.default.business.count({ where }),
            ]);
            return { businesses, total };
        });
    }
    /**
     * Get business statistics
     */
    getBusinessStats(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [totalBookings, totalRevenue, completedBookings, averageRating] = yield Promise.all([
                prisma_1.default.booking.count({
                    where: { businessId },
                }),
                prisma_1.default.payment.aggregate({
                    where: { businessId, status: "COMPLETED" },
                    _sum: { amount: true },
                }),
                prisma_1.default.booking.count({
                    where: { businessId, status: "COMPLETED" },
                }),
                prisma_1.default.business.findUnique({
                    where: { id: businessId },
                    select: { rating: true },
                }),
            ]);
            return {
                totalBookings,
                totalRevenue: totalRevenue._sum.amount || 0,
                completedBookings,
                averageRating: (averageRating === null || averageRating === void 0 ? void 0 : averageRating.rating) || 0,
                conversionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
            };
        });
    }
    /**
     * Get monthly revenue
     */
    getMonthlyRevenue(businessId_1) {
        return __awaiter(this, arguments, void 0, function* (businessId, months = 6) {
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - months);
            const payments = yield prisma_1.default.payment.findMany({
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
        });
    }
    /**
     * Search businesses
     */
    searchBusinesses(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, limit = 10) {
            return prisma_1.default.business.findMany({
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
        });
    }
    /**
     * Get business settings
     */
    getBusinessSettings(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('[v0] getBusinessSettings called with:', businessId);
                const business = yield prisma_1.default.business.findUnique({
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
                console.log('[v0] business found:', business);
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
                console.log('[v0] getBusinessSettings error:', error instanceof Error ? error.message : String(error));
                throw error;
            }
        });
    }
    /**
     * Update business settings
     */
    updateBusinessSettings(businessId, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const business = yield prisma_1.default.business.update({
                    where: { id: businessId },
                    data: Object.assign(Object.assign(Object.assign(Object.assign({ name: settings.businessName, email: settings.email, phone: settings.phone, address: settings.address, city: settings.city, state: settings.state, zipCode: settings.zipCode, country: settings.country, description: settings.description, website: settings.website, category: settings.category }, (settings.logo && { logo: settings.logo })), (settings.coverImage && { coverImage: settings.coverImage })), (settings.socialMedia && { socialMedia: settings.socialMedia })), (settings.notificationSettings && { notificationSettings: settings.notificationSettings }))
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
        });
    }
}
exports.BusinessService = BusinessService;
exports.default = new BusinessService();
