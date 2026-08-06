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
const crypto_1 = require("crypto");
const booking_service_1 = __importDefault(require("../services/booking.service"));
const notification_service_1 = __importDefault(require("../services/notification.service"));
const notification_sse_service_1 = __importDefault(require("../services/notification-sse.service"));
const email_service_1 = require("../services/email.service");
const subscription_service_1 = __importDefault(require("../services/subscription.service"));
const prisma_1 = __importDefault(require("../lib/prisma"));
class BookingController {
    /**
     * Create a booking for BUSINESS - Authenticated User
     * Separate from staff individual bookings to keep flows independent
     */
    createBusinessBooking(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: "User ID is required. Please log in to create a booking."
                    });
                }
                const { businessId, staffId, serviceId, startTime: bodyStartTime, endTime: bodyEndTime, notes } = req.body;
                const startTime = bodyStartTime ? new Date(bodyStartTime) : null;
                const endTime = bodyEndTime ? new Date(bodyEndTime) : null;
                if (!businessId || !serviceId || !startTime) {
                    return res.status(400).json({
                        success: false,
                        message: "Missing required fields: businessId, serviceId, startTime"
                    });
                }
                const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
                if (!user) {
                    return res.status(404).json({ success: false, message: "User not found" });
                }
                // Get service for duration
                const service = yield prisma_1.default.service.findUnique({ where: { id: serviceId } });
                if (!service) {
                    return res.status(404).json({ success: false, message: "Service not found" });
                }
                const finalEndTime = endTime || new Date(startTime.getTime() + (service.duration || 60) * 60000);
                // Auto-assign staff if not provided
                let assignedStaffId = staffId;
                if (!assignedStaffId) {
                    const availableStaff = yield prisma_1.default.staff.findFirst({
                        where: {
                            businessId,
                            services: { some: { serviceId } }
                        }
                    });
                    if (!availableStaff) {
                        return res.status(400).json({
                            success: false,
                            message: "No staff members are assigned to this service."
                        });
                    }
                    assignedStaffId = availableStaff.id;
                }
                const booking = yield prisma_1.default.booking.create({
                    data: {
                        startTime,
                        endTime: finalEndTime,
                        customerName: `${user.firstName} ${user.lastName}`.trim() || 'Guest',
                        customerEmail: user.email,
                        customerPhone: user.phone || '',
                        notes: notes || '',
                        status: 'CONFIRMED',
                        isEmailVerified: true,
                        user: { connect: { id: userId } },
                        service: { connect: { id: serviceId } },
                        business: { connect: { id: businessId } },
                        staff: { connect: { id: assignedStaffId } }
                    }
                });
                return res.status(201).json({
                    success: true,
                    message: "Booking created successfully!",
                    booking: { id: booking.id }
                });
            }
            catch (error) {
                console.error('[v0] Business booking error:', error);
                res.status(500).json({ success: false, error: (error === null || error === void 0 ? void 0 : error.message) || "Failed to create booking" });
            }
        });
    }
    /**
     * Create a BUSINESS PUBLIC booking for guests
     * Separate from staff individual bookings to keep flows independent
     */
    createBusinessPublicBooking(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { businessId, staffId, serviceId, startTime: bodyStartTime, endTime: bodyEndTime, customerName, customerEmail, customerPhone, notes } = req.body;
                const startTime = bodyStartTime ? new Date(bodyStartTime) : null;
                if (!businessId || !serviceId || !startTime || !customerEmail) {
                    return res.status(400).json({
                        success: false,
                        message: "Missing required fields"
                    });
                }
                const service = yield prisma_1.default.service.findUnique({ where: { id: serviceId } });
                if (!service) {
                    return res.status(404).json({ success: false, message: "Service not found" });
                }
                const finalEndTime = bodyEndTime ? new Date(bodyEndTime) : new Date(startTime.getTime() + (service.duration || 60) * 60000);
                // Check/create customer
                let customer = yield prisma_1.default.customer.findUnique({
                    where: { businessId_email: { businessId, email: customerEmail } }
                });
                if (!customer) {
                    customer = yield prisma_1.default.customer.create({
                        data: { businessId, name: customerName, email: customerEmail, phone: customerPhone || '' }
                    });
                }
                // Auto-assign staff if not provided
                let assignedStaffId = staffId;
                if (!assignedStaffId) {
                    const availableStaff = yield prisma_1.default.staff.findFirst({
                        where: { businessId, services: { some: { serviceId } } }
                    });
                    if (!availableStaff) {
                        return res.status(400).json({
                            success: false,
                            message: "No staff members are assigned to this service."
                        });
                    }
                    assignedStaffId = availableStaff.id;
                }
                // Generate verification token
                const verificationToken = (0, crypto_1.randomBytes)(32).toString('hex');
                const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
                const booking = yield prisma_1.default.booking.create({
                    data: {
                        startTime,
                        endTime: finalEndTime,
                        customerName,
                        customerEmail,
                        customerPhone: customerPhone || '',
                        notes: notes || '',
                        status: 'UNVERIFIED',
                        isEmailVerified: false,
                        verificationToken,
                        verificationTokenExpires,
                        customer: { connect: { id: customer.id } },
                        service: { connect: { id: serviceId } },
                        business: { connect: { id: businessId } },
                        staff: { connect: { id: assignedStaffId } }
                    },
                    include: { staff: true }
                });
                // Send verification email with booking details
                try {
                    const bookingDate = startTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    const bookingTime = startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    yield email_service_1.emailService.sendVerificationCustomerEmail(customerEmail, verificationToken, {
                        customerName,
                        serviceName: service.name,
                        date: bookingDate,
                        time: bookingTime,
                        staffName: ((_a = booking.staff) === null || _a === void 0 ? void 0 : _a.firstName) ? `${booking.staff.firstName} ${booking.staff.lastName}`.trim() : undefined,
                    });
                }
                catch (emailError) {
                    console.error('[v0] Failed to send verification email:', emailError);
                }
                return res.status(201).json({
                    success: true,
                    message: "Booking created! Check your email to verify.",
                    booking: { id: booking.id }
                });
            }
            catch (error) {
                console.error('[v0] Business public booking error:', error);
                res.status(500).json({ success: false, error: (error === null || error === void 0 ? void 0 : error.message) || "Failed to create booking" });
            }
        });
    }
    /**
     * Get available slots for BUSINESS BOOKINGS
     * Separate from staff individual bookings to keep flows independent
     */
    getBusinessAvailableSlots(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { serviceId, businessId } = req.params;
                const { date, staffId } = req.query;
                if (!date) {
                    return res.status(400).json({ success: false, error: "Date query parameter is required" });
                }
                const dateStr = (Array.isArray(date) ? date[0] : date);
                const [year, month, day] = dateStr.split('-').map(Number);
                const parsedDate = new Date(year, month - 1, day);
                // Ensure staffIdStr is a string or undefined (req.query can contain ParsedQs)
                const staffIdStr = typeof staffId === 'string' ? staffId : undefined;
                const slots = yield booking_service_1.default.getBusinessAvailableSlots(Array.isArray(serviceId) ? serviceId[0] : serviceId, Array.isArray(businessId) ? businessId[0] : businessId, parsedDate, staffIdStr);
                res.status(200).json({ success: true, data: slots });
            }
            catch (error) {
                console.error('[v0] Error getting business available slots:', error);
                res.status(500).json({ success: false, error: (error === null || error === void 0 ? void 0 : error.message) || "Error getting available slots" });
            }
        });
    }
    /**
     * Create a new booking for authenticated users
     */
    createBooking(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                console.log('[v0] createBooking called with body:', req.body);
                // Get userId from authenticated user (set by auth middleware)
                const userId = req.userId;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: "User ID is required. Please log in to create a booking."
                    });
                }
                const { businessId, staffId, serviceId, startTime: bodyStartTime, endTime: bodyEndTime, notes } = req.body;
                // Parse dates
                const startTime = bodyStartTime ? new Date(bodyStartTime) : null;
                const endTime = bodyEndTime ? new Date(bodyEndTime) : null;
                // Validate required fields
                if (!businessId || !serviceId || !startTime) {
                    return res.status(400).json({
                        success: false,
                        message: "Missing required fields: businessId, serviceId, startTime"
                    });
                }
                // Check subscription and feature gating
                const appointmentLimit = yield subscription_service_1.default.canAddAppointment(businessId);
                if (!appointmentLimit.allowed) {
                    console.warn('[v0] Booking limit exceeded for business:', businessId);
                    return res.status(429).json({
                        success: false,
                        message: appointmentLimit.reason || 'Booking limit reached. Please upgrade your subscription.',
                        error: 'LIMIT_EXCEEDED',
                    });
                }
                // Verify business exists
                const business = yield prisma_1.default.business.findUnique({
                    where: { id: businessId },
                    include: { user: true },
                });
                if (!business) {
                    return res.status(404).json({
                        success: false,
                        message: "Business not found"
                    });
                }
                // Validate business owner's email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(business.user.email)) {
                    return res.status(400).json({
                        success: false,
                        message: `The business owner's email has an invalid format. Please contact the business.`,
                        reason: 'invalid_email_format'
                    });
                }
                // Verify service exists and belongs to this business
                const service = yield prisma_1.default.service.findUnique({
                    where: { id: serviceId },
                });
                if (!service || service.businessId !== businessId) {
                    return res.status(404).json({
                        success: false,
                        message: "Service not found"
                    });
                }
                // Verify staff exists if provided
                if (staffId) {
                    const staff = yield prisma_1.default.staff.findUnique({
                        where: { id: staffId },
                    });
                    if (!staff || staff.businessId !== businessId) {
                        return res.status(404).json({
                            success: false,
                            message: "Staff member not found"
                        });
                    }
                }
                // Get authenticated user details for booking
                const user = yield prisma_1.default.user.findUnique({
                    where: { id: userId },
                });
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });
                }
                // Calculate end time if not provided
                const finalEndTime = endTime || new Date(startTime.getTime() + (service.duration || 60) * 60000);
                // Create booking for authenticated user with CONFIRMED status (no email verification needed)
                const bookingData = {
                    startTime,
                    endTime: finalEndTime,
                    customerName: `${(user.firstName || '') + ' ' + (user.lastName || '')}`.trim() || 'Guest',
                    customerEmail: user.email,
                    customerPhone: user.phone || '',
                    notes: notes || '',
                    status: 'CONFIRMED', // Authenticated users are immediately confirmed
                    isEmailVerified: true, // Already verified since user is authenticated
                    user: { connect: { id: userId } }, // Link to authenticated user using relation
                    service: { connect: { id: serviceId } },
                    business: { connect: { id: businessId } },
                };
                // Add staffId if provided
                if (staffId) {
                    bookingData.staff = { connect: { id: staffId } };
                }
                const booking = yield prisma_1.default.booking.create({
                    data: bookingData,
                    include: {
                        service: true,
                        business: true,
                        staff: true,
                        user: true,
                    },
                });
                console.log('[v0] Authenticated booking created (CONFIRMED):', booking.id);
                const emailWarnings = [];
                // Send email notification to business owner
                try {
                    if ((_a = business.user) === null || _a === void 0 ? void 0 : _a.email) {
                        const staffName = booking.staff ? `${booking.staff.firstName} ${booking.staff.lastName}`.trim() : undefined;
                        yield email_service_1.emailService.sendNewBookingNotification(business.user.email, {
                            customerName: booking.customerName,
                            customerEmail: booking.customerEmail,
                            customerPhone: booking.customerPhone,
                            serviceName: service.name,
                            staffName,
                            startTime: booking.startTime,
                            endTime: booking.endTime,
                            businessName: business.name,
                            notes: booking.notes || undefined,
                        });
                        console.log('[v0] Owner notification email sent to:', business.user.email);
                    }
                }
                catch (emailError) {
                    console.error('[v0] Failed to send email to owner:', emailError);
                    emailWarnings.push('Unable to notify business owner due to email delivery issue');
                }
                // Send confirmation email to authenticated user
                try {
                    yield email_service_1.emailService.sendBookingConfirmationToCustomer(booking.customerEmail, {
                        customerName: booking.customerName,
                        serviceName: service.name,
                        startTime: booking.startTime,
                        endTime: booking.endTime,
                        businessName: business.name,
                        businessPhone: business.phone || '',
                        businessAddress: business.address || '',
                    });
                    console.log('[v0] Customer confirmation email sent to:', booking.customerEmail);
                }
                catch (emailError) {
                    console.error('[v0] Failed to send confirmation email to customer:', emailError);
                    emailWarnings.push('Confirmation email could not be sent to ' + booking.customerEmail);
                }
                res.status(201).json({
                    success: true,
                    message: emailWarnings.length > 0
                        ? 'Booking created successfully, but there were issues sending emails. Please contact the business directly.'
                        : 'Booking created successfully. Check your email for confirmation.',
                    warnings: emailWarnings.length > 0 ? emailWarnings : undefined,
                    booking: {
                        id: booking.id,
                        startTime: booking.startTime,
                        endTime: booking.endTime,
                        status: booking.status,
                    }
                });
            }
            catch (error) {
                console.error('[v0] Error creating authenticated booking:', error instanceof Error ? error.message : String(error));
                res.status(500).json({
                    success: false,
                    message: "Error creating booking",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
    }
    /**
     * Get booking by ID
     */
    getBookingById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const booking = yield booking_service_1.default.getBookingById(Array.isArray(id) ? id[0] : id);
                if (booking) {
                    res.status(200).json(booking);
                }
                else {
                    res.status(404).json({ message: "Booking not found" });
                }
            }
            catch (error) {
                res.status(500).json({ message: "Error getting booking", error });
            }
        });
    }
    /**
     * Get all bookings for a business
     */
    getBusinessBookings(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.params;
                const { page, limit, status } = req.query;
                const result = yield booking_service_1.default.getBusinessBookings(Array.isArray(businessId) ? businessId[0] : businessId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 10, status);
                res.status(200).json(result);
            }
            catch (error) {
                res.status(500).json({ message: "Error getting business bookings", error });
            }
        });
    }
    /**
     * Get bookings for a customer
     */
    getCustomerBookings(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const bookings = yield booking_service_1.default.getCustomerBookings(Array.isArray(userId) ? userId[0] : userId);
                res.status(200).json(bookings);
            }
            catch (error) {
                res.status(500).json({ message: "Error getting customer bookings", error });
            }
        });
    }
    /**
     * Update booking status
     */
    updateBookingStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { status } = req.body;
                console.log('[v0] updateBookingStatus called with id:', id, 'status:', status);
                // Fetch booking before updating to get all relations
                const booking = yield booking_service_1.default.getBookingById(Array.isArray(id) ? id[0] : id);
                if (!booking) {
                    return res.status(404).json({
                        success: false,
                        message: 'Booking not found',
                    });
                }
                // Update the booking status
                const updatedBooking = yield booking_service_1.default.updateBookingStatus(Array.isArray(id) ? id[0] : id, status);
                console.log('[v0] Booking status updated to:', status);
                // Send notification based on status
                try {
                    console.log('[v0] Creating notification for booking status:', status, 'userId:', booking === null || booking === void 0 ? void 0 : booking.userId);
                    if (!(booking === null || booking === void 0 ? void 0 : booking.userId)) {
                        console.warn('[v0] Warning: booking.userId is null or undefined');
                        return;
                    }
                    // Fetch business name for notification messages
                    const business = yield prisma_1.default.business.findUnique({
                        where: { id: booking.businessId },
                        select: { name: true }
                    });
                    const businessName = (business === null || business === void 0 ? void 0 : business.name) || 'the business';
                    if (status === 'CONFIRMED') {
                        console.log('[v0] Sending confirmation notification for booking:', booking.id, 'userId:', booking.userId);
                        const notification = yield notification_service_1.default.sendBookingConfirmation(booking.id, booking.userId);
                        console.log('[v0] Confirmation notification created:', JSON.stringify(notification));
                        // Broadcast real-time notification
                        notification_sse_service_1.default.broadcastToUser(booking.userId, {
                            id: notification.id,
                            title: 'Booking Confirmed',
                            message: `Your booking has been confirmed!`,
                            type: 'BOOKING_CONFIRMATION',
                            createdAt: new Date(),
                        });
                    }
                    else if (status === 'COMPLETED') {
                        console.log('[v0] Sending completion notification for booking:', booking.id, 'userId:', booking.userId);
                        const notification = yield notification_service_1.default.createNotification({
                            userId: booking.userId,
                            type: 'BOOKING_CONFIRMATION',
                            title: 'Booking Completed',
                            message: `Your booking with ${businessName} has been completed. Please leave a review!`,
                            bookingId: booking.id,
                        });
                        console.log('[v0] Completion notification created:', JSON.stringify(notification));
                        // Broadcast real-time notification
                        notification_sse_service_1.default.broadcastToUser(booking.userId, {
                            id: notification.id,
                            title: 'Booking Completed',
                            message: `Your booking with ${businessName} has been completed. Please leave a review!`,
                            type: 'BOOKING_CONFIRMATION',
                            createdAt: new Date(),
                        });
                    }
                    else if (status === 'CANCELLED') {
                        console.log('[v0] Sending cancellation notification for booking:', booking.id, 'userId:', booking.userId);
                        const notification = yield notification_service_1.default.createNotification({
                            userId: booking.userId,
                            type: 'BOOKING_CANCELLATION',
                            title: 'Booking Cancelled',
                            message: `Your booking with ${businessName} has been cancelled.`,
                            bookingId: booking.id,
                        });
                        console.log('[v0] Cancellation notification created:', JSON.stringify(notification));
                        // Broadcast real-time notification
                        notification_sse_service_1.default.broadcastToUser(booking.userId, {
                            id: notification.id,
                            title: 'Booking Cancelled',
                            message: `Your booking with ${businessName} has been cancelled.`,
                            type: 'BOOKING_CANCELLATION',
                            createdAt: new Date(),
                        });
                    }
                }
                catch (notificationError) {
                    console.error('[v0] Error sending notification:', notificationError instanceof Error ? notificationError.message : notificationError);
                    console.error('[v0] Full error:', notificationError);
                    // Don't fail the request if notification fails
                }
                res.status(200).json({
                    success: true,
                    message: 'Booking status updated successfully',
                    data: updatedBooking,
                });
            }
            catch (error) {
                console.error('[v0] Error updating booking status:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error updating booking status',
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        });
    }
    /**
     * Update booking
     */
    updateBooking(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const booking = yield booking_service_1.default.updateBooking(Array.isArray(id) ? id[0] : id, req.body);
                res.status(200).json(booking);
            }
            catch (error) {
                res.status(500).json({ message: "Error updating booking", error });
            }
        });
    }
    /**
     * Cancel booking
     */
    cancelBooking(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const booking = yield booking_service_1.default.cancelBooking(Array.isArray(id) ? id[0] : id);
                res.status(200).json(booking);
            }
            catch (error) {
                res.status(500).json({ message: "Error canceling booking", error });
            }
        });
    }
    /**
     * Delete booking
     */
    deleteBooking(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                yield booking_service_1.default.deleteBooking(Array.isArray(id) ? id[0] : id);
                res.status(204).send(); // No Content
            }
            catch (error) {
                res.status(500).json({ message: "Error deleting booking", error });
            }
        });
    }
    /**
   * Get available slots
   */
    getAvailableSlots(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { serviceId, businessId } = req.params;
                const { date, staffId } = req.query;
                if (!date) {
                    res.status(400).json({
                        success: false,
                        error: "Date query parameter is required"
                    });
                    return;
                }
                // Parse date string "YYYY-MM-DD" properly to avoid timezone issues
                const dateStr = (Array.isArray(date) ? date[0] : date);
                const [year, month, day] = dateStr.split('-').map(Number);
                const parsedDate = new Date(year, month - 1, day);
                // Optional staffId - if provided, filter slots for that specific staff
                const staffIdStr = typeof staffId === 'string' ? staffId : undefined;
                const slots = yield booking_service_1.default.getAvailableSlots(Array.isArray(serviceId) ? serviceId[0] : serviceId, Array.isArray(businessId) ? businessId[0] : businessId, parsedDate, staffIdStr);
                res.status(200).json({
                    success: true,
                    data: slots
                });
            }
            catch (error) {
                console.error('[v0] Error getting available slots:', error);
                res.status(500).json({
                    success: false,
                    error: (error === null || error === void 0 ? void 0 : error.message) || "Error getting available slots"
                });
            }
        });
    }
    /**
     * Create a public booking (no authentication required)
     * Used for guest customers to book services without creating an account
     */
    createPublicBooking(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const { businessId, staffId, serviceId, startTime, endTime, customerName, customerEmail, customerPhone, notes } = req.body;
                // Validate required fields
                if (!businessId || !serviceId || !customerName || !customerEmail || !customerPhone) {
                    res.status(400).json({
                        success: false,
                        message: "Missing required fields: businessId, serviceId, customerName, customerEmail, customerPhone"
                    });
                    return;
                }
                // Validate customer email format (basic check only)
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(customerEmail)) {
                    return res.status(400).json({
                        success: false,
                        message: "Please provide a valid email address",
                        reason: 'invalid_email_format'
                    });
                }
                // Note: Full email validation will happen after customer verifies email
                // Verify business exists
                const business = yield prisma_1.default.business.findUnique({
                    where: { id: businessId },
                    include: { user: true },
                });
                if (!business) {
                    return res.status(404).json({
                        success: false,
                        message: "Business not found"
                    });
                }
                // Validate business owner's email exists and is valid format
                if (!((_a = business.user) === null || _a === void 0 ? void 0 : _a.email)) {
                    return res.status(400).json({
                        success: false,
                        message: "Business owner email is not configured. Please contact the business to update their contact information."
                    });
                }
                // Validate business owner's email format (basic validation only)
                if (!emailRegex.test(business.user.email)) {
                    return res.status(400).json({
                        success: false,
                        message: `The business owner's email (${business.user.email}) has an invalid format. The business owner needs to update their email address. Please contact the business to complete this setup.`,
                        reason: 'invalid_email_format'
                    });
                }
                // Verify service exists and belongs to this business
                const service = yield prisma_1.default.service.findUnique({
                    where: { id: serviceId },
                });
                if (!service || service.businessId !== businessId) {
                    return res.status(404).json({
                        success: false,
                        message: "Service not found"
                    });
                }
                // Verify staff exists if provided
                if (staffId) {
                    const staff = yield prisma_1.default.staff.findUnique({
                        where: { id: staffId },
                    });
                    if (!staff || staff.businessId !== businessId) {
                        return res.status(404).json({
                            success: false,
                            message: "Staff member not found"
                        });
                    }
                }
                // Check if customer already exists
                let customer;
                let isNewCustomer = false;
                const existingCustomer = yield prisma_1.default.customer.findUnique({
                    where: {
                        businessId_email: {
                            businessId,
                            email: customerEmail,
                        },
                    },
                });
                if (existingCustomer) {
                    // Existing customer - use the existing record
                    customer = existingCustomer;
                    isNewCustomer = false;
                    console.log('[v0] Existing customer found:', customer.id);
                }
                else {
                    // New customer - create a new record
                    try {
                        customer = yield prisma_1.default.customer.create({
                            data: {
                                businessId,
                                name: customerName,
                                email: customerEmail,
                                phone: customerPhone,
                                notes: notes || '',
                            },
                        });
                        isNewCustomer = true;
                        console.log('[v0] New guest customer created:', customer.id);
                    }
                    catch (err) {
                        console.error('[v0] Error creating customer:', err);
                        return res.status(500).json({
                            success: false,
                            message: "Failed to create customer",
                            error: err.message,
                        });
                    }
                }
                // Generate verification token only for new customers (24 hours validity)
                let verificationToken = null;
                let verificationTokenExpires = null;
                if (isNewCustomer) {
                    verificationToken = (0, crypto_1.randomBytes)(32).toString('hex');
                    verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
                }
                // Determine booking status: CONFIRMED for existing customers, UNVERIFIED for new customers
                const bookingStatus = isNewCustomer ? 'UNVERIFIED' : 'CONFIRMED';
                const isEmailVerified = isNewCustomer ? false : true;
                // Create a guest booking
                const bookingData = Object.assign(Object.assign({ startTime: new Date(startTime), endTime: new Date(endTime), customerName,
                    customerEmail,
                    customerPhone, notes: notes || '', status: bookingStatus, isEmailVerified }, (isNewCustomer && { verificationToken, verificationTokenExpires })), { service: { connect: { id: serviceId } }, business: { connect: { id: businessId } }, customer: { connect: { id: customer.id } } });
                // Add staffId if provided
                if (staffId) {
                    bookingData.staff = { connect: { id: staffId } };
                }
                const booking = yield prisma_1.default.booking.create({
                    data: bookingData,
                    include: {
                        service: true,
                        business: true,
                        staff: true,
                        customer: true,
                    },
                });
                console.log(`[v0] Public booking created (${bookingStatus}):`, booking.id);
                const emailWarnings = [];
                // Send email notification to business owner
                try {
                    if ((_b = business.user) === null || _b === void 0 ? void 0 : _b.email) {
                        yield email_service_1.emailService.sendNewBookingNotification(business.user.email, {
                            customerName,
                            customerEmail,
                            customerPhone,
                            serviceName: service.name,
                            startTime: booking.startTime,
                            endTime: booking.endTime,
                            businessName: business.name,
                            notes,
                        });
                        console.log('[v0] Owner notification email sent to:', business.user.email);
                    }
                }
                catch (emailError) {
                    console.error('[v0] Failed to send email to owner:', emailError);
                    emailWarnings.push('Unable to notify business owner due to email delivery issue');
                }
                // Send verification email only for NEW customers (existing customers are auto-confirmed)
                if (isNewCustomer && verificationToken) {
                    try {
                        const staffName = booking.staff ? `${booking.staff.firstName} ${booking.staff.lastName}`.trim() : undefined;
                        const verificationSent = yield email_service_1.emailService.sendVerificationCustomerEmail(customerEmail, verificationToken, {
                            customerName,
                            serviceName: service.name,
                            date: booking.startTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                            time: booking.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                            staffName,
                        });
                        if (!verificationSent) {
                            emailWarnings.push('Verification email could not be sent. Please check your email spam folder or contact the business.');
                        }
                        else {
                            console.log('[v0] Customer verification email sent to:', customerEmail);
                        }
                    }
                    catch (emailError) {
                        console.error('[v0] Failed to send verification email to customer:', emailError);
                        emailWarnings.push('Verification email could not be sent to ' + customerEmail);
                    }
                }
                else {
                    console.log('[v0] Existing customer - booking auto-confirmed without verification');
                }
                res.status(201).json({
                    success: true,
                    message: isNewCustomer
                        ? (emailWarnings.length > 0
                            ? 'Booking created! Please verify your email to confirm your appointment.'
                            : 'Booking created! Check your email to verify and confirm your appointment.')
                        : 'Booking confirmed! Your appointment is scheduled.',
                    warnings: emailWarnings.length > 0 ? emailWarnings : undefined,
                    booking: {
                        id: booking.id,
                        startTime: booking.startTime,
                        endTime: booking.endTime,
                        status: booking.status,
                        isNewCustomer,
                    }
                });
            }
            catch (error) {
                console.error('[v0] Error creating public booking:', error instanceof Error ? error.message : String(error));
                res.status(500).json({
                    success: false,
                    message: "Error creating booking",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
    }
    /**
     * Verify booking email and confirm the booking
     * Called when customer clicks verification link in email
     */
    verifyBookingEmail(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tokenParam = req.params.token;
                const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
                if (!token) {
                    return res.status(400).json({
                        success: false,
                        message: "Verification token is required"
                    });
                }
                // Find booking by verification token
                const booking = yield prisma_1.default.booking.findUnique({
                    where: { verificationToken: token },
                    include: { service: true, business: true }
                });
                if (!booking) {
                    return res.status(404).json({
                        success: false,
                        message: "Booking not found. The verification link may be invalid or expired."
                    });
                }
                // Check if token has expired
                if (booking.verificationTokenExpires && booking.verificationTokenExpires < new Date()) {
                    return res.status(400).json({
                        success: false,
                        message: "Verification link has expired. Please create a new booking."
                    });
                }
                // Check if already verified
                if (booking.isEmailVerified) {
                    return res.status(400).json({
                        success: false,
                        message: "This booking has already been verified."
                    });
                }
                // Update booking to CONFIRMED status and mark email as verified
                const confirmedBooking = yield prisma_1.default.booking.update({
                    where: { id: booking.id },
                    data: {
                        status: 'CONFIRMED',
                        isEmailVerified: true,
                        verificationToken: null, // Clear token after verification
                        verificationTokenExpires: null,
                    },
                    include: { service: true, business: true, customer: true }
                });
                console.log('[v0] Booking verified and confirmed:', booking.id);
                // Send confirmation email to customer
                try {
                    yield email_service_1.emailService.sendBookingConfirmationToCustomer(booking.customerEmail, {
                        customerName: booking.customerName,
                        serviceName: confirmedBooking.service.name,
                        startTime: confirmedBooking.startTime,
                        endTime: confirmedBooking.endTime,
                        businessName: confirmedBooking.business.name,
                        businessPhone: confirmedBooking.business.phone || '',
                        businessAddress: confirmedBooking.business.address || '',
                    });
                    console.log('[v0] Confirmation email sent to:', booking.customerEmail);
                }
                catch (emailError) {
                    console.error('[v0] Failed to send confirmation email:', emailError);
                    // Don't fail the verification if email send fails - booking is already confirmed
                }
                return res.status(200).json({
                    success: true,
                    message: 'Email verified! Your booking is now confirmed. Check your email for booking details.',
                    booking: {
                        id: confirmedBooking.id,
                        startTime: confirmedBooking.startTime,
                        endTime: confirmedBooking.endTime,
                        status: confirmedBooking.status,
                    }
                });
            }
            catch (error) {
                console.error('[v0] Error verifying booking email:', error instanceof Error ? error.message : String(error));
                res.status(500).json({
                    success: false,
                    message: "Error verifying booking",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
    }
    /**
     * Get booking trends
     */
    getBookingTrends(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.params;
                const { days } = req.query;
                const trends = yield booking_service_1.default.getBookingTrends(Array.isArray(businessId) ? businessId[0] : businessId, days ? parseInt(days) : 30);
                return res.status(200).json(trends);
            }
            catch (error) {
                res.status(500).json({ message: "Error getting booking trends", error });
            }
        });
    }
}
exports.default = new BookingController();
