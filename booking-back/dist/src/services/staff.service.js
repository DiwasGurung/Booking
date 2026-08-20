"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const staff_verification_service_1 = require("./staff-verification.service");
class StaffService {
    /**
     * Create a new staff member
     */
    async createStaff(data) {
        const { serviceIds, ...staffData } = data;
        const staff = await prisma_1.default.staff.create({
            data: {
                ...staffData,
                workingHours: staffData.workingHours,
                breakTimes: staffData.breakTimes,
            },
            include: {
                services: {
                    include: {
                        service: true,
                    },
                },
            },
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
        const { serviceIds, ...staffData } = data;
        // Update staff basic info
        await prisma_1.default.staff.update({
            where: { id },
            data: {
                ...staffData,
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
        return prisma_1.default.staff.update({
            where: { id },
            data: { isActive: !staff.isActive },
        });
    }
    /**
     * Get available time slots for a staff member on a specific date
     */
    async getStaffAvailability(staffId, date, serviceDuration) {
        const staff = await prisma_1.default.staff.findUnique({
            where: { id: staffId },
            include: { business: true },
        });
        if (!staff)
            throw new Error("Staff not found");
        // Get day of week (0 = Sunday, 1 = Monday, etc.)
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const dayName = days[date.getDay()];
        // Parse working hours
        const workingHours = staff.workingHours;
        if (!workingHours || !workingHours[dayName]?.isWorking) {
            return []; // Staff not working this day
        }
        const dayHours = workingHours[dayName];
        const [startHour, startMin] = dayHours.start.split(":").map(Number);
        const [endHour, endMin] = dayHours.end.split(":").map(Number);
        // Get existing bookings for this staff on this date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const existingBookings = await prisma_1.default.booking.findMany({
            where: {
                staffId,
                startTime: { gte: startOfDay, lte: endOfDay },
                status: { in: ["PENDING", "CONFIRMED"] },
            },
            orderBy: { startTime: "asc" },
        });
        // Parse break times
        const breakTimes = staff.breakTimes || [];
        // Generate available slots
        const slots = [];
        const slotDuration = serviceDuration; // in minutes
        for (let hour = startHour; hour < endHour || (hour === endHour && 0 < endMin); hour++) {
            for (let min = hour === startHour ? startMin : 0; min < 60; min += slotDuration) {
                if (hour === endHour && min >= endMin)
                    break;
                const slotStart = new Date(date);
                slotStart.setHours(hour, min, 0, 0);
                const slotEnd = new Date(slotStart);
                slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);
                // Check if slot exceeds working hours
                if (slotEnd.getHours() > endHour || (slotEnd.getHours() === endHour && slotEnd.getMinutes() > endMin)) {
                    continue;
                }
                // Check if slot overlaps with break time
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
                // Check if slot overlaps with existing booking
                const isBooked = existingBookings.some((booking) => {
                    return slotStart < booking.endTime && slotEnd > booking.startTime;
                });
                if (isBooked)
                    continue;
                // Check if slot is in the past
                if (slotStart < new Date())
                    continue;
                slots.push({ start: slotStart, end: slotEnd });
            }
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
        // Return only public information
        return {
            id: staff.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
            email: staff.email,
            phone: staff.phone,
            avatar: staff.avatar,
            staffCode: staff.staffCode,
            businessId: staff.business.id,
            businessName: staff.business.name,
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
    async getBookingsByStaffCode(staffCode) {
        const staff = await prisma_1.default.staff.findUnique({
            where: { staffCode },
            include: {
                bookings: {
                    where: {
                        status: 'CONFIRMED',
                        startTime: {
                            gte: new Date(),
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
