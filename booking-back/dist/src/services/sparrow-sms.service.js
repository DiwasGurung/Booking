"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SparrowSMSService = void 0;
const subscription_sms_service_1 = __importDefault(require("./subscription-sms.service"));
const fixieAxios_1 = require("../utils/fixieAxios");
const SPARROW_SMS_API_URL = 'https://api.sparrowsms.com/v2/sms/';
const SPARROW_API_TOKEN = process.env.SPARROW_SMS_TOKEN;
const SPARROW_SENDER_ID = process.env.SPARROW_SMS_SENDER_ID;
if (!SPARROW_API_TOKEN || !SPARROW_SENDER_ID) {
    console.warn('[v0] Sparrow SMS credentials not configured. SMS features will be disabled.');
}
/**
 * Format phone number for Nepal (accepts both with/without +977)
 */
function formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.startsWith('977'))
        return cleaned;
    if (cleaned.length === 10 && cleaned.startsWith('9'))
        return '977' + cleaned;
    return cleaned;
}
/**
 * Sparrow's API reads token/from/to/text as query-string parameters on a
 * GET request, e.g.:
 *   https://api.sparrowsms.com/v2/sms/?token=...&from=...&to=...&text=...
 * We build the URL explicitly (rather than relying on axios's `params`
 * option) so the request always matches Sparrow's documented format
 * exactly, and use axios.get to match the GET method Sparrow expects.
 * Centralized here so both send paths below always build the request
 * the same, correct way.
 */
async function sendToSparrow(to, text) {
    const url = `${SPARROW_SMS_API_URL}?from=${encodeURIComponent(SPARROW_SENDER_ID ?? '')}&to=${encodeURIComponent(to)}&text=${encodeURIComponent(text)}&token=${encodeURIComponent(SPARROW_API_TOKEN ?? '')}`;
    console.log('[v0] Sending SMS via Sparrow:', { SPARROW_API_TOKEN, SPARROW_SENDER_ID, to, text });
    return fixieAxios_1.fixieAxios.get(url);
}
/**
 * Core send function. Every SMS in the system funnels through here so
 * quota enforcement and logging happen exactly once, in one place.
 *
 * businessId is required — it's how we know whose quota to check/deduct
 * and whose SMSLog row this becomes. Verification SMS counts against
 * quota too (it's still a real cost), but failures here should be treated
 * as recoverable by the caller (e.g. fall back to email verification)
 * rather than as a hard error.
 */
// Modify sendSMS to include skipQuotaCheck parameter
async function sendSMS(businessId, phoneNumber, message, type, options) {
    // Skip quota check if option provided and type is 'verification'
    if (!(options?.skipQuotaCheck) && type !== 'verification') {
        const quota = await subscription_sms_service_1.default.checkSmsQuota(businessId);
        if (!quota.available) {
            console.warn(`[v0] SMS quota exhausted for business ${businessId} (type: ${type})`);
            return { success: false, error: 'SMS quota exceeded for this billing period' };
        }
    }
    if (!SPARROW_API_TOKEN || !SPARROW_SENDER_ID) {
        console.warn('[v0] Sparrow SMS not configured, skipping SMS');
        return { success: false, error: 'Sparrow SMS not configured' };
    }
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log(`[v0] Sending ${type} SMS to:`, formattedPhone);
    try {
        const response = await sendToSparrow(formattedPhone, message);
        if (response.data.response_code === 200) {
            const messageId = response.data.data?.request_id;
            console.log(`[v0] ${type} SMS sent successfully:`, messageId);
            await subscription_sms_service_1.default.logSmsAttempt({
                businessId, phoneNumber: formattedPhone, message, type, status: 'SENT', messageId,
            });
            await subscription_sms_service_1.default.incrementSmsUsage(businessId);
            return { success: true, messageId };
        }
        await subscription_sms_service_1.default.logSmsAttempt({
            businessId, phoneNumber: formattedPhone, message, type, status: 'FAILED', errorMessage: response.data.message,
        });
        return { success: false, error: response.data.message };
    }
    catch (error) {
        console.error('[v0] Error sending account SMS via Sparrow:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        await subscription_sms_service_1.default.logSmsAttempt({
            businessId, phoneNumber: formattedPhone, message, type, status: 'FAILED', errorMessage: error.message,
        });
        return { success: false, error: error.message };
    }
}
/**
 * Sends without checking any business's quota and without decrementing
 * anything. Used only for platform-level auth (verifying a User's,
 * Staff's, or Business's own phone number) — this is core account
 * infrastructure, not a business-paid notification, and may run before
 * a subscription even exists (e.g. during signup).
 *
 * Abuse protection here comes from the generic verification service's
 * per-destination daily cap, not from a quota check.
 */
