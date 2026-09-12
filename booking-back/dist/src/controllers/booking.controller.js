"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBookingConfirmationByPlan = sendBookingConfirmationByPlan;
const crypto_1 = require("crypto");
const booking_service_1 = __importDefault(require("../services/booking.service"));
const email_service_1 = require("../services/email.service");
const subscription_service_1 = __importDefault(require("../services/subscription.service"));
const sparrow_sms_service_1 = __importDefault(require("../services/sparrow-sms.service"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const luxon_1 = require("luxon");
// Adjust to match your SubscriptionPlan enum's actual value for Enterprise.
const ENTERPRISE_PLAN = "ENTERPRISE";
async function notifyCancellationByPlan(business, plan, booking, serviceName, reasonNote) {
    const BUSINESS_TZ = process.env.BUSINESS_TIME_ZONE || 'Asia/Kathmandu';
    const dt = luxon_1.DateTime.fromJSDate(booking.startTime, { zone: BUSINESS_TZ });
    if (plan.allowSmsNotifications) {
        if (!booking.customerPhone) {
            console.warn(`[v0] Booking ${booking.id} has no customerPhone; skipping SMS notification`);
            return { sent: false, channel: null };
        }
        await sparrow_sms_service_1.default.sendStatusChange(booking.businessId, booking.customerPhone, {
            businessName: business.name,
            date: dt.setLocale('en').toLocaleString({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            time: dt.setLocale('en').toLocaleString({ hour: '2-digit', minute: '2-digit' }),
            status: 'cancelled',
            bookingId: booking.id,
        });
        return { sent: true, channel: 'sms' };
    }
    if (plan.allowEmailNotifications) {
        await email_service_1.emailService.sendBookingCancellationToCustomer(booking.customerEmail, {
            customerName: booking.customerName,
            serviceName,
            startTime: booking.startTime,
            businessName: business.name,
            businessPhone: business.phone,
            businessAddress: business.address,
        });
        return { sent: true, channel: 'email' };
    }
    return { sent: false, channel: null };
}
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
const BUSINESS_TZ = process.env.BUSINESS_TIME_ZONE || 'Asia/Kathmandu';
function isStartTimeInFuture(startTime) {
    const now = luxon_1.DateTime.now().setZone(BUSINESS_TZ);
    const start = luxon_1.DateTime.fromJSDate(startTime).setZone(BUSINESS_TZ);
    return start > now;
}
/**
 * Sends the customer-facing booking confirmation via the channel that
 * matches the business's plan: SMS for Enterprise, email for everyone
 * else (Starter and Professional).
 *
 * For the email channel, an optional verificationToken can be supplied —
 * when present, the booking is still UNVERIFIED and the email's CTA
 * button doubles as the verification link (see email.service.ts). When
 * omitted, the booking is already verified/confirmed and the CTA is a
 * plain link to the app.
 *
 * Fires independent of email/phone verification state as a gate — the
 * caller decides when to call this (immediately for already-verified
 * bookings, or with a token for unverified email-plan bookings so the
 * confirmation IS the verification step; phone-OTP plans call this only
 * after the OTP is verified — see verification.controller.ts).
 */
async function sendBookingConfirmationByPlan(businessId, business, booking, serviceName, verificationToken) {
    const isEnterprise = business.subscription?.plan?.name === ENTERPRISE_PLAN;
    if (isEnterprise && booking.customerPhone) {
        const BUSINESS_TZ = process.env.BUSINESS_TIME_ZONE || 'Asia/Kathmandu';
        const dt = luxon_1.DateTime.fromJSDate(booking.startTime, { zone: BUSINESS_TZ });
        const result = await sparrow_sms_service_1.default.sendBookingConfirmation(businessId, booking.customerPhone, {
            businessName: business.name,
            serviceName,
            date: dt.setLocale('en').toLocaleString({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            time: dt.setLocale('en').toLocaleString({ hour: '2-digit', minute: '2-digit' }),
            bookingId: booking.id,
        });
        if (result.success)
            return result;
        console.warn(`[v0] SMS confirmation failed for booking ${booking.id} (${result.error}); falling back to email`);
        // fall through to email below
    }
    else if (isEnterprise) {
        console.warn(`[v0] Enterprise booking ${booking.id} has no customerPhone on file; falling back to email confirmation`);
    }
    // Reached for: non-Enterprise plans (Starter/Professional), Enterprise with no phone,
    // or Enterprise where the SMS send failed.
    return email_service_1.emailService.sendBookingConfirmationToCustomer(booking.customerEmail, {
        customerName: booking.customerName,
        serviceName,
        startTime: booking.startTime,
        endTime: booking.endTime,
        businessName: business.name,
        businessPhone: business.phone || '',
        businessAddress: business.address || '',
        verificationToken,
    });
}
class BookingController {
    async sendTodayReminders(req, res) {
        const { businessId } = req.params;
        const LOG_PREFIX = `[reminders][business=${businessId}]`;
        try {
            const business = await prisma_1.default.business.findUnique({
                where: { id: businessId },
                include: {
                    subscription: { include: { plan: true } },
                },
            });
            if (!business) {
                console.warn(`${LOG_PREFIX} Aborted: business not found`);
                return res.status(404).json({ success: false, message: 'Business not found' });
            }
            const BUSINESS_TZ = process.env.BUSINESS_TIME_ZONE || 'Asia/Kathmandu';
            const now = luxon_1.DateTime.now().setZone(BUSINESS_TZ);
            const startOfToday = now.startOf('day');
            if (business.lastReminderSentAt) {
                const lastSent = luxon_1.DateTime.fromJSDate(business.lastReminderSentAt, { zone: BUSINESS_TZ });
                if (lastSent >= startOfToday) {
                    console.log(`${LOG_PREFIX} Skipped: already sent today at ${lastSent.toISO()}`);
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
                console.warn(`${LOG_PREFIX} Aborted: no usable subscription (status=${subscription?.status ?? 'none'}, plan=${plan?.name ?? 'none'})`);
                return res.status(403).json({
                    success: false,
                    message: 'An active subscription is required to send reminders.',
                });
            }
            const canRemind = plan.allowSmsNotifications || plan.allowEmailNotifications;
            if (!canRemind) {
                console.warn(`${LOG_PREFIX} Aborted: plan "${plan.name}" does not allow SMS or email notifications`);
                return res.status(403).json({
                    success: false,
                    message: 'Your current plan does not include appointment reminders.',
                });
            }
            const channel = plan.allowSmsNotifications ? 'sms' : 'email';
            console.log(`${LOG_PREFIX} Starting send via ${channel} (plan=${plan.name})`);
            const bookings = await getTodayReminderCandidates(businessId);
            if (bookings.length === 0) {
                console.log(`${LOG_PREFIX} No CONFIRMED bookings remaining today — nothing to send, lastReminderSentAt not stamped`);
                return res.status(200).json({ success: true, data: { count: 0, channel } });
            }
            console.log(`${LOG_PREFIX} Found ${bookings.length} candidate booking(s) for today`);
            let sent = 0;
            const failures = [];
            if (channel === 'sms') {
                for (const booking of bookings) {
                    if (!booking.customerPhone) {
                        console.warn(`${LOG_PREFIX} SMS skipped for booking=${booking.id}: no customerPhone on file`);
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
                    if (result.success) {
                        sent++;
                    }
                    else {
                        // This is the log that was missing — the actual reason from Sparrow
                        // (e.g. quota exceeded, bad response code, network error) was being
                        // swallowed and only the booking id was recorded.
                        console.error(`${LOG_PREFIX} SMS FAILED for booking=${booking.id} phone=${booking.customerPhone}: ${result.error ?? 'unknown error'}`);
                        failures.push(booking.id);
                    }
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
                        console.error(`${LOG_PREFIX} EMAIL FAILED for booking=${booking.id} email=${booking.customerEmail}: ${err?.message || err}`);
                        failures.push(booking.id);
                    }
                }
            }
            await prisma_1.default.business.update({
                where: { id: businessId },
                data: { lastReminderSentAt: now.toJSDate() },
            });
            console.log(`${LOG_PREFIX} Done via ${channel}: sent=${sent} failed=${failures.length}${failures.length ? ` failedIds=[${failures.join(', ')}]` : ''}`);
            return res.status(200).json({
                success: true,
                data: { count: sent, failed: failures.length, channel, alreadySentToday: false },
            });
        }
        catch (error) {
            console.error(`${LOG_PREFIX} Unhandled error:`, error);
            return res.status(500).json({
                success: false,
                error: error?.message || 'Failed to send reminders',
            });
        }
    }
    /**
     * Called from the "closed date" modal on the frontend. Given a set of
     * booking ids that fall inside a date range the owner is about to close,
     * cancel each still-active booking and notify its customer via the
     * business's plan channel (SMS for Enterprise, email otherwise) — same
     * channel logic as cancelBooking/updateBookingStatus.
     */
    async notifyAndCancelForClosure(req, res) {
        try {
            const { businessId } = req.params;
            const { bookingIds, reason } = req.body;
            if (!businessId) {
                return res.status(400).json({ success: false, message: 'businessId is required' });
            }
            if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
                return res.status(400).json({ success: false, message: 'bookingIds must be a non-empty array' });
            }
            const business = await prisma_1.default.business.findUnique({
                where: { id: businessId },
                include: { subscription: { include: { plan: true } } },
            });
            if (!business) {
                return res.status(404).json({ success: false, message: 'Business not found' });
            }
            const subscription = business.subscription;
            const plan = subscription?.plan;
            const isSubscriptionUsable = subscription && (subscription.status === 'ACTIVE' || subscription.status === 'TRIAL');
            // Only touch bookings that actually belong to this business and are
            // still active — re-fetching by id rather than trusting the client's
            // list blindly (e.g. status could have changed since the modal loaded).
            const bookings = await prisma_1.default.booking.findMany({
                where: {
                    id: { in: bookingIds },
                    businessId: businessId,
                    status: { in: ['CONFIRMED', 'PENDING', 'UNVERIFIED'] },
                },
                include: { service: true },
            });
            const results = [];
            for (const booking of bookings) {
                try {
                    await prisma_1.default.booking.update({
                        where: { id: booking.id },
                        data: { status: 'CANCELLED' },
                    });
                    if (plan && isSubscriptionUsable) {
                        const outcome = await notifyCancellationByPlan(business, plan, booking, booking.service?.name || 'your service', reason);
                        results.push({ bookingId: booking.id, notified: outcome.sent, channel: outcome.channel });
                    }
                    else {
                        results.push({ bookingId: booking.id, notified: false, channel: null });
                    }
                }
                catch (err) {
                    console.error(`[v0] Failed to cancel/notify booking ${booking.id} for closure:`, err);
                    results.push({ bookingId: booking.id, notified: false, channel: null, error: err?.message || String(err) });
                }
            }
            return res.status(200).json({ success: true, data: { results } });
        }
        catch (error) {
            console.error('[v0] Error notifying bookings for closure:', error);
            return res.status(500).json({ success: false, error: error?.message || 'Failed to notify bookings' });
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
            const service = await prisma_1.default.service.findUnique({ where: { id: serviceId } });
            if (!service) {
                return res.status(404).json({ success: false, message: "Service not found" });
            }
            const finalEndTime = endTime || new Date(startTime.getTime() + (service.duration || 60) * 60000);
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
            // NEW: authenticated users still need phone verification if their
            // account's phone hasn't been verified yet — mirrors the guest flow
            // instead of blanket-confirming every logged-in booking regardless of
            // phone status.
            const isPhoneVerified = user.isPhoneVerified === true;
            const bookingStatus = isPhoneVerified ? 'CONFIRMED' : 'UNVERIFIED';
            const booking = await prisma_1.default.booking.create({
                data: {
                    startTime,
                    endTime: finalEndTime,
                    customerName: user?.firstName || 'Guest',
                    customerEmail: user?.email,
                    customerPhone: user?.phone || '',
                    notes: notes || '',
                    status: bookingStatus,
                    isEmailVerified: true,
                    isPhoneVerified,
                    user: { connect: { id: userId } },
                    service: { connect: { id: serviceId } },
                    business: { connect: { id: businessId } },
                    staff: { connect: { id: assignedStaffId } }
                }
            });
            // Only send the confirmation immediately if the phone is already
            // verified — otherwise the phone-verification step becomes the
            // confirmation trigger, same as the guest flow.
            if (isPhoneVerified) {
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
            }
            // NEW: response shape now matches the rest of the API (`data.booking`
            // instead of a bare top-level `booking`), and includes `isPhoneVerified`
            // / `status` so the frontend can correctly branch into the verification
            // modal vs the success page.
            return res.status(201).json({
                success: true,
                message: isPhoneVerified
                    ? "Booking created successfully!"
                    : "Booking created! Please verify your phone number to confirm your appointment.",
                data: {
                    booking: {
                        id: booking.id,
                        status: booking.status,
                        isPhoneVerified: booking.isPhoneVerified,
                        customerPhone: booking.customerPhone,
                    }
                }
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
            // Email-link verification applies to every plan except Enterprise
            // (Enterprise verifies + notifies via phone/SMS instead). This mirrors
            // the SMS-vs-email split already used for notifications in
            // sendBookingConfirmationByPlan, so Starter AND Professional both use
            // the email-confirmation-doubles-as-verification flow below.
            const planName = business.subscription?.plan?.name;
            const isEnterprisePlan = planName === ENTERPRISE_PLAN;
            const isEmailVerificationPlan = !isEnterprisePlan;
            const alreadyVerified = isEmailVerificationPlan
                ? customer.isEmailVerified === true
                : customer.isPhoneVerified === true;
            const verificationToken = isEmailVerificationPlan && !alreadyVerified ? (0, crypto_1.randomBytes)(32).toString('hex') : null;
            const verificationTokenExpires = isEmailVerificationPlan && !alreadyVerified ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;
            const booking = await prisma_1.default.booking.create({
                data: {
                    startTime,
                    endTime: finalEndTime,
                    customerName,
                    customerEmail,
                    customerPhone: customerPhone || '',
                    notes: notes || '',
                    status: alreadyVerified ? 'CONFIRMED' : 'UNVERIFIED',
                    isEmailVerified: isEmailVerificationPlan ? alreadyVerified : (customer.isEmailVerified === true),
                    isPhoneVerified: isEmailVerificationPlan ? (customer.isPhoneVerified === true) : alreadyVerified,
                    ...(isEmailVerificationPlan && !alreadyVerified ? { verificationToken, verificationTokenExpires } : {}),
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
            // Already-verified (or non-email-verification-plan) bookings get a
            // plain confirmation right away. Unverified email-plan bookings get a
            // confirmation whose CTA button doubles as the verification link —
            // there's no separate verification email for this plan anymore.
            try {
                if (alreadyVerified) {
                    await sendBookingConfirmationByPlan(businessId, booking.business, booking, booking.service.name);
                }
                else if (isEmailVerificationPlan && verificationToken) {
                    await sendBookingConfirmationByPlan(businessId, booking.business, booking, booking.service.name, verificationToken);
                }
            }
            catch (notifyError) {
                console.error('[v0] Failed to send booking confirmation:', notifyError);
            }
            res.status(201).json({
                success: true,
                message: alreadyVerified
                    ? "Booking confirmed!"
                    : isEmailVerificationPlan
                        ? "Booking created! Check your email to verify."
                        : "Booking created! Please verify your phone number to confirm your appointment.",
                booking: {
                    id: booking.id,
                    status: booking.status,
                    isEmailVerified: booking.isEmailVerified,
                    isPhoneVerified: booking.isPhoneVerified,
                    verificationChannel: isEmailVerificationPlan ? 'email' : 'phone',
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
   * Manual booking creation by a business owner from the dashboard.
   * Skips public verification entirely — an owner creating a booking on a
   * customer's behalf is trusted by definition, so it's created straight
   * into CONFIRMED. Deliberately minimal: no slot-generation UI, no
   * multi-channel verification branching — just create it, and best-effort
   * notify the customer if we have an email on file.
   */
    async createManualBooking(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Please log in to create a booking." });
            }
            const { businessId, serviceId, staffId, customerName, customerEmail, customerPhone, startTime: bodyStartTime, notes, } = req.body;
            if (!businessId || !serviceId || !customerName || !bodyStartTime) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: businessId, serviceId, customerName, startTime",
                });
            }
            // Confirm this business belongs to the requesting owner — a manual
            // booking is a privileged write, so businessId from the body alone
            // isn't trusted.
            const business = await prisma_1.default.business.findFirst({
                where: { id: businessId, userId },
            });
            if (!business) {
                return res.status(403).json({ success: false, message: "You don't have access to this business." });
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
            const startTime = new Date(bodyStartTime);
            if (isNaN(startTime.getTime())) {
                return res.status(400).json({ success: false, message: "Invalid startTime" });
            }
            const endTime = new Date(startTime.getTime() + (service.duration || 60) * 60000);
            // Basic double-booking guard when a specific staff member is chosen.
            // No availability grid for manual bookings — the owner is trusted to
            // pick a sane time; this just stops an accidental overlap.
            if (staffId) {
                const conflict = await prisma_1.default.booking.findFirst({
                    where: {
                        staffId,
                        status: { in: ['CONFIRMED', 'PENDING'] },
                        startTime: { lt: endTime },
                        endTime: { gt: startTime },
                    },
                });
                if (conflict) {
                    return res.status(409).json({
                        success: false,
                        message: "This staff member already has a booking that overlaps this time.",
                    });
                }
            }
            const booking = await prisma_1.default.booking.create({
                data: {
                    startTime,
                    endTime,
                    customerName,
                    customerEmail: customerEmail || '',
                    customerPhone: customerPhone || '',
                    notes: notes || '',
                    status: 'CONFIRMED',
                    isEmailVerified: true,
                    isPhoneVerified: true,
                    service: { connect: { id: serviceId } },
                    business: { connect: { id: businessId } },
                    ...(staffId ? { staff: { connect: { id: staffId } } } : {}),
                },
                include: { service: true, staff: true },
            });
            // Best-effort confirmation — never blocks the response on failure.
            if (customerEmail) {
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
                    console.error('[v0] Failed to send manual booking confirmation:', notifyError);
                }
            }
            return res.status(201).json({
                success: true,
                message: 'Booking created successfully.',
                data: { booking },
            });
        }
        catch (error) {
            console.error('[v0] Manual booking creation error:', error);
            return res.status(500).json({ success: false, error: error?.message || "Failed to create booking" });
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
            const bookingId = Array.isArray(id) ? id[0] : id;
            // Capture pre-cancel status BEFORE cancelling — we only notify on a
            // CONFIRMED -> CANCELLED transition, mirroring updateBookingStatus.
            const existingBooking = await booking_service_1.default.getBookingById(bookingId);
            const wasConfirmed = existingBooking?.status === 'CONFIRMED';
            const booking = await booking_service_1.default.cancelBooking(bookingId);
            if (wasConfirmed && existingBooking) {
                try {
                    const [business, service] = await Promise.all([
                        prisma_1.default.business.findUnique({
                            where: { id: existingBooking.businessId },
                            include: { subscription: { include: { plan: true } } },
                        }),
                        prisma_1.default.service.findUnique({ where: { id: existingBooking.serviceId } }),
                    ]);
                    const subscription = business?.subscription;
                    const plan = subscription?.plan;
                    const isSubscriptionUsable = subscription && (subscription.status === 'ACTIVE' || subscription.status === 'TRIAL');
                    if (business && plan && isSubscriptionUsable) {
                        const BUSINESS_TZ = process.env.BUSINESS_TIME_ZONE || 'Asia/Kathmandu';
                        const dt = luxon_1.DateTime.fromJSDate(existingBooking.startTime, { zone: BUSINESS_TZ });
                        if (plan.allowSmsNotifications) {
                            if (existingBooking.customerPhone) {
                                await sparrow_sms_service_1.default.sendStatusChange(existingBooking.businessId, existingBooking.customerPhone, {
                                    businessName: business.name,
                                    date: dt.setLocale('en').toLocaleString({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                                    time: dt.setLocale('en').toLocaleString({ hour: '2-digit', minute: '2-digit' }),
                                    status: 'cancelled',
                                    bookingId: existingBooking.id,
                                });
                            }
                            else {
                                console.warn(`[v0] Booking ${existingBooking.id} cancelled but has no customerPhone; skipping SMS notification`);
                            }
                        }
                        else if (plan.allowEmailNotifications) {
                            await email_service_1.emailService.sendBookingCancellationToCustomer(existingBooking.customerEmail, {
                                customerName: existingBooking.customerName,
                                serviceName: service?.name || 'your service',
                                startTime: existingBooking.startTime,
                                businessName: business.name,
                                businessPhone: business.phone,
                                businessAddress: business.address,
                            });
                        }
                    }
                }
                catch (notifyError) {
                    // Never let a notification failure block the cancellation itself.
                    console.error('[v0] Failed to send cancellation notification:', notifyError);
                }
            }
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
            // Verification channel is decided by plan: every plan except
            // Enterprise uses email-link verification (Starter AND Professional),
            // Enterprise uses phone OTP. This mirrors the channel choice already
            // used for confirmations (sendBookingConfirmationByPlan) but is a
            // separate decision — one picks how we NOTIFY, this picks how we
            // VERIFY a first-time customer.
            const planName = business.subscription?.plan?.name;
            const isEnterprisePlan = planName === ENTERPRISE_PLAN;
            const isEmailVerificationPlan = !isEnterprisePlan;
            const alreadyVerified = isEmailVerificationPlan
                ? customer.isEmailVerified === true
                : customer.isPhoneVerified === true;
            const verificationToken = isEmailVerificationPlan && !alreadyVerified ? (0, crypto_1.randomBytes)(32).toString('hex') : null;
            const verificationTokenExpires = isEmailVerificationPlan && !alreadyVerified ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;
            const bookingData = {
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                customerName,
                customerEmail,
                customerPhone,
                notes: notes || '',
                status: alreadyVerified ? 'CONFIRMED' : 'UNVERIFIED',
                isEmailVerified: isEmailVerificationPlan ? alreadyVerified : (customer.isEmailVerified === true),
                isPhoneVerified: isEmailVerificationPlan ? (customer.isPhoneVerified === true) : alreadyVerified,
                ...(isEmailVerificationPlan && !alreadyVerified ? { verificationToken, verificationTokenExpires } : {}),
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
            // Already-verified (or non-email-verification-plan) bookings get a
            // plain confirmation right away. Unverified email-plan bookings
            // (Starter or Professional) get a confirmation whose CTA button
            // doubles as the verification link — no separate verification email.
            try {
                if (alreadyVerified) {
                    await sendBookingConfirmationByPlan(businessId, business, booking, service.name);
                }
                else if (isEmailVerificationPlan && verificationToken) {
                    await sendBookingConfirmationByPlan(businessId, business, booking, service.name, verificationToken);
                }
            }
            catch (notifyError) {
                console.error('[v0] Failed to send booking confirmation:', notifyError);
                warnings.push('Confirmation could not be sent to ' + customerEmail);
            }
            res.status(201).json({
                success: true,
                message: alreadyVerified
                    ? 'Booking confirmed! Your appointment is scheduled.'
                    : isEmailVerificationPlan
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
                    verificationChannel: isEmailVerificationPlan ? 'email' : 'phone',
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
            // NOTE: the booking confirmation email is already sent at creation
            // time in createBusinessPublicBooking / createPublicBooking for
            // email-verification-plan bookings (Starter and Professional) — its
            // "Confirm & Visit Appoint Nepal" CTA button IS this very
            // verification link. So nothing is sent here again to avoid a
            // duplicate confirmation; this step only unlocks the booking.
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
