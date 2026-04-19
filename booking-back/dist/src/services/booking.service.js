"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class BookingService {
    /**
     * Create a new booking
     */
    async createBooking(data) {
        return prisma_1.default.booking.create({
            data,
        });
    }
    /**
     * Get booking by ID
     */
    async getBookingById(id) {
        return prisma_1.default.booking.findUnique({
            where: { id },
            include: {
                service: true,
                business: true,
                user: true,
                customer: true,
                payment: true,
            },
        });
    }
    /**
     * Get all bookings for a business
     */
    async getBusinessBookings(businessId, page = 1, limit = 10, status) {
        const skip = (page - 1) * limit;
        const where = { businessId };
        if (status)
            where.status = status;
        const [bookings, total] = await Promise.all([
            prisma_1.default.booking.findMany({
                where,
                skip,
                take: limit,
                include: { service: true, customer: true, payment: true },
                orderBy: { startTime: "desc" },
            }),
            prisma_1.default.booking.count({ where }),
        ]);
        return { bookings, total };
    }
    /**
     * Get bookings for a customer
     */
    async getCustomerBookings(userId) {
        return prisma_1.default.booking.findMany({
            where: { userId },
            include: { service: true, business: true, payment: true },
            orderBy: { startTime: "desc" },
        });
    }
    /**
     * Update booking status
     */
    async updateBookingStatus(id, status) {
        return prisma_1.default.booking.update({
            where: { id },
            data: { status },
        });
    }
    /**
     * Update booking
     */
    async updateBooking(id, data) {
        return prisma_1.default.booking.update({
            where: { id },
            data,
        });
    }
    /**
     * Cancel booking
     */
    async cancelBooking(id) {
        return prisma_1.default.booking.update({
            where: { id },
            data: { status: "CANCELLED" },
        });
    }
    /**
     * Delete booking
     */
    async deleteBooking(id) {
        return prisma_1.default.booking.delete({
            where: { id },
        });
    }
    /**
     * Get available slots for a service on a specific date
     */
    async getAvailableSlots(serviceId, businessId, date) {
        const service = await prisma_1.default.service.findUnique({
            where: { id: serviceId },
        });
        if (!service)
            throw new Error("Service not found");
        // Get business hours for the day
        const dayOfWeek = date.getDay();
        const businessHours = await prisma_1.default.businessHours.findUnique({
            where: {
                businessId_dayOfWeek: {
                    businessId,
                    dayOfWeek: dayOfWeek === 0 ? 6 : dayOfWeek - 1, // Convert JS day (0=Sun) to DB day (0=Mon)
                },
            },
        });
        if (!businessHours || businessHours.isClosed)
            return [];
        // Parse opening hours
        const [openHour, openMin] = businessHours.openTime.split(":").map(Number);
        const [closeHour, closeMin] = businessHours.closeTime.split(":").map(Number);
        // Get booked slots
        const bookings = await prisma_1.default.booking.findMany({
            where: {
                serviceId,
                startTime: {
                    gte: new Date(date.setHours(0, 0, 0, 0)),
                    lt: new Date(date.setHours(23, 59, 59, 999)),
                },
                status: { not: "CANCELLED" },
            },
        });
        const slots = [];
        const slotDuration = service.duration;
        for (let hour = openHour; hour < closeHour; hour++) {
            for (let min = hour === openHour ? openMin : 0; min < 60; min += slotDuration) {
                const slotStart = new Date(date);
                slotStart.setHours(hour, min, 0, 0);
                const slotEnd = new Date(slotStart);
                slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);
                if (slotEnd.getHours() > closeHour)
                    break;
                // Check if slot is available
                const isAvailable = !bookings.some((booking) => {
                    return slotStart < booking.endTime && slotEnd > booking.startTime;
                });
                if (isAvailable) {
                    slots.push(slotStart);
                }
            }
        }
        return slots;
    }
    /**
     * Get booking trends
     */
    async getBookingTrends(businessId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const bookings = await prisma_1.default.booking.findMany({
            where: {
                businessId,
                createdAt: { gte: startDate },
            },
            select: {
                createdAt: true,
                status: true,
            },
        });
        const trends = {};
        bookings.forEach((booking) => {
            const dateKey = booking.createdAt.toISOString().split("T")[0];
            if (!trends[dateKey]) {
                trends[dateKey] = { total: 0, completed: 0 };
            }
            trends[dateKey].total++;
            if (booking.status === "COMPLETED") {
                trends[dateKey].completed++;
            }
        });
        return trends;
    }
}
exports.BookingService = BookingService;
exports.default = new BookingService();