async function sendAccountSms(phoneNumber, message, type) {
    if (!SPARROW_API_TOKEN || !SPARROW_SENDER_ID) {
        console.warn('[v0] Sparrow SMS not configured, skipping SMS');
        return { success: false, error: 'Sparrow SMS not configured' };
    }
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log(`[v0] Sending account ${type} SMS to:`, formattedPhone);
    try {
        const response = await sendToSparrow(formattedPhone, message);
        if (response.data.response_code === 200) {
            const messageId = response.data.data?.request_id;
            await subscription_sms_service_1.default.logSmsAttempt({
                phoneNumber: formattedPhone, message, type, status: 'SENT', messageId, // no businessId — platform-level send
            });
            return { success: true, messageId };
        }
        await subscription_sms_service_1.default.logSmsAttempt({
            phoneNumber: formattedPhone, message, type, status: 'FAILED', errorMessage: response.data.message,
        });
        return { success: false, error: response.data.message };
    }
    catch (error) {
        console.error('[v0] Error sending account SMS via Sparrow:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        await subscription_sms_service_1.default.logSmsAttempt({
            phoneNumber: formattedPhone, message, type, status: 'FAILED', errorMessage: error.message,
        });
        return { success: false, error: error.message };
    }
}
exports.SparrowSMSService = {
    /** Business-quota-gated — use for Booking verification, tied to a specific business's subscription. */
    async sendVerificationCode(businessId, phoneNumber, code) {
        const message = `Appoint Nepal: Your OTP for verification is ${code}.`;
        return sendSMS(businessId, phoneNumber, message, 'verification', { skipQuotaCheck: true });
    },
    /** Ungated — use for User/Staff/Business account phone verification. */
    async sendAccountVerificationCode(phoneNumber, code) {
        const message = `Appoint Nepal: Your OTP for verification is ${code}.`;
        return sendAccountSms(phoneNumber, message, 'verification');
    },
    async sendBookingConfirmation(businessId, phoneNumber, bookingData) {
        const message = `Booking Confirmed!
${bookingData.businessName}
Service: ${bookingData.serviceName}
Date: ${bookingData.date}
Time: ${bookingData.time}
Booking ID: ${bookingData.bookingId}

Thank you for choosing Appoint Nepal!`;
        return sendSMS(businessId, phoneNumber, message, 'booking');
    },
    async sendAppointmentReminder(businessId, phoneNumber, reminderData) {
        const message = `Reminder: Appointment in ${reminderData.hoursUntil} hour(s)
${reminderData.businessName}
Date: ${reminderData.date}
Time: ${reminderData.time}

See you soon!`;
        return sendSMS(businessId, phoneNumber, message, 'reminder');
    },
    async sendStatusChange(businessId, phoneNumber, statusData) {
        let message = '';
        switch (statusData.status) {
            case 'confirmed':
                message = `Your appointment at ${statusData.businessName}\nDate: ${statusData.date}\nTime: ${statusData.time}\nStatus: CONFIRMED\nBooking ID: ${statusData.bookingId}`;
                break;
            case 'cancelled':
                message = `Your appointment at ${statusData.businessName}\nDate: ${statusData.date}\nStatus: CANCELLED\nBooking ID: ${statusData.bookingId}`;
                break;
            case 'rescheduled':
                message = `Your appointment at ${statusData.businessName} has been RESCHEDULED\nOld: ${statusData.date} at ${statusData.time}\nNew: ${statusData.newDate} at ${statusData.newTime}\nBooking ID: ${statusData.bookingId}`;
                break;
            case 'completed':
                message = `Your appointment at ${statusData.businessName} is now COMPLETED\nDate: ${statusData.date}\nThank you! Please share your feedback.\nBooking ID: ${statusData.bookingId}`;
                break;
        }
        return sendSMS(businessId, phoneNumber, message, 'status_change');
    },
    async sendOwnerNotification(businessId, phoneNumber, notificationData) {
        const message = `New Booking Alert!
    ${notificationData.customerName}
    Phone: ${notificationData.customerPhone}
    Service: ${notificationData.serviceName}
    ${notificationData.staffName ? `Staff: ${notificationData.staffName}` : ''}
    Date: ${notificationData.date}
    Time: ${notificationData.time}

Log in to Appoint Nepal dashboard to manage.`;
        return sendSMS(businessId, phoneNumber, message, 'owner_notification');
    },
    async sendBulk(businessId, phoneNumbers, message, type = 'booking') {
        const results = await Promise.all(phoneNumbers.map((phone) => sendSMS(businessId, phone, message, type)));
        return {
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            total: results.length,
            results,
        };
    },
    formatPhoneNumber,
};
exports.default = exports.SparrowSMSService;
