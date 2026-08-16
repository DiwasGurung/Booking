"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaffBookingsByDate = exports.addTimeOff = exports.getTimeOff = exports.getStaffAuthenticatedBookings = exports.getStaffBookings = exports.getStaffByCode = exports.getStaffStats = exports.getStaffAvailability = exports.toggleStaffStatus = exports.deleteStaff = exports.updateStaff = exports.getStaffPerformance = exports.getStaffForService = exports.getBusinessStaff = exports.getStaffById = exports.createStaff = void 0;
const staff_service_js_1 = __importDefault(require("../services/staff.service.js"));
const index_js_1 = require("../validators/index.js");
const subscription_service_js_1 = __importDefault(require("../services/subscription.service.js"));
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
/**
 * Create a new staff member
 */
const createStaff = async (req, res) => {
    try {
        const validation = (0, index_js_1.parseAndValidate)(index_js_1.CreateStaffSchema, req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error });
        }
        // Check subscription staff limit
        const staffLimit = await subscription_service_js_1.default.canAddStaff(validation.data.businessId);
        if (!staffLimit.allowed) {
            console.warn('[v0] Staff limit exceeded for business:', validation.data.businessId);
            return res.status(429).json({
                message: staffLimit.reason || 'Staff limit reached. Please upgrade your subscription.',
                error: 'STAFF_LIMIT_EXCEEDED',
                current: staffLimit.current,
                limit: staffLimit.limit,
            });
        }
        const staff = await staff_service_js_1.default.createStaff(validation.data);
        res.status(201).json({ success: true, staff });
    }
    catch (error) {
        console.error("[Staff Controller] Create error:", error.message);
        res.status(500).json({ error: "Failed to create staff member" });
    }
};
exports.createStaff = createStaff;
/**
 * Get staff by ID
 */
const getStaffById = async (req, res) => {
    try {
        const validation = (0, index_js_1.parseAndValidate)(index_js_1.StaffParamsSchema, req.params);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error });
        }
        const staff = await staff_service_js_1.default.getStaffById(validation.data.staffId);
        if (!staff) {
            return res.status(404).json({ error: "Staff not found" });
        }
        res.json({ staff });
    }
    catch (error) {
        console.error("[Staff Controller] Get by ID error:", error.message);
        res.status(500).json({ error: "Failed to get staff member" });
    }
};
exports.getStaffById = getStaffById;
/**
 * Get all staff for a business
 */
const getBusinessStaff = async (req, res) => {
    try {
        const validation = (0, index_js_1.parseAndValidate)(index_js_1.BusinessIdParamsSchema, req.params);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error });
        }
        const includeInactive = req.query.includeInactive === "true";
        const staff = await staff_service_js_1.default.getBusinessStaff(validation.data.businessId, includeInactive);
        res.json({ staff });
    }
    catch (error) {
        console.error("[Staff Controller] Get business staff error:", error.message);
        res.status(500).json({ error: "Failed to get staff members" });
    }
};
exports.getBusinessStaff = getBusinessStaff;
/**
 * Get staff who can perform a specific service
 */
const getStaffForService = async (req, res) => {
    try {
        const serviceId = req.params.serviceId;
        const staff = await staff_service_js_1.default.getStaffForService(serviceId);
        res.json({ staff });
    }
    catch (error) {
        console.error("[Staff Controller] Get staff for service error:", error.message);
        res.status(500).json({ error: "Failed to get staff for service" });
    }
};
exports.getStaffForService = getStaffForService;
/**
 * Get staff performance for a selected period.
 * This reports bookings and served customers only; it does not use subscription payments.
 */
