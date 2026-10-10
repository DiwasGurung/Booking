"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const staff_verification_service_1 = require("./staff-verification.service");
const subscription_service_1 = __importDefault(require("./subscription.service"));
const branch_1 = require("../lib/branch");
class StaffService {
    /**
     * Create a new staff member
     */
    async createStaff(data) {
        const { serviceIds, ...staffData } = data;
        const branchId = await (0, branch_1.resolveBranchId)(data.businessId, data.branchId);
        const staff = await prisma_1.default.staff.create({
            data: {
                ...staffData,
                branchId,
                workingHours: staffData.workingHours,
                breakTimes: staffData.breakTimes,
            },
            include: { branch: true, services: { include: { service: true } } },
        });
        // Connect services if provided
        if (serviceIds && serviceIds.length > 0) {
            await prisma_1.default.staffService.createMany({
                data: serviceIds.map((serviceId) => ({
                    staffId: staff.id,
                    serviceId,
                })),
            });
            // Fetch updated staff with services
            const updatedStaff = await this.getStaffById(staff.id);
            // Send verification email asynchronously (don't wait)
            if (updatedStaff) {
                try {
                    staff_verification_service_1.staffVerificationService.sendVerificationEmail(updatedStaff.id, updatedStaff.email, updatedStaff.firstName, updatedStaff.businessId).catch(err => console.error('[v0] Failed to send verification email:', err));
                }
                catch (error) {
                    console.error('[v0] Error importing verification service:', error);
                }
            }
            return updatedStaff;
        }
        // Send verification email asynchronously (don't wait)
        try {
            staff_verification_service_1.staffVerificationService.sendVerificationEmail(staff.id, staff.email, staff.firstName, staff.businessId).catch(err => console.error('[v0] Failed to send verification email:', err));
        }
        catch (error) {
            console.error('[v0] Error importing verification service:', error);
        }
        return staff;
    }
    /**
     * Get staff by ID
     */
    async getStaffById(id) {
        return prisma_1.default.staff.findUnique({
            where: { id },
            include: {
                services: {
                    include: {
                        service: true,
                    },
                },
                bookings: {
                    where: {
                        status: { in: ["PENDING", "CONFIRMED"] },
                        startTime: { gte: new Date() },
                    },
                    orderBy: { startTime: "asc" },
                    take: 10,
                },
            },
        });
    }
    /**
     * Get all staff for a business
     */
    async getBusinessStaff(businessId, includeInactive = false) {
        return prisma_1.default.staff.findMany({
            where: {
                businessId,
                ...(includeInactive ? {} : { isActive: true }),
            },
            include: {
                services: {
                    include: {
                        service: true,
                    },
                },
                _count: {
                    select: {
                        bookings: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    /**
     * Get staff who can perform a specific service
     */
    async getStaffForService(serviceId) {
        const staffServices = await prisma_1.default.staffService.findMany({
            where: { serviceId },
            include: {
                staff: {
                    include: {
                        services: {
                            include: {
                                service: true,
                            },
                        },
                    },
                },
            },
        });
        return staffServices
            .map((ss) => ss.staff)
            .filter((staff) => staff.isActive);
    }
    /**
     * Update staff member
     */
    async updateStaff(id, data) {
        const { serviceIds, branchId, ...staffData } = data;
        let resolvedBranchId;
        if (branchId) {
            const existing = await prisma_1.default.staff.findUnique({ where: { id }, select: { businessId: true } });
            if (!existing)
                throw new Error("Staff not found");
            resolvedBranchId = await (0, branch_1.resolveBranchId)(existing.businessId, branchId);
        }
        await prisma_1.default.staff.update({
            where: { id },
            data: {
                ...staffData,
                ...(resolvedBranchId && { branchId: resolvedBranchId }),
                workingHours: staffData.workingHours,
                breakTimes: staffData.breakTimes,
            },
        });
        // Update services if provided
        if (serviceIds !== undefined) {
            // Remove existing service connections
            await prisma_1.default.staffService.deleteMany({
                where: { staffId: id },
            });
            // Add new service connections
            if (serviceIds.length > 0) {
                await prisma_1.default.staffService.createMany({
                    data: serviceIds.map((serviceId) => ({
                        staffId: id,
                        serviceId,
                    })),
                });
            }
        }
        return this.getStaffById(id);
    }
    /**
     * Delete staff member
     */
    async deleteStaff(id) {
        return prisma_1.default.staff.delete({
            where: { id },
        });
    }
    /**
     * Toggle staff active status
     */
    async toggleStaffStatus(id) {
        const staff = await prisma_1.default.staff.findUnique({ where: { id } });
        if (!staff)
            throw new Error("Staff not found");
        // Reactivating staff must respect the current plan after a downgrade.
        if (!staff.isActive) {
            const limit = await subscription_service_1.default.canAddStaff(staff.businessId);
            if (!limit.allowed) {
                const error = new Error(limit.reason || 'Staff limit reached. Upgrade your plan to reactivate this staff member.');
                error.code = 'STAFF_LIMIT_EXCEEDED';
                throw error;
            }
        }
        return prisma_1.default.staff.update({
            where: { id },
            data: { isActive: !staff.isActive },
        });
    }
    /**
    * Get available time slots for a staff member on a specific date
    */
    toMinutes(t) {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
    }
    async getStaffAvailability(staffId, date, serviceDuration) {
        const staff = await prisma_1.default.staff.findUnique({
            where: { id: staffId },
            include: { business: true },
        });
        if (!staff)
            throw new Error("Staff not found");
        if (!staff.isActive)
            return [];
        // Get day of week (0 = Sunday, 1 = Monday, etc.)
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const dayName = days[date.getDay()];
        // Parse working hours
        const workingHours = staff.workingHours;
        if (!workingHours || !workingHours[dayName]?.isWorking) {
            return []; // Staff not working this day
        }
        const dayHours = workingHours[dayName];
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        // Branch hours, business-wide fallback, closures, time off and bookings
        const [branchHours, businessHours, closedDate, timeOff, existingBookings] = await Promise.all([
            staff.branchId
                ? prisma_1.default.businessHours.findFirst({
                    where: { branchId: staff.branchId, dayOfWeek: date.getDay() },
                })
                : null,
            prisma_1.default.businessHours.findFirst({
                where: { businessId: staff.businessId, branchId: null, dayOfWeek: date.getDay() },
            }),
            prisma_1.default.closedDate.findFirst({
                where: {
                    businessId: staff.businessId,
                    date: { gte: startOfDay, lte: endOfDay },
                    OR: [{ branchId: null }, ...(staff.branchId ? [{ branchId: staff.branchId }] : [])],
                },
            }),
            prisma_1.default.timeOff.findFirst({
                where: { staffId, startDate: { lte: endOfDay }, endDate: { gte: startOfDay } },
            }),
            prisma_1.default.booking.findMany({
                where: {
                    staffId,
                    startTime: { gte: startOfDay, lte: endOfDay },
                    status: { in: ["PENDING", "CONFIRMED"] },
                },
                orderBy: { startTime: "asc" },
            }),
        ]);
        // Branch hours win; fall back to business-wide hours
        const openingHours = branchHours ?? businessHours;
        if (openingHours?.isClosed || closedDate || timeOff)
            return [];
        // Working window = staff hours ∩ branch opening hours
        const windowStart = Math.max(this.toMinutes(dayHours.start), openingHours ? this.toMinutes(openingHours.openTime) : 0);
        const windowEnd = Math.min(this.toMinutes(dayHours.end), openingHours ? this.toMinutes(openingHours.closeTime) : 24 * 60);
        // Parse break times
        const breakTimes = staff.breakTimes || [];
        const slots = [];
        const now = new Date();
        for (let m = windowStart; m + serviceDuration <= windowEnd; m += serviceDuration) {
            const slotStart = new Date(date);
            slotStart.setHours(Math.floor(m / 60), m % 60, 0, 0);
            const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);
            // Past slot
            if (slotStart < now)
                continue;
            // Overlaps a break
            const isBreak = breakTimes.some((bt) => {
                const [bStartH, bStartM] = bt.start.split(":").map(Number);
                const [bEndH, bEndM] = bt.end.split(":").map(Number);
                const breakStart = new Date(date);
                breakStart.setHours(bStartH, bStartM, 0, 0);
                const breakEnd = new Date(date);
                breakEnd.setHours(bEndH, bEndM, 0, 0);
                return slotStart < breakEnd && slotEnd > breakStart;
            });
            if (isBreak)
                continue;
            // Overlaps an existing booking
            const isBooked = existingBookings.some((booking) => slotStart < booking.endTime && slotEnd > booking.startTime);
            if (isBooked)
                continue;
            slots.push({ start: slotStart, end: slotEnd });
        }
        return slots;
    }
    /**
     * Get staff statistics
     */
    async getStaffStats(staffId, startDate, endDate) {
        const where = { staffId };
        if (startDate && endDate) {
            where.startTime = { gte: startDate, lte: endDate };
        }
        const [totalBookings, completedBookings, cancelledBookings, revenue] = await Promise.all([
            prisma_1.default.booking.count({ where }),
            prisma_1.default.booking.count({ where: { ...where, status: "COMPLETED" } }),
            prisma_1.default.booking.count({ where: { ...where, status: "CANCELLED" } }),
            prisma_1.default.booking.findMany({
                where: { ...where, status: "COMPLETED" },
                include: { service: true },
            }),
        ]);
        const totalRevenue = revenue.reduce((sum, booking) => {
            return sum + (booking.service.offerPrice || booking.service.price);
        }, 0);
        return {
            totalBookings,
            completedBookings,
            cancelledBookings,
            totalRevenue,
            completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
        };
    }
    /**
     * Get staff info by staffCode (public)
     */
    async getStaffByCode(staffCode) {
        const staff = await prisma_1.default.staff.findUnique({
            where: { staffCode },
            include: {
                services: {
                    include: {
                        service: true,
                    },
                },
                business: true
            },
        });
        if (!staff)
            return null;
        const branchDisplay = await (0, branch_1.getBranchDisplay)(staff.branchId, staff.business);
        // Return only public information
        return {
            id: staff.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
            email: staff.email,
            phone: staff.phone,
            avatar: staff.avatar,
            staffCode: staff.staffCode,
            workingHours: staff.workingHours,
            breakTimes: staff.breakTimes,
            role: staff.role,
            isActive: staff.isActive,
            businessId: staff.business.id,
            branchId: staff.branchId,
            branch: branchDisplay, // { name, phone, address }
            businessName: branchDisplay.name,
            services: staff.services.map(ss => ({
                id: ss.id,
                staffId: ss.staffId,
                serviceId: ss.serviceId,
                service: {
                    id: ss.service.id,
                    name: ss.service.name,
                    duration: ss.service.duration,
                    price: ss.service.price,
                    description: ss.service.description,
                },
            })),
        };
    }
    /**
     * Get staff bookings by staffCode (public)
     */
    async getBookingsByStaffCodeUsingBooking(staffCode) {
        // Find the staff by staffCode to get staffId
        const staff = await prisma_1.default.staff.findUnique({
            where: { staffCode },
            select: { id: true },
        });
        if (!staff)
            return null;
        // Fetch bookings directly from Booking model
        const bookings = await prisma_1.default.booking.findMany({
            where: {
                staffId: staff.id,
                status: { in: ['CANCELLED', 'CONFIRMED', 'COMPLETED'] }, // include all relevant statuses
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                service: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        price: true,
                    },
                },
            },
            orderBy: {
                startTime: 'asc',
            },
        });
        // Return formatted data
        return {
            staffName: '', // optional, can be fetched if needed
            staffCode,
            bookings: bookings.map((booking) => ({
                id: booking.id,
                customer: {
                    id: booking.customer?.id || '',
                    name: booking.customer?.name || '',
                    email: booking.customer?.email || '',
                    phone: booking.customer?.phone || '',
                },
                service: {
                    id: booking.service.id,
                    name: booking.service.name,
                    duration: booking.service.duration,
                    price: booking.service.price,
                },
                startTime: booking.startTime,
                endTime: booking.endTime,
                status: booking.status,
                notes: booking.notes,
            })),
        };
    }
    // Inside your StaffService class
    async getBookingsByStaffCodeAndDate(staffCode, date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const staff = await prisma_1.default.staff.findUnique({
            where: { staffCode },
            include: {
                bookings: {
                    where: {
                        status: 'CONFIRMED',
                        startTime: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                    },
                    include: {
                        customer: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                            },
                        },
                        service: {
                            select: {
                                id: true,
                                name: true,
                                duration: true,
                                price: true,
                            },
                        },
                    },
                    orderBy: {
                        startTime: 'asc',
                    },
                },
            },
        });
        if (!staff)
            return null;
        return {
            staffName: `${staff.firstName} ${staff.lastName}`,
            staffCode: staff.staffCode,
            bookings: staff.bookings.map(booking => ({
                id: booking.id,
                customer: booking.customer,
                service: booking.service,
                startTime: booking.startTime,
                endTime: booking.endTime,
                status: booking.status,
                notes: booking.notes,
            })),
        };
    }
}
exports.StaffService = StaffService;
exports.default = new StaffService();
