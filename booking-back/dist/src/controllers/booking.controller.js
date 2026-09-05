"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const booking_service_1 = __importDefault(require("../services/booking.service"));
const email_service_1 = require("../services/email.service");
const subscription_service_1 = __importDefault(require("../services/subscription.service"));
const sparrow_sms_service_1 = __importDefault(require("../services/sparrow-sms.service"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const luxon_1 = require("luxon");
// Adjust to match your SubscriptionPlan enum's actual value for Enterprise.
const ENTERPRISE_PLAN = "ENTERPRISE";
/**
 * Reminders only fire for bookings still ahead of right-now (never
 * already-passed slots), gated to businesses on an active/trial
 * subscription with a plan whose feature flags allow it. Channel is
 * decided server-side from the plan's flags — never trust a client-sent
 * channel, since that would let a lower plan spoof SMS.
 */
async function getTodayReminderCandidates(businessId) {
    const BUSINESS_TZ = process.env.BUSINESS_TIME_ZONE || 'Asia/Kathmandu';
    const now = luxon_1.DateTime.now().setZone(BUSINESS_TZ);
    const endOfDay = now.endOf('day');
    return prisma_1.default.booking.findMany({
        where: {
            businessId,
            status: 'CONFIRMED',
            startTime: {
                gt: now.toJSDate(),
                lte: endOfDay.toJSDate(),
            },
        },
        include: { service: true },
    });
}
/**
 * Sends the customer-facing booking confirmation via the channel that
 * matches the business's plan: SMS for Enterprise, email for everyone
 * else. Fires unconditionally at booking-creation time — independent of
 * email/phone verification, which is a separate follow-up step for
 * unverified customers, not a gate on this confirmation.
 */
async function sendBookingConfirmationByPlan(businessId, business, booking, serviceName) {
    const isEnterprise = business.subscription?.plan?.name === ENTERPRISE_PLAN;
    if (isEnterprise) {
        if (!booking.customerPhone) {
            console.warn(`[v0] Enterprise business ${businessId} booking ${booking.id} has no customer phone; skipping SMS confirmation`);
            return;
        }
        const BUSINESS_TZ = process.env.BUSINESS_TIME_ZONE || 'Asia/Kathmandu';
        const dt = luxon_1.DateTime.fromJSDate(booking.startTime, { zone: BUSINESS_TZ });
        return sparrow_sms_service_1.default.sendBookingConfirmation(businessId, booking.customerPhone, {
            businessName: business.name,
            serviceName,
            date: dt.setLocale('en').toLocaleString({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            time: dt.setLocale('en').toLocaleString({ hour: '2-digit', minute: '2-digit' }),
            bookingId: booking.id,
        });
    }
    return email_service_1.emailService.sendBookingConfirmationToCustomer(booking.customerEmail, {
        customerName: booking.customerName,
        serviceName,
        startTime: booking.startTime,
        endTime: booking.endTime,
        businessName: business.name,
        businessPhone: business.phone || '',
        businessAddress: business.address || '',
    });
}
class BookingController {
    /**
     * Sends a reminder to every customer with a CONFIRMED booking later
     * today (strictly after "now", so already-passed or in-progress
     * appointments are skipped). Channel (SMS vs email) is derived from
     * the business's subscription plan feature flags, not client input.
     */
    async sendTodayReminders(req, res) {
        try {
            const { businessId } = req.params;
            const business = await prisma_1.default.business.findUnique({
                where: { id: businessId },
                include: {
                    subscription: { include: { plan: true } },
                },
            });
            if (!business) {
                return res.status(404).json({ success: false, message: 'Business not found' });
            }
            const BUSINESS_TZ = process.env.BUSINESS_TIME_ZONE || 'Asia/Kathmandu';
            const now = luxon_1.DateTime.now().setZone(BUSINESS_TZ);
            const startOfToday = now.startOf('day');
            // Enforce one send per calendar day (business's local day), regardless
            // of how many times the endpoint is hit.
            if (business.lastReminderSentAt) {
                const lastSent = luxon_1.DateTime.fromJSDate(business.lastReminderSentAt, { zone: BUSINESS_TZ });
                if (lastSent >= startOfToday) {
                    return res.status(409).json({
                        success: false,
                        message: `Reminders were already sent today at ${lastSent.toLocaleString(luxon_1.DateTime.TIME_SIMPLE)}. Try again tomorrow.`,
                        data: { alreadySentToday: true, lastSentAt: business.lastReminderSentAt },
                    });
                }
            }
            const subscription = business.subscription;
            const plan = subscription?.plan;
            const isSubscriptionUsable = subscription && (subscription.status === 'ACTIVE' || subscription.status === 'TRIAL');
            if (!isSubscriptionUsable || !plan) {
                return res.status(403).json({
                    success: false,
                    message: 'An active subscription is required to send reminders.',
                });
            }
            const canRemind = plan.allowSmsNotifications || plan.allowEmailNotifications;
            if (!canRemind) {
                return res.status(403).json({
                    success: false,
                    message: 'Your current plan does not include appointment reminders.',
                });
            }
            const channel = plan.allowSmsNotifications ? 'sms' : 'email';
            const bookings = await getTodayReminderCandidates(businessId);
            if (bookings.length === 0) {
                // Nothing to send — don't stamp lastReminderSentAt, so the button
                // stays usable if a CONFIRMED booking shows up later the same day.
                return res.status(200).json({ success: true, data: { count: 0, channel } });
            }
            let sent = 0;
            const failures = [];
            if (channel === 'sms') {
                for (const booking of bookings) {
                    if (!booking.customerPhone) {
                        failures.push(booking.id);
                        continue;
                    }
                    const dt = luxon_1.DateTime.fromJSDate(booking.startTime, { zone: BUSINESS_TZ });
                    const hoursUntil = Math.max(1, Math.round(dt.diff(now, 'hours').hours));
                    const result = await sparrow_sms_service_1.default.sendAppointmentReminder(businessId, booking.customerPhone, {
                        businessName: business.name,
                        date: dt.setLocale('en').toLocaleString({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                        time: dt.setLocale('en').toLocaleString({ hour: '2-digit', minute: '2-digit' }),
                        hoursUntil,
                    });
                    if (result.success)
                        sent++;
                    else
                        failures.push(booking.id);
                }
            }
            else {
                for (const booking of bookings) {
                    try {
                        await email_service_1.emailService.sendAppointmentReminder(booking.customerEmail, {
                            customerName: booking.customerName,
                            serviceName: booking.service.name,
                            startTime: booking.startTime,
                            businessName: business.name,
                            businessPhone: business.phone,
                            businessAddress: business.address,
                        });
                        sent++;
                    }
                    catch (err) {
                        console.error('[v0] Failed to send reminder email:', booking.customerEmail, err);
                        failures.push(booking.id);
                    }
                }
            }
            // Stamp the send — this is what enforces the once-per-day rule on the
            // next attempt, whether that's a re-click, a reload, or a different tab.
            await prisma_1.default.business.update({
                where: { id: businessId },
                data: { lastReminderSentAt: now.toJSDate() },
            });
            return res.status(200).json({
                success: true,
                data: { count: sent, failed: failures.length, channel, alreadySentToday: false },
            });
        }
        catch (error) {
            console.error('[v0] Error sending today reminders:', error);
            return res.status(500).json({
                success: false,
                error: error?.message || 'Failed to send reminders',
            });
        }
    }
    /**
     * Create a booking for BUSINESS - Authenticated User
     * Separate from staff individual bookings to keep flows independent
     */
    async createBusinessBooking(req, res) {
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
            const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            // Get service for duration
            const service = await prisma_1.default.service.findUnique({ where: { id: serviceId } });
            if (!service) {
                return res.status(404).json({ success: false, message: "Service not found" });
            }
            const finalEndTime = endTime || new Date(startTime.getTime() + (service.duration || 60) * 60000);
            // Auto-assign staff if not provided — pick one who is actually FREE at this
            // time so bookings spread across staff and slots fill up correctly.
            let assignedStaffId = staffId;
            if (!assignedStaffId) {
                const candidates = await prisma_1.default.staff.findMany({
                    where: { businessId, isActive: true, services: { some: { serviceId } } }
                });
                if (candidates.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "No staff members are assigned to this service."
                    });
                }
                const conflicts = await prisma_1.default.booking.findMany({
                    where: {
                        staffId: { in: candidates.map(c => c.id) },
                        status: "CONFIRMED",
                        startTime: { lt: finalEndTime },
                        endTime: { gt: startTime },
                    },
                    select: { staffId: true }
                });
                const busyStaff = new Set(conflicts.map(c => c.staffId));
                const freeStaff = candidates.find(c => !busyStaff.has(c.id));
                if (!freeStaff) {
                    return res.status(400).json({
                        success: false,
                        message: "No staff members are available at this time. Please pick another slot."
                    });
                }
                assignedStaffId = freeStaff.id;
            }
            const booking = await prisma_1.default.booking.create({
                data: {
                    startTime,
                    endTime: finalEndTime,
                    customerName: user?.firstName || 'Guest',
                    customerEmail: user?.email,
                    customerPhone: user?.phone || '',
                    notes: notes || '',
                    status: 'CONFIRMED',
                    isEmailVerified: true,
                    user: { connect: { id: userId } },
                    service: { connect: { id: serviceId } },
                    business: { connect: { id: businessId } },
                    staff: { connect: { id: assignedStaffId } }
                }
            });
            // Send confirmation (SMS for Enterprise, email otherwise) — fires
            // every time, regardless of verification state.
            try {
                const businessForNotify = await prisma_1.default.business.findUnique({
                    where: { id: businessId },
                    include: { subscription: { select: { plan: { select: { name: true } } } } },
                });
                if (businessForNotify) {
                    await sendBookingConfirmationByPlan(businessId, businessForNotify, booking, service.name);
                }
            }
            catch (notifyError) {
                console.error('[v0] Failed to send booking confirmation:', notifyError);
            }
            return res.status(201).json({
                success: true,
                message: "Booking created successfully!",
                booking: { id: booking.id }
            });
        }
        catch (error) {
            console.error('[v0] Business booking error:', error);
            res.status(500).json({ success: false, error: error?.message || "Failed to create booking" });
        }
    }
    async createBusinessPublicBooking(req, res) {
        try {
            const { businessId, staffId, serviceId, startTime: bodyStartTime, endTime: bodyEndTime, customerName, customerEmail, customerPhone, notes } = req.body;
            const startTime = bodyStartTime ? new Date(bodyStartTime) : null;
            if (!businessId || !serviceId || !startTime || !customerEmail) {
                res.status(400).json({ success: false, message: "Missing required fields" });
                return;
            }
            const business = await prisma_1.default.business.findUnique({
                where: { id: businessId },
                include: { subscription: { include: { plan: true } } },
            });
            if (!business) {
                res.status(404).json({ success: false, message: "Business not found" });
                return;
            }
            const service = await prisma_1.default.service.findUnique({ where: { id: serviceId } });
            if (!service) {
                res.status(404).json({ success: false, message: "Service not found" });
                return;
            }
            const finalEndTime = bodyEndTime ? new Date(bodyEndTime) : new Date(startTime.getTime() + (service.duration || 60) * 60000);
            let customer = await prisma_1.default.customer.findUnique({
                where: { businessId_email: { businessId, email: customerEmail } }
            });
            if (!customer) {
                customer = await prisma_1.default.customer.create({
                    data: { businessId, name: customerName, email: customerEmail, phone: customerPhone || '', isEmailVerified: false, isPhoneVerified: false }
                });
            }
            let assignedStaffId = staffId;
            if (!assignedStaffId) {
                const candidates = await prisma_1.default.staff.findMany({
                    where: { businessId, isActive: true, services: { some: { serviceId } } }
                });
                if (candidates.length === 0) {
                    res.status(400).json({ success: false, message: "No staff members are assigned to this service." });
                    return;
                }
                const conflicts = await prisma_1.default.booking.findMany({
                    where: {
                        staffId: { in: candidates.map(c => c.id) },
                        status: "CONFIRMED",
                        startTime: { lt: finalEndTime },
                        endTime: { gt: startTime },
                    },
                    select: { staffId: true }
                });
                const busyStaff = new Set(conflicts.map(c => c.staffId));
                const freeStaff = candidates.find(c => !busyStaff.has(c.id));
                if (!freeStaff) {
                    res.status(400).json({ success: false, message: "No staff members are available at this time. Please pick another slot." });
                    return;
                }
                assignedStaffId = freeStaff.id;
            }
            const planName = business.subscription?.plan?.name;
            const isStarterPlan = planName === 'STARTER';
            const alreadyVerified = isStarterPlan
                ? customer.isEmailVerified === true
                : customer.isPhoneVerified === true;
            const verificationToken = isStarterPlan && !alreadyVerified ? (0, crypto_1.randomBytes)(32).toString('hex') : null;
            const verificationTokenExpires = isStarterPlan && !alreadyVerified ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;
            const booking = await prisma_1.default.booking.create({
                data: {
                    startTime,
                    endTime: finalEndTime,
                    customerName,
                    customerEmail,
                    customerPhone: customerPhone || '',
                    notes: notes || '',
                    status: alreadyVerified ? 'CONFIRMED' : 'UNVERIFIED',
                    isEmailVerified: isStarterPlan ? alreadyVerified : (customer.isEmailVerified === true),
                    isPhoneVerified: isStarterPlan ? (customer.isPhoneVerified === true) : alreadyVerified,
                    ...(isStarterPlan && !alreadyVerified ? { verificationToken, verificationTokenExpires } : {}),
                    customer: { connect: { id: customer.id } },
                    service: { connect: { id: serviceId } },
                    business: { connect: { id: businessId } },
                    staff: { connect: { id: assignedStaffId } }
                },
                include: {
                    staff: true,
                    service: true,
                    business: { include: { subscription: { select: { plan: { select: { name: true } } } } } },
                }
            });
            try {
                await sendBookingConfirmationByPlan(businessId, booking.business, booking, booking.service.name);
            }
            catch (notifyError) {
                console.error('[v0] Failed to send booking confirmation:', notifyError);
            }
            if (isStarterPlan && !alreadyVerified && verificationToken) {
                const BUSINESS_TZ = process.env.BUSINESS_TIME_ZONE || 'Asia/Kathmandu';
                const dt = luxon_1.DateTime.fromJSDate(startTime, { zone: BUSINESS_TZ });
                try {
                    await email_service_1.emailService.sendVerificationCustomerEmail(customerEmail, verificationToken, {
                        customerName,
                        serviceName: service.name,
                        date: dt.setLocale('en').toLocaleString({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                        time: dt.setLocale('en').toLocaleString({ hour: '2-digit', minute: '2-digit' }),
                        startTime: booking.startTime,
                        endTime: booking.endTime,
                        staffName: booking.staff ? `${booking.staff.firstName} ${booking.staff.lastName}`.trim() : undefined,
                    });
                }
                catch (emailError) {
                    console.error('[v0] Failed to send verification email:', emailError);
                }
            }
            res.status(201).json({
                success: true,
                message: alreadyVerified
                    ? "Booking confirmed!"
                    : isStarterPlan
                        ? "Booking created! Check your email to verify."
                        : "Booking created! Please verify your phone number to confirm your appointment.",
                booking: {
                    id: booking.id,
                    status: booking.status,
                    isEmailVerified: booking.isEmailVerified,
                    isPhoneVerified: booking.isPhoneVerified,
                    verificationChannel: isStarterPlan ? 'email' : 'phone',
                }
            });
            return;
        }
        catch (error) {
            console.error('[v0] Business public booking error:', error);
            res.status(500).json({ success: false, error: error?.message || "Failed to create booking" });
        }
    }
    /**
       * Create a new booking for authenticated users
       */
    async createBooking(req, res) {
        try {
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
            const appointmentLimit = await subscription_service_1.default.canAddAppointment(businessId);
            if (!appointmentLimit.allowed) {
                console.warn('[v0] Booking limit exceeded for business:', businessId);
                return res.status(429).json({
                    success: false,
                    message: appointmentLimit.reason || 'Booking limit reached. Please upgrade your subscription.',
                    error: 'APPOINTMENT_LIMIT_EXCEEDED',
                    current: appointmentLimit.current,
                    limit: appointmentLimit.limit,
                    overLimit: true,
                });
            }
            // Verify business exists
            const business = await prisma_1.default.business.findUnique({
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
            const service = await prisma_1.default.service.findUnique({
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
                const staff = await prisma_1.default.staff.findUnique({
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
            const user = await prisma_1.default.user.findUnique({
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
            const booking = await prisma_1.default.booking.create({
                data: bookingData,
                include: {
                    service: true,
                    business: true,
                    staff: true,
                    user: true,
                },
            });
            const emailWarnings = [];
            // Send email notification to business owner
            try {
                if (business.user?.email) {
                    const staffName = booking.staff ? `${booking.staff.firstName} ${booking.staff.lastName}`.trim() : undefined;
                    await email_service_1.emailService.sendNewBookingNotification(business.user.email, {
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
                }
            }
            catch (emailError) {
                console.error('[v0] Failed to send email to owner:', emailError);
                emailWarnings.push('Unable to notify business owner due to email delivery issue');
            }
            // Send confirmation email to authenticated user
            try {
                await email_service_1.emailService.sendBookingConfirmationToCustomer(booking.customerEmail, {
                    customerName: booking.customerName,
                    serviceName: service.name,
                    startTime: booking.startTime,
                    endTime: booking.endTime,
                    businessName: business.name,
                    businessPhone: business.phone || '',
                    businessAddress: business.address || '',
                });
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
    }
    /**
    * Get available slots for BUSINESS BOOKINGS
    * Separate from staff individual bookings to keep flows independent
    */
    async getBusinessAvailableSlots(req, res) {
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
            const slots = await booking_service_1.default.getBusinessAvailableSlots(Array.isArray(serviceId) ? serviceId[0] : serviceId, Array.isArray(businessId) ? businessId[0] : businessId, parsedDate, staffIdStr);
            res.status(200).json({ success: true, data: slots });
        }
        catch (error) {
            console.error('[v0] Error getting business available slots:', error);
            res.status(500).json({ success: false, error: error?.message || "Error getting available slots" });
        }
    }
    /**
     * Get booking by ID
     */
    async getBookingById(req, res) {
        try {
            const { id } = req.params;
            const booking = await booking_service_1.default.getBookingById(Array.isArray(id) ? id[0] : id);
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
    }
    /**
       * Get all bookings for a business with optional filters
       */
    async getBusinessBookings(req, res) {
        try {
            const { businessId } = req.params;
            // Explicitly type req.query
            const { page, limit, status, staffId, verified, startDate, endDate, } = req.query;
            // Helper to parse date strings into Date objects
            const parseDate = (value) => {
                if (value && !Number.isNaN(Date.parse(value))) {
                    return new Date(value);
                }
                return undefined;
            };
            const parsedStartDate = parseDate(startDate);
            const parsedEndDate = parseDate(endDate);
            // Convert verified string to boolean
            const verifiedValue = verified === 'true' ? true : verified === 'false' ? false : undefined;
            // Validate status against BookingStatus enum
            const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED'];
            let validatedStatus;
            if (status && validStatuses.includes(status)) {
                validatedStatus = status;
            }
            // Call service with validated and parsed parameters
            const result = await booking_service_1.default.getBusinessBookings(Array.isArray(businessId) ? businessId[0] : businessId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 10, validatedStatus, staffId, verifiedValue, parsedStartDate, parsedEndDate);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ message: 'Error getting business bookings', error });
        }
    }
    /**
     * Get bookings for a customer
     */
    async getCustomerBookings(req, res) {
        try {
            const { userId } = req.params;
            const bookings = await booking_service_1.default.getCustomerBookings(Array.isArray(userId) ? userId[0] : userId);
            res.status(200).json(bookings);
        }
        catch (error) {
            res.status(500).json({ message: "Error getting customer bookings", error });
        }
    }
    async updateBookingStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const bookingId = Array.isArray(id) ? id[0] : id;
            const booking = await booking_service_1.default.getBookingById(bookingId);
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found',
                });
            }
            // Capture the pre-update status BEFORE calling updateBookingStatus below —
            // we only notify on a CONFIRMED -> CANCELLED transition, not any other one.
            const wasConfirmed = booking.status === 'CONFIRMED';
            const isBeingCancelled = status === 'CANCELLED';
            const updatedBooking = await booking_service_1.default.updateBookingStatus(bookingId, status);
            if (wasConfirmed && isBeingCancelled) {
                try {
                    const [business, service] = await Promise.all([
                        prisma_1.default.business.findUnique({
                            where: { id: booking.businessId },
                            include: { subscription: { include: { plan: true } } },
                        }),
                        prisma_1.default.service.findUnique({ where: { id: booking.serviceId } }),
                    ]);
                    const subscription = business?.subscription;
                    const plan = subscription?.plan;
                    const isSubscriptionUsable = subscription && (subscription.status === 'ACTIVE' || subscription.status === 'TRIAL');
                    if (business && plan && isSubscriptionUsable) {
                        const BUSINESS_TZ = process.env.BUSINESS_TIME_ZONE || 'Asia/Kathmandu';
                        const dt = luxon_1.DateTime.fromJSDate(booking.startTime, { zone: BUSINESS_TZ });
                        if (plan.allowSmsNotifications) {
                            if (booking.customerPhone) {
                                await sparrow_sms_service_1.default.sendStatusChange(booking.businessId, booking.customerPhone, {
                                    businessName: business.name,
                                    date: dt.setLocale('en').toLocaleString({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                                    time: dt.setLocale('en').toLocaleString({ hour: '2-digit', minute: '2-digit' }),
                                    status: 'cancelled',
                                    bookingId: booking.id,
                                });
                            }
                            else {
                                console.warn(`[v0] Booking ${booking.id} cancelled but has no customerPhone; skipping SMS notification`);
                            }
                        }
                        else if (plan.allowEmailNotifications) {
                            await email_service_1.emailService.sendBookingCancellationToCustomer(booking.customerEmail, {
                                customerName: booking.customerName,
                                serviceName: service?.name || 'your service',
                                startTime: booking.startTime,
                                businessName: business.name,
                                businessPhone: business.phone,
                                businessAddress: business.address,
                            });
                        }
                    }
                }
                catch (notifyError) {
                    // Never let a notification failure block the status update itself.
                    console.error('[v0] Failed to send cancellation notification:', notifyError);
                }
            }
            return res.status(200).json({
                success: true,
                message: 'Booking status updated successfully',
                data: updatedBooking,
            });
        }
        catch (error) {
            console.error('[v0] Error updating booking status:', error);
            return res.status(500).json({
                success: false,
                message: 'Error updating booking status',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    /**
     * Update booking
     */
    async updateBooking(req, res) {
        try {
            const { id } = req.params;
            const booking = await booking_service_1.default.updateBooking(Array.isArray(id) ? id[0] : id, req.body);
            res.status(200).json(booking);
        }
        catch (error) {
            res.status(500).json({ message: "Error updating booking", error });
        }
    }
    /**
     * Cancel booking
     */
    async cancelBooking(req, res) {
        try {
            const { id } = req.params;
            const booking = await booking_service_1.default.cancelBooking(Array.isArray(id) ? id[0] : id);
            res.status(200).json(booking);
        }
        catch (error) {
            res.status(500).json({ message: "Error canceling booking", error });
        }
    }
    /**
     * Delete booking
     */
    async deleteBooking(req, res) {
        try {
            const { id } = req.params;
            await booking_service_1.default.deleteBooking(Array.isArray(id) ? id[0] : id);
            res.status(204).send(); // No Content
        }
        catch (error) {
            res.status(500).json({ message: "Error deleting booking", error });
        }
    }
    /**
   * Get available slots
   */
    async getAvailableSlots(req, res) {
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
            const slots = await booking_service_1.default.getAvailableSlots(Array.isArray(serviceId) ? serviceId[0] : serviceId, Array.isArray(businessId) ? businessId[0] : businessId, parsedDate, staffIdStr);
            res.status(200).json({
                success: true,
                data: slots
            });
        }
        catch (error) {
            console.error('[v0] Error getting available slots:', error);
            res.status(500).json({
                success: false,
                error: error?.message || "Error getting available slots"
            });
        }
    }
    async createPublicBooking(req, res) {
        try {
            const { businessId, staffId, serviceId, startTime, endTime, customerName, customerEmail, customerPhone, notes } = req.body;
            if (!businessId || !serviceId || !customerName || !customerEmail || !customerPhone) {
                res.status(400).json({
                    success: false,
                    message: "Missing required fields: businessId, serviceId, customerName, customerEmail, customerPhone"
                });
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(customerEmail)) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid email address",
                    reason: 'invalid_email_format'
                });
            }
            const business = await prisma_1.default.business.findUnique({
                where: { id: businessId },
                include: { user: true, subscription: { include: { plan: true } } },
            });
            if (!business) {
                return res.status(404).json({ success: false, message: "Business not found" });
            }
            if (!business.user?.email) {
                return res.status(400).json({
                    success: false,
                    message: "Business owner email is not configured. Please contact the business to update their contact information."
                });
            }
            if (!emailRegex.test(business.user.email)) {
                return res.status(400).json({
                    success: false,
                    message: `The business owner's email (${business.user.email}) has an invalid format. The business owner needs to update their email address. Please contact the business to complete this setup.`,
                    reason: 'invalid_email_format'
                });
            }
            const service = await prisma_1.default.service.findUnique({ where: { id: serviceId } });
            if (!service || service.businessId !== businessId) {
                return res.status(404).json({ success: false, message: "Service not found" });
            }
            if (staffId) {
                const staff = await prisma_1.default.staff.findUnique({ where: { id: staffId } });
                if (!staff || staff.businessId !== businessId) {
                    return res.status(404).json({ success: false, message: "Staff member not found" });
                }
            }
            let customer;
            let isNewCustomer = false;
            const existingCustomer = await prisma_1.default.customer.findUnique({
                where: { businessId_email: { businessId, email: customerEmail } },
            });
            if (existingCustomer) {
                customer = existingCustomer;
                isNewCustomer = false;
            }
            else {
                try {
                    customer = await prisma_1.default.customer.create({
                        data: {
                            businessId,
                            name: customerName,
                            email: customerEmail,
                            phone: customerPhone,
                            notes: notes || '',
                            isEmailVerified: false,
                            isPhoneVerified: false,
                        },
                    });
                    isNewCustomer = true;
                }
                catch (err) {
                    console.error('[v0] Error creating customer:', err);
                    return res.status(500).json({ success: false, message: "Failed to create customer", error: err.message });
                }
            }
            // Verification channel is decided by plan: Starter uses email-link
            // verification, every other plan uses phone OTP. This mirrors the
            // channel choice already used for confirmations (sendBookingConfirmationByPlan)
            // but is a separate decision — one picks how we NOTIFY, this picks how
            // we VERIFY a first-time customer.
            const planName = business.subscription?.plan?.name;
            const isStarterPlan = planName === 'STARTER';
            const alreadyVerified = isStarterPlan
                ? customer.isEmailVerified === true
                : customer.isPhoneVerified === true;
            const verificationToken = isStarterPlan && !alreadyVerified ? (0, crypto_1.randomBytes)(32).toString('hex') : null;
            const verificationTokenExpires = isStarterPlan && !alreadyVerified ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;
            const bookingData = {
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                customerName,
                customerEmail,
                customerPhone,
                notes: notes || '',
                status: alreadyVerified ? 'CONFIRMED' : 'UNVERIFIED',
                isEmailVerified: isStarterPlan ? alreadyVerified : (customer.isEmailVerified === true),
                isPhoneVerified: isStarterPlan ? (customer.isPhoneVerified === true) : alreadyVerified,
                ...(isStarterPlan && !alreadyVerified ? { verificationToken, verificationTokenExpires } : {}),
                service: { connect: { id: serviceId } },
                business: { connect: { id: businessId } },
                customer: { connect: { id: customer.id } },
            };
            if (staffId) {
                bookingData.staff = { connect: { id: staffId } };
            }
            const booking = await prisma_1.default.booking.create({
                data: bookingData,
                include: { service: true, business: true, staff: true, customer: true },
            });
            const warnings = [];
            try {
                if (business.user?.email) {
                    await email_service_1.emailService.sendNewBookingNotification(business.user.email, {
                        customerName, customerEmail, customerPhone,
                        serviceName: service.name,
                        startTime: booking.startTime,
                        endTime: booking.endTime,
                        businessName: business.name,
                        notes,
                    });
                }
            }
            catch (emailError) {
                console.error('[v0] Failed to send email to owner:', emailError);
                warnings.push('Unable to notify business owner due to email delivery issue');
            }
            // Confirmation channel (SMS for Enterprise, email otherwise) is
            // independent of the verification channel above and always fires.
            try {
                await sendBookingConfirmationByPlan(businessId, business, booking, service.name);
            }
            catch (notifyError) {
                console.error('[v0] Failed to send booking confirmation:', notifyError);
                warnings.push('Confirmation could not be sent to ' + customerEmail);
            }
            // Starter plan, first-time/unverified customer: send the email
            // verification link. Every other plan skips this entirely — those
            // customers verify by phone OTP via the public-verification routes,
            // triggered separately by the frontend after this response.
            if (isStarterPlan && !alreadyVerified && verificationToken) {
                try {
                    const staffName = booking.staff ? `${booking.staff.firstName} ${booking.staff.lastName}`.trim() : undefined;
                    const verificationSent = await email_service_1.emailService.sendVerificationCustomerEmail(customerEmail, verificationToken, {
                        customerName,
                        serviceName: service.name,
                        date: booking.startTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                        time: booking.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                        startTime: booking.startTime,
                        endTime: booking.endTime,
                        staffName,
                    });
                    if (!verificationSent) {
                        warnings.push('Verification email could not be sent. Please check your email spam folder or contact the business.');
                    }
                }
                catch (emailError) {
                    console.error('[v0] Failed to send verification email to customer:', emailError);
                    warnings.push('Verification email could not be sent to ' + customerEmail);
                }
            }
            res.status(201).json({
                success: true,
                message: alreadyVerified
                    ? 'Booking confirmed! Your appointment is scheduled.'
                    : isStarterPlan
                        ? 'Booking created! Check your email to verify and confirm your appointment.'
                        : 'Booking created! Please verify your phone number to confirm your appointment.',
                warnings: warnings.length > 0 ? warnings : undefined,
                booking: {
                    id: booking.id,
                    startTime: booking.startTime,
                    endTime: booking.endTime,
                    status: booking.status,
                    isEmailVerified: booking.isEmailVerified,
                    isPhoneVerified: booking.isPhoneVerified,
                    verificationChannel: isStarterPlan ? 'email' : 'phone',
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
    }
    async verifyBookingEmail(req, res) {
        try {
            const tokenParam = req.params.token;
            const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: "Verification token is required",
                });
            }
            // Fetch booking by verification token
            const booking = await prisma_1.default.booking.findUnique({
                where: { verificationToken: token },
                include: { service: true, business: true, customer: true },
            });
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: "Booking not found. The verification link may be invalid or expired.",
                });
            }
            // Check if token has expired
            if (booking.verificationTokenExpires) {
                const expiresAt = luxon_1.DateTime.fromJSDate(booking.verificationTokenExpires).toUTC();
                const now = luxon_1.DateTime.now().toUTC();
                if (expiresAt < now) {
                    return res.status(400).json({
                        success: false,
                        message: "Verification link has expired. Please create a new booking.",
                    });
                }
            }
            // Check if already verified
            if (booking.isEmailVerified) {
                return res.status(400).json({
                    success: false,
                    message: "This booking has already been verified.",
                });
            }
            // Mark customer as verified if customer exists
            if (booking.customer && !booking.customer.isEmailVerified) {
                await prisma_1.default.customer.update({
                    where: { id: booking.customer.id },
                    data: { isEmailVerified: true },
                });
            }
            // Update booking to CONFIRMED and clear token fields
            const confirmedBooking = await prisma_1.default.booking.update({
                where: { id: booking.id },
                data: {
                    status: 'CONFIRMED',
                    isEmailVerified: true,
                    verificationToken: null,
                    verificationTokenExpires: null,
                },
            });
            // NOTE: the booking confirmation (SMS/email) is already sent at
            // creation time in createBusinessPublicBooking / createPublicBooking,
            // regardless of verification status — so nothing is sent here to
            // avoid a duplicate confirmation. This step only unlocks the booking.
            // Respond success
            return res.status(200).json({
                success: true,
                message: 'Email verified! Your booking is now confirmed.',
                booking: {
                    id: confirmedBooking.id,
                    startTime: confirmedBooking.startTime,
                    endTime: confirmedBooking.endTime,
                    status: confirmedBooking.status,
                },
            });
        }
        catch (error) {
            console.error("[v0] Error verifying booking email:", error);
            return res.status(500).json({
                success: false,
                message: "An error occurred during verification.",
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    /**
     * Get booking trends
     */
    async getBookingTrends(req, res) {
        try {
            const { businessId } = req.params;
            const { days } = req.query;
            const trends = await booking_service_1.default.getBookingTrends(Array.isArray(businessId) ? businessId[0] : businessId, days ? parseInt(days) : 30);
            return res.status(200).json(trends);
        }
        catch (error) {
            res.status(500).json({ message: "Error getting booking trends", error });
        }
    }
}
exports.default = new BookingController();