const getStaffPerformance = async (req, res) => {
    try {
        const staffId = req.params.staffId;
        const staffMember = await prisma_js_1.default.staff.findUnique({ where: { id: staffId }, select: { businessId: true } });
        if (!staffMember)
            return res.status(404).json({ error: 'Staff member not found' });
        const subscription = await subscription_service_js_1.default.getSubscriptionStatus(staffMember.businessId);
        if (!subscription.hasSubscription || !subscription.planName?.toLowerCase().includes('enterprise')) {
            return res.status(403).json({ error: 'Staff performance analytics require an Enterprise subscription' });
        }
        const startDate = typeof req.query.startDate === 'string' ? new Date(req.query.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endDate = typeof req.query.endDate === 'string' ? new Date(req.query.endDate) : new Date();
        const dateFilter = { gte: startDate, lte: endDate };
        const [totalBookings, servedCustomers, pendingBookings, unverifiedBookings, customers] = await Promise.all([
            prisma_js_1.default.booking.count({ where: { staffId, startTime: dateFilter } }),
            prisma_js_1.default.booking.count({ where: { staffId, status: 'COMPLETED', startTime: dateFilter } }),
            prisma_js_1.default.booking.count({ where: { staffId, status: 'PENDING', startTime: dateFilter } }),
            prisma_js_1.default.booking.count({ where: { staffId, isEmailVerified: false, startTime: dateFilter } }),
            prisma_js_1.default.booking.findMany({ where: { staffId, startTime: dateFilter }, distinct: ['customerEmail'], select: { customerEmail: true } }),
        ]);
        res.json({
            totalBookings,
            servedCustomers,
            pendingBookings,
            unverifiedBookings,
            uniqueCustomers: customers.length,
            completionRate: totalBookings ? (servedCustomers / totalBookings) * 100 : 0,
            startDate,
            endDate,
        });
    }
    catch (error) {
        console.error('[Staff Controller] Performance error:', error.message);
        res.status(500).json({ error: 'Failed to load staff performance' });
    }
};
exports.getStaffPerformance = getStaffPerformance;
/**
 * Update staff member
 */
const updateStaff = async (req, res) => {
    try {
        const id = req.params.id;
        const { firstName, lastName, email, phone, avatar, role, isActive, workingHours, breakTimes, serviceIds } = req.body;
        const staff = await staff_service_js_1.default.updateStaff(id, {
            firstName,
            lastName,
            email,
            phone,
            avatar,
            role,
            isActive,
            workingHours,
            breakTimes,
            serviceIds,
        });
        res.json({ success: true, staff });
    }
    catch (error) {
        console.error("[Staff Controller] Update error:", error.message);
        res.status(500).json({ error: "Failed to update staff member" });
    }
};
exports.updateStaff = updateStaff;
/**
 * Delete staff member
 */
const deleteStaff = async (req, res) => {
    try {
        const id = req.params.id;
        await staff_service_js_1.default.deleteStaff(id);
        res.json({ success: true, message: "Staff member deleted" });
    }
    catch (error) {
        console.error("[Staff Controller] Delete error:", error.message);
        res.status(500).json({ error: "Failed to delete staff member" });
    }
};
exports.deleteStaff = deleteStaff;
/**
 * Toggle staff active status
 */
const toggleStaffStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const staff = await staff_service_js_1.default.toggleStaffStatus(id);
        res.json({ success: true, staff });
    }
    catch (error) {
        console.error("[Staff Controller] Toggle status error:", error.message);
        res.status(500).json({ error: "Failed to toggle staff status" });
    }
};
exports.toggleStaffStatus = toggleStaffStatus;
/**
 * Get staff availability for a specific date
 */
const getStaffAvailability = async (req, res) => {
    try {
        const staffId = req.params.staffId;
        const { date, duration } = req.query;
        if (!date || !duration) {
            return res.status(400).json({ error: "Date and duration are required" });
        }
        const slots = await staff_service_js_1.default.getStaffAvailability(staffId, new Date(date), parseInt(duration, 10));
        res.json({ slots });
    }
    catch (error) {
        console.error("[Staff Controller] Get availability error:", error.message);
        res.status(500).json({ error: "Failed to get staff availability" });
    }
};
exports.getStaffAvailability = getStaffAvailability;
/**
 * Get staff statistics
 */
