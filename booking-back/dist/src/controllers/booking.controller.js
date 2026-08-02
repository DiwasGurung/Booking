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
const booking_service_1 = __importDefault(require("../services/booking.service"));
const notification_service_1 = __importDefault(require("../services/notification.service"));
const notification_sse_service_1 = __importDefault(require("../services/notification-sse.service"));
const email_service_1 = require("../services/email.service");
const subscription_service_1 = __importDefault(require("../services/subscription.service"));
const prisma_1 = __importDefault(require("../lib/prisma"));
class BookingController {
    /**
     * Create a new booking for authenticated users
     */
    createBooking(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                console.log('[v0] createBooking called with body:', req.body);
                // Get userId from authenticated user
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        message: "User ID is required. Please log in to create a booking."
                    });
                    return;
                }
                const { businessId, staffId, serviceId, appointmentDate, customerName, customerEmail, customerPhone, notes } = req.body;
                // Validate required fields
                if (!businessId || !serviceId || !appointmentDate || !customerName || !customerEmail || !customerPhone) {
                    res.status(400).json({
                        success: false,
                        message: "Missing required fields: businessId, serviceId, appointmentDate, customerName, customerEmail, customerPhone"
                    });
                    return;
                }
                // Check subscription and feature gating
                const appointmentLimit = yield subscription_service_1.default.canAddAppointment(businessId);
                if (!appointmentLimit.allowed) {
                    console.warn('[v0] Booking limit exceeded for business:', businessId);
                    res.status(429).json({
                        success: false,
                        message: appointmentLimit.reason || 'Booking limit reached. Please upgrade your subscription.',
                        error: 'LIMIT_EXCEEDED',
                    });
                    return;
                }
                // Verify business exists
                const business = yield prisma_1.default.business.findUnique({
                    where: { id: businessId },
                    include: { user: true },
                });
                if (!business) {
                    res.status(404).json({
                        success: false,
                        message: "Business not found"
                    });
                    return;
                }
                // Verify service exists and belongs to this business
                const service = yield prisma_1.default.service.findUnique({
                    where: { id: serviceId },
                });
                if (!service || service.businessId !== businessId) {
                    res.status(404).json({
                        success: false,
                        message: "Service not found"
                    });
                    return;
                }
                // Verify staff exists if provided
                if (staffId) {
                    const staff = yield prisma_1.default.staff.findUnique({
                        where: { id: staffId },
                    });
                    if (!staff || staff.businessId !== businessId) {
                        res.status(404).json({
                            success: false,
                            message: "Staff member not found"
                        });
                        return;
                    }
                }
                // Calculate start and end times based on service duration
                const startTime = new Date(appointmentDate);
                const endTime = new Date(startTime.getTime() + (service.duration || 60) * 60000); // duration is in minutes
                // Create booking for authenticated user (linked to userId, not customerId)
                const bookingData = {
                    startTime,
                    endTime,
                    customerName,
                    customerEmail,
                    customerPhone,
                    notes: notes || '',
                    status: 'PENDING',
                    userId, // Link to authenticated user
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
                console.log('[v0] Authenticated booking created:', booking.id);
                const emailWarnings = [];
                // Send email notification to business owner
                try {
                    if ((_b = business.user) === null || _b === void 0 ? void 0 : _b.email) {
                        let staffName;
                        if (booking.staff) {
                            staffName = `${booking.staff.firstName} ${booking.staff.lastName}`;
                        }
                        yield email_service_1.emailService.sendNewBookingNotification(business.user.email, {
                            customerName,
                            customerEmail,
                            customerPhone,
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
                // Send confirmation email to customer
                try {
                    yield email_service_1.emailService.sendBookingConfirmationToCustomer(customerEmail, {
                        customerName,
                        serviceName: service.name,
                        startTime: booking.startTime,
                        endTime: booking.endTime,
                        businessName: business.name,
                        businessPhone: business.phone || '',
                        businessAddress: business.address || '',
                    });
                    console.log('[v0] Customer confirmation email sent to:', customerEmail);
                }
                catch (emailError) {
                    console.error('[v0] Failed to send confirmation email to customer:', emailError);
                    emailWarnings.push('Confirmation email could not be sent to ' + customerEmail);
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
                    res.status(404).json({
                        success: false,
                        message: 'Booking not found',
                    });
                    return;
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
                const { date } = req.query;
                if (!date) {
                    res.status(400).json({ message: "Date query parameter is required" });
                    return;
                }
                const slots = yield booking_service_1.default.getAvailableSlots(Array.isArray(serviceId) ? serviceId[0] : serviceId, Array.isArray(businessId) ? businessId[0] : businessId, new Date(date));
                res.status(200).json(slots);
            }
            catch (error) {
                res.status(500).json({ message: "Error getting available slots", error });
            }
        });
    }
    /**
     * Create a public booking (no authentication required)
     * Used for guest customers to book services without creating an account
     */
    createPublicBooking(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
                // Verify business exists
                const business = yield prisma_1.default.business.findUnique({
                    where: { id: businessId },
                    include: { user: true },
                });
                if (!business) {
                    res.status(404).json({
                        success: false,
                        message: "Business not found"
                    });
                    return;
                }
                const emailValidation = yield email_service_1.emailService.validateEmailAddress(customerEmail);
                if (!emailValidation.isValid) {
                    console.warn('[v0] Customer email validation failed:', emailValidation.reason);
                    res.status(400).json({
                        success: false,
                        message: `The email address (${customerEmail}) is invalid or does not exist. Please provide a valid email address.`,
                        reason: emailValidation.reason
                    });
                    return;
                }
                // Verify service exists and belongs to this business
                const service = yield prisma_1.default.service.findUnique({
                    where: { id: serviceId },
                });
                if (!service || service.businessId !== businessId) {
                    res.status(404).json({
                        success: false,
                        message: "Service not found"
                    });
                    return;
                }
                // Verify staff exists if provided
                if (staffId) {
                    const staff = yield prisma_1.default.staff.findUnique({
                        where: { id: staffId },
                    });
                    if (!staff || staff.businessId !== businessId) {
                        res.status(404).json({
                            success: false,
                            message: "Staff member not found"
                        });
                        return;
                    }
                }
                // Create or get existing customer record for the guest
                let customer;
                try {
                    // Try to create a new customer
                    customer = yield prisma_1.default.customer.create({
                        data: {
                            businessId,
                            name: customerName,
                            email: customerEmail,
                            phone: customerPhone,
                            notes: notes || '',
                        },
                    });
                    console.log('[v0] Guest customer created:', customer.id);
                }
                catch (err) {
                    // If customer already exists with this email, use the existing one
                    if (err.code === 'P2002') {
                        console.log('[v0] Customer with this email already exists, using existing customer');
                        customer = yield prisma_1.default.customer.findUnique({
                            where: {
                                businessId_email: {
                                    businessId,
                                    email: customerEmail,
                                },
                            },
                        });
                        if (!customer) {
                            res.status(500).json({
                                success: false,
                                message: "Failed to create or retrieve customer",
                                error: err.message,
                            });
                            return;
                        }
                    }
                    else {
                        console.error('[v0] Error creating customer:', err);
                        res.status(500).json({
                            success: false,
                            message: "Failed to create customer",
                            error: err.message,
                        });
                        return;
                    }
                }
                // Create a guest booking with the customer
                const bookingData = {
                    startTime: new Date(startTime),
                    endTime: new Date(endTime),
                    customerName,
                    customerEmail,
                    customerPhone,
                    notes: notes || '',
                    status: 'PENDING',
                    service: { connect: { id: serviceId } },
                    business: { connect: { id: businessId } },
                    customer: { connect: { id: customer.id } }, // Associate with guest customer
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
                        customer: true,
                    },
                });
                console.log('[v0] Public booking created:', booking.id);
                const emailWarnings = [];
                // Send email notification to business owner
                try {
                    if ((_a = business.user) === null || _a === void 0 ? void 0 : _a.email) {
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
                // Send confirmation email to customer
                try {
                    yield email_service_1.emailService.sendBookingConfirmationToCustomer(customerEmail, {
                        customerName,
                        serviceName: service.name,
                        startTime: booking.startTime,
                        endTime: booking.endTime,
                        businessName: business.name,
                        businessPhone: business.phone || '',
                        businessAddress: business.address || '',
                    });
                    console.log('[v0] Customer confirmation email sent to:', customerEmail);
                }
                catch (emailError) {
                    console.error('[v0] Failed to send confirmation email to customer:', emailError);
                    emailWarnings.push('Confirmation email could not be sent to ' + customerEmail);
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
     * Get booking trends
     */
    getBookingTrends(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.params;
                const { days } = req.query;
                const trends = yield booking_service_1.default.getBookingTrends(Array.isArray(businessId) ? businessId[0] : businessId, days ? parseInt(days) : 30);
                res.status(200).json(trends);
            }
            catch (error) {
                res.status(500).json({ message: "Error getting booking trends", error });
            }
        });
    }
}
exports.default = new BookingController();
