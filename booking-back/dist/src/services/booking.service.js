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
exports.BookingService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class BookingService {
    /**
     * Create a new booking
     */
    createBooking(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.booking.create({
                data,
            });
        });
    }
    /**
     * Get booking by ID
     */
    getBookingById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.booking.findUnique({
                where: { id },
                include: {
                    service: true,
                    business: true,
                    user: true,
                    customer: true,
                    staff: true,
                },
            });
        });
    }
    /**
     * Get all bookings for a business
     */
    getBusinessBookings(businessId_1) {
        return __awaiter(this, arguments, void 0, function* (businessId, page = 1, limit = 10, status) {
            const skip = (page - 1) * limit;
            const where = { businessId };
            if (status)
                where.status = status;
            const [bookings, total] = yield Promise.all([
                prisma_1.default.booking.findMany({
                    where,
                    skip,
                    take: limit,
                    include: { service: true, customer: true, staff: true },
                    orderBy: { startTime: "desc" },
                }),
                prisma_1.default.booking.count({ where }),
            ]);
            return { bookings, total };
        });
    }
    /**
     * Get bookings for a customer
     */
    getCustomerBookings(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.booking.findMany({
                where: { userId },
                include: { service: true, business: true, staff: true },
                orderBy: { startTime: "desc" },
            });
        });
    }
    /**
     * Update booking status
     */
    updateBookingStatus(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.booking.update({
                where: { id },
                data: { status },
            });
        });
    }
    /**
     * Update booking
     */
    updateBooking(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.booking.update({
                where: { id },
                data,
            });
        });
    }
    /**
     * Cancel booking
     */
    cancelBooking(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.booking.update({
                where: { id },
                data: { status: "CANCELLED" },
            });
        });
    }
    /**
     * Delete booking
     */
    deleteBooking(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.booking.delete({
                where: { id },
            });
        });
    }
    /**
     * Get available slots for a service on a specific date
     */
    getAvailableSlots(serviceId, businessId, date) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = yield prisma_1.default.service.findUnique({
                where: { id: serviceId },
            });
            if (!service)
                throw new Error("Service not found");
            // Get business hours for the day
            const dayOfWeek = date.getDay();
            const businessHours = yield prisma_1.default.businessHours.findUnique({
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
            const bookings = yield prisma_1.default.booking.findMany({
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
        });
    }
    /**
     * Get booking trends
     */
    getBookingTrends(businessId_1) {
        return __awaiter(this, arguments, void 0, function* (businessId, days = 30) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const bookings = yield prisma_1.default.booking.findMany({
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
        });
    }
}
exports.BookingService = BookingService;
exports.default = new BookingService();
