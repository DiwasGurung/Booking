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
                staff: true,
            },
        });
    }
    async getBusinessBookings(businessId, page = 1, limit = 10, status, staffId, verified, startDate, endDate) {
        const skip = (page - 1) * limit;
        const where = { businessId };
        if (status)
            where.status = status;
        if (staffId)
            where.staffId = staffId;
        if (verified !== undefined)
            where.isEmailVerified = verified;
        if (startDate || endDate) {
            where.startTime = { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) };
        }
        const [bookings, total] = await Promise.all([
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
    }
    /**
     * Get bookings for a customer
     */
    async getCustomerBookings(userId) {
        return prisma_1.default.booking.findMany({
            where: { userId },
            include: { service: true, business: true, staff: true },
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
    async getAvailableSlots(serviceId, businessId, date, staffId) {
        const service = await prisma_1.default.service.findUnique({
            where: { id: serviceId },
        });
        if (!service)
            throw new Error("Service not found");
        // Create proper date range without mutating the original date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
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
        // Get staff for this service through StaffService join table
        let staffStaffServices;
        if (staffId) {
            // If specific staff is selected, verify they're assigned to this service
            staffStaffServices = await prisma_1.default.staffService.findMany({
                where: {
                    staffId: staffId,
                    serviceId: serviceId
                },
                include: {
                    staff: true
                }
            });
            if (staffStaffServices.length === 0) {
                throw new Error("Staff not found or not assigned to this service");
            }
        }
        else {
            // If no staff selected, get all staff for this service and business
            // First get all StaffService records for this service
            const allStaffServices = await prisma_1.default.staffService.findMany({
                where: {
                    serviceId: serviceId
                },
                include: {
                    staff: true
                }
            });
            // Filter to only active staff from this business
            staffStaffServices = allStaffServices.filter((ss) => ss.staff.businessId === businessId && ss.staff.isActive);
            if (staffStaffServices.length === 0) {
                console.error('[v0] No staff found for service:', { businessId, serviceId });
                throw new Error(`No staff members are assigned to this service. Please contact the business.`);
            }
        }
        // Extract staff list
        const staffList = staffStaffServices.map((ss) => ss.staff);
        // Business timezone: slots are generated as wall-clock times in this zone,
        // and stored bookings (absolute UTC instants) are converted to the same zone
        // before comparison. This avoids the server-local vs UTC mismatch that left
        // fully-booked slots looking free.
        const BUSINESS_TZ = process.env.BUSINESS_TIME_ZONE || 'Asia/Kathmandu';
        // Wall-clock date (YYYY-MM-DD) + minutes-since-midnight for a Date in the business zone.
        const toBusinessWallClock = (d) => {
            const parts = new Intl.DateTimeFormat('en-CA', {
                timeZone: BUSINESS_TZ,
                hour12: false,
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit',
            }).formatToParts(d);
            const get = (t) => parts.find(p => p.type === t)?.value || '00';
            const hour = Number(get('hour')) % 24;
            return {
                dateStr: `${get('year')}-${get('month')}-${get('day')}`,
                minutes: hour * 60 + Number(get('minute')),
            };
        };
        // The requested calendar date, reconstructed from the server-local Date the
        // controller built from the "YYYY-MM-DD" query string.
        const pad = (n) => String(n).padStart(2, '0');
        const requestedDateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        // Widen the query window by a day on each side so no booking is dropped by
        // the timezone offset, then filter precisely by business-zone wall clock.
        const windowStart = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);
        const windowEnd = new Date(endOfDay.getTime() + 24 * 60 * 60 * 1000);
        // Confirmed bookings for ANY service the staff are handling that day — a staff
        // booked for a different service is still busy.
        const rawBookings = await prisma_1.default.booking.findMany({
            where: {
                staffId: { in: staffList.map(s => s.id) },
                startTime: { gte: windowStart, lt: windowEnd },
                status: "CONFIRMED",
            },
            select: { staffId: true, startTime: true, endTime: true },
        });
        // Pre-compute each booking's busy minute range on the requested day.
        const busyRanges = rawBookings
            .map(b => {
            const start = toBusinessWallClock(b.startTime);
            const end = toBusinessWallClock(b.endTime);
            return { staffId: b.staffId, dateStr: start.dateStr, startMin: start.minutes, endMin: end.minutes };
        })
            .filter(b => b.dateStr === requestedDateStr);
        // Get timeoffs for all staff on this date
        const timeOffs = await prisma_1.default.timeOff.findMany({
            where: {
                staffId: { in: staffList.map(s => s.id) },
                startDate: { lte: endOfDay },
                endDate: { gte: startOfDay },
            },
        });
        const slots = [];
        const slotDuration = service.duration;
        const SLOT_INTERVAL = 15; // 15-minute intervals
        const closeMinutes = closeHour * 60 + closeMin;
        // Generate slots in 15-minute intervals (business-local wall clock)
        for (let hour = openHour; hour < closeHour; hour++) {
            for (let min = hour === openHour ? openMin : 0; min < 60; min += SLOT_INTERVAL) {
                const slotStartMin = hour * 60 + min;
                const slotEndMin = slotStartMin + slotDuration;
                // Skip slots whose service would run past closing time
                if (slotEndMin > closeMinutes)
                    continue;
                // Slot is available if AT LEAST ONE staff has no conflicting booking/timeoff.
                const isSlotAvailable = staffList.some((staff) => {
                    const hasBookingConflict = busyRanges.some(b => b.staffId === staff.id && slotStartMin < b.endMin && slotEndMin > b.startMin);
                    const slotStartDate = new Date(startOfDay);
                    slotStartDate.setHours(hour, min, 0, 0);
                    const slotEndDate = new Date(slotStartDate);
                    slotEndDate.setMinutes(slotEndDate.getMinutes() + slotDuration);
                    const hasTimeOff = timeOffs.some((timeOff) => timeOff.staffId === staff.id &&
                        slotStartDate < new Date(timeOff.endDate) &&
                        slotEndDate > new Date(timeOff.startDate));
                    return !hasBookingConflict && !hasTimeOff;
                });
                if (isSlotAvailable) {
                    const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
                    slots.push(timeStr);
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
    async getBusinessAvailableSlots(serviceId, businessId, date, staffId) {
        return this.getAvailableSlots(serviceId, businessId, date, staffId);
    }
}
exports.BookingService = BookingService;
exports.default = new BookingService();