const getStaffStats = async (req, res) => {
    try {
        const staffId = req.params.staffId;
        const { startDate, endDate } = req.query;
        const stats = await staff_service_js_1.default.getStaffStats(staffId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        res.json({ stats });
    }
    catch (error) {
        console.error("[Staff Controller] Get stats error:", error.message);
        res.status(500).json({ error: "Failed to get staff statistics" });
    }
};
exports.getStaffStats = getStaffStats;
/**
 * Get staff by staffCode (public - for direct booking)
 */
const getStaffByCode = async (req, res) => {
    try {
        const staffCode = req.params.staffCode;
        if (!staffCode) {
            return res.status(400).json({ error: "Staff code is required" });
        }
        const staff = await staff_service_js_1.default.getStaffByCode(staffCode);
        if (!staff) {
            return res.status(404).json({ error: "Staff member not found" });
        }
        res.json(staff);
    }
    catch (error) {
        console.error("[Staff Controller] Get staff by code error:", error.message);
        res.status(500).json({ error: "Failed to get staff information" });
    }
};
exports.getStaffByCode = getStaffByCode;
/**
 * Get staff bookings by staffCode (public - for staff booking view)
 */
const getStaffBookings = async (req, res) => {
    try {
        const staffCode = req.params.staffCode;
        if (!staffCode) {
            return res.status(400).json({ error: "Staff code is required" });
        }
        const result = await staff_service_js_1.default.getBookingsByStaffCode(staffCode);
        if (!result) {
            return res.status(404).json({ error: "Staff member not found" });
        }
        res.json(result);
    }
    catch (error) {
        console.error("[Staff Controller] Get bookings error:", error.message);
        res.status(500).json({ error: "Failed to get bookings" });
    }
};
exports.getStaffBookings = getStaffBookings;
/**
 * Get bookings for authenticated staff member
 */
const getStaffAuthenticatedBookings = async (req, res) => {
    try {
        const staffId = req.params.staffId;
        const requestingStaffId = req.staffId; // From middleware
        // Security: Staff can only view their own bookings
        if (staffId !== requestingStaffId) {
            return res.status(403).json({ error: "Unauthorized: You can only view your own bookings" });
        }
        const bookings = await prisma_js_1.default.booking.findMany({
            where: {
                staffId,
                status: "CONFIRMED",
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
                startTime: "asc",
            },
        });
        res.json(bookings);
    }
    catch (error) {
        console.error("[Staff Controller] Get authenticated bookings error:", error.message);
        res.status(500).json({ error: "Failed to get bookings" });
    }
};
exports.getStaffAuthenticatedBookings = getStaffAuthenticatedBookings;
const getTimeOff = async (req, res) => {
    try {
        const staffId = req.params.staffId;
        const month = req.query.month; // Format: YYYY-MM
        if (!staffId) {
            return res.status(400).json({ error: "Staff ID is required" });
        }
        // Verify staff exists
        const staff = await prisma_js_1.default.staff.findUnique({
            where: { id: staffId },
        });
        if (!staff) {
            return res.status(404).json({ error: "Staff member not found" });
        }
        let whereClause = { staffId };
        // If month is provided, filter by month
        if (month) {
            const [year, monthNum] = month.split('-').map(Number);
            const monthStart = new Date(year, monthNum - 1, 1);
            const monthEnd = new Date(year, monthNum, 0, 23, 59, 59);
            // Find time-off records that overlap with the requested month
            whereClause.AND = [
                {
                    startDate: {
                        lte: monthEnd, // Time-off starts before or on the last day of month
                    },
                },
                {
                    endDate: {
                        gte: monthStart, // Time-off ends on or after the first day of month
                    },
                },
            ];
        }
        const timeOffs = await prisma_js_1.default.timeOff.findMany({
            where: whereClause,
            orderBy: { startDate: "asc" },
        });
        // Transform the response to include individual dates for compatibility with frontend
        const expandedTimeOffs = timeOffs.flatMap((timeOff) => {
            const dates = [];
            const start = new Date(timeOff.startDate);
            const end = new Date(timeOff.endDate);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                dates.push({
                    ...timeOff,
                    date: new Date(d).toISOString().split('T')[0], // Add individual date for frontend
                });
            }
            return dates;
        });
        res.status(200).json(expandedTimeOffs);
    }
    catch (error) {
        console.error("[Staff Controller] Get time off error:", error.message);
        res.status(500).json({ error: "Failed to fetch time off" });
    }
};
exports.getTimeOff = getTimeOff;
const addTimeOff = async (req, res) => {
    try {
        const staffId = req.params.staffId;
        const { startDate, endDate, type, reason } = req.body;
        if (!staffId || !startDate || !endDate) {
            return res.status(400).json({ error: "Staff ID, start date, and end date are required" });
        }
        // Verify staff exists
        const staff = await prisma_js_1.default.staff.findUnique({
            where: { id: staffId },
        });
        if (!staff) {
            return res.status(404).json({ error: "Staff member not found" });
        }
        // Create time off records for each day in the range
        const start = new Date(startDate);
        const end = new Date(endDate);
        const timeOffs = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            // Prisma TimeOffCreateManyInput expects businessId, startDate and endDate
            timeOffs.push({
                staffId,
                businessId: staff.businessId,
                startDate: new Date(d),
                endDate: new Date(d),
                type: type || "VACATION",
                reason: reason || null,
            });
        }
        // Use createMany for bulk insert
        const result = await prisma_js_1.default.timeOff.createMany({
            data: timeOffs,
            skipDuplicates: true,
        });
        res.status(201).json({
            success: true,
            message: `Time off added for ${result.count} day(s)`,
            count: result.count,
        });
    }
    catch (error) {
        console.error("[Staff Controller] Add time off error:", error.message);
        res.status(500).json({ error: "Failed to add time off" });
    }
};
exports.addTimeOff = addTimeOff;
/**
 * Get bookings for a staff member on a specific date
 */
const getStaffBookingsByDate = async (req, res) => {
    try {
        const staffCode = req.params.staffCode;
        const date = req.query.date; // Format: YYYY-MM-DD
        if (!staffCode || !date) {
            return res.status(400).json({ error: "Staff code and date are required" });
        }
        // Verify staff exists
        const staff = await prisma_js_1.default.staff.findUnique({
            where: { staffCode },
        });
        if (!staff) {
            return res.status(404).json({ error: "Staff member not found" });
        }
        // Parse the date
        // Parse the date string (format: YYYY-MM-DD)
        // Create dates treating the input as a local date, not UTC
        const [year, month, day] = date.split('-').map(Number);
        const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
        const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
        // Fetch bookings for this staff member on the specified date
        // Include both PENDING and CONFIRMED bookings to block time slots for guests
        const bookings = await prisma_js_1.default.booking.findMany({
            where: {
                staffId: staff.id,
                startTime: {
                    gte: dayStart,
                    lte: dayEnd,
                },
                status: {
                    in: ["PENDING", "CONFIRMED"], // Include both PENDING and CONFIRMED
                },
            },
            include: {
                service: true,
                customer: true,
            },
            orderBy: { startTime: "asc" },
        });
        res.status(200).json(bookings);
    }
    catch (error) {
        console.error("[Staff Controller] Get bookings by date error:", error.message);
        res.status(500).json({ error: "Failed to fetch bookings" });
    }
};
exports.getStaffBookingsByDate = getStaffBookingsByDate;
