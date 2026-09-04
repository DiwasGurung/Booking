import axios from 'axios'
import SubscriptionSmsService, { SmsType } from './subscription-sms.service'
import { fixieAxios } from '../utils/fixieAxios' 

const SPARROW_SMS_API_URL = 'https://api.sparrowsms.com/v2/sms/'
const SPARROW_API_TOKEN = process.env.SPARROW_SMS_TOKEN
const SPARROW_SENDER_ID = process.env.SPARROW_SMS_SENDER_ID

if (!SPARROW_API_TOKEN || !SPARROW_SENDER_ID) {
  console.warn('[v0] Sparrow SMS credentials not configured. SMS features will be disabled.')
}

interface SparrowSMSResponse {
  response_code: number
  message: string
  data?: { request_id: string }
}

interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Format phone number for Nepal (accepts both with/without +977)
 */
function formatPhoneNumber(phoneNumber: string): string {
  let cleaned = phoneNumber.replace(/\D/g, '')
  if (cleaned.startsWith('977')) return cleaned
  if (cleaned.length === 10 && cleaned.startsWith('9')) return '977' + cleaned
  return cleaned
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
async function sendToSparrow(to: string, text: string) {
  const url = `${SPARROW_SMS_API_URL}?from=${encodeURIComponent(SPARROW_SENDER_ID ?? '')}&to=${encodeURIComponent(
    to
  )}&text=${encodeURIComponent(text)}&token=${encodeURIComponent(SPARROW_API_TOKEN ?? '')}`

  console.log('[v0] Sending SMS via Sparrow:', { SPARROW_API_TOKEN, SPARROW_SENDER_ID, to, text })
  return fixieAxios.get<SparrowSMSResponse>(url)
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
async function sendSMS(
  businessId: string,
  phoneNumber: string,
  message: string,
  type: SmsType,
  options?: { skipQuotaCheck?: boolean }
): Promise<SendResult> {
  // Skip quota check if option provided and type is 'verification'
  if (!(options?.skipQuotaCheck) && type !== 'verification') {
    const quota = await SubscriptionSmsService.checkSmsQuota(businessId)
    if (!quota.available) {
      console.warn(`[v0] SMS quota exhausted for business ${businessId} (type: ${type})`)
      return { success: false, error: 'SMS quota exceeded for this billing period' }
    }
  }

  if (!SPARROW_API_TOKEN || !SPARROW_SENDER_ID) {
    console.warn('[v0] Sparrow SMS not configured, skipping SMS')
    return { success: false, error: 'Sparrow SMS not configured' }
  }

  const formattedPhone = formatPhoneNumber(phoneNumber)
  console.log(`[v0] Sending ${type} SMS to:`, formattedPhone)

  try {
    const response = await sendToSparrow(formattedPhone, message)

    if (response.data.response_code === 200) {
      const messageId = response.data.data?.request_id
      console.log(`[v0] ${type} SMS sent successfully:`, messageId)

      await SubscriptionSmsService.logSmsAttempt({
        businessId, phoneNumber: formattedPhone, message, type, status: 'SENT', messageId,
      })
      await SubscriptionSmsService.incrementSmsUsage(businessId)

      return { success: true, messageId }
    }

    await SubscriptionSmsService.logSmsAttempt({
      businessId, phoneNumber: formattedPhone, message, type, status: 'FAILED', errorMessage: response.data.message,
    })
    return { success: false, error: response.data.message }
  } catch (error: any) {
    console.error('[v0] Error sending account SMS via Sparrow:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    })
    await SubscriptionSmsService.logSmsAttempt({
      businessId, phoneNumber: formattedPhone, message, type, status: 'FAILED', errorMessage: error.message,
    })
    return { success: false, error: error.message }
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
async function sendAccountSms(phoneNumber: string, message: string, type: 'verification'): Promise<SendResult> {
 
  if (!SPARROW_API_TOKEN || !SPARROW_SENDER_ID) {
    console.warn('[v0] Sparrow SMS not configured, skipping SMS')
    return { success: false, error: 'Sparrow SMS not configured' }
  }

  const formattedPhone = formatPhoneNumber(phoneNumber)
  console.log(`[v0] Sending account ${type} SMS to:`, formattedPhone)

  try {
    const response = await sendToSparrow(formattedPhone, message)

    if (response.data.response_code === 200) {
      const messageId = response.data.data?.request_id
      await SubscriptionSmsService.logSmsAttempt({
        phoneNumber: formattedPhone, message, type, status: 'SENT', messageId, // no businessId — platform-level send
      })
      return { success: true, messageId }
    }

    await SubscriptionSmsService.logSmsAttempt({
      phoneNumber: formattedPhone, message, type, status: 'FAILED', errorMessage: response.data.message,
    })
    return { success: false, error: response.data.message }
  } catch (error: any) {
    console.error('[v0] Error sending account SMS via Sparrow:', {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message,
  })
    await SubscriptionSmsService.logSmsAttempt({
      phoneNumber: formattedPhone, message, type, status: 'FAILED', errorMessage: error.message,
    })
    return { success: false, error: error.message }
  }
}

export const SparrowSMSService = {
  /** Business-quota-gated — use for Booking verification, tied to a specific business's subscription. */
  async sendVerificationCode(businessId: string, phoneNumber: string, code: string) {
    const message = `Appoint Nepal: Your OTP for verification is ${code}.`
    return sendSMS(businessId, phoneNumber, message, 'verification', { skipQuotaCheck: true } )
  },

  /** Ungated — use for User/Staff/Business account phone verification. */
  async sendAccountVerificationCode(phoneNumber: string, code: string) {
    const message = `Appoint Nepal: Your OTP for verification is ${code}.`
    return sendAccountSms(phoneNumber, message, 'verification')
  },

  async sendBookingConfirmation(
    businessId: string,
    phoneNumber: string,
    bookingData: { businessName: string; serviceName: string; date: string; time: string; bookingId: string }
  ) {
    const message = `Booking Confirmed!
    ${bookingData.businessName}
    Service: ${bookingData.serviceName}
    Date: ${bookingData.date}
    Time: ${bookingData.time}
    Booking ID: ${bookingData.bookingId}

    Thank you for choosing Appoint Nepal!`
    return sendSMS(businessId, phoneNumber, message, 'booking')
  },

  async sendAppointmentReminder(
    businessId: string,
    phoneNumber: string,
    reminderData: { businessName: string; date: string; time: string; hoursUntil: number }
  ) {
    const message = `Reminder: Appointment in ${reminderData.hoursUntil} hour(s)
${reminderData.businessName}
Date: ${reminderData.date}
Time: ${reminderData.time}

See you soon!`
    return sendSMS(businessId, phoneNumber, message, 'reminder')
  },

  async sendStatusChange(
    businessId: string,
    phoneNumber: string,
    statusData: {
      businessName: string; date: string; time: string
      status: 'confirmed' | 'cancelled' | 'rescheduled' | 'completed'
      bookingId: string; newDate?: string; newTime?: string
    }
  ) {
    let message = ''
    switch (statusData.status) {
      case 'confirmed':
        message = `Your appointment at ${statusData.businessName}\nDate: ${statusData.date}\nTime: ${statusData.time}\nStatus: CONFIRMED\nBooking ID: ${statusData.bookingId}`
        break
      case 'cancelled':
        message = `Your appointment at ${statusData.businessName}\nDate: ${statusData.date}\nStatus: CANCELLED\nBooking ID: ${statusData.bookingId}`
        break
      case 'rescheduled':
        message = `Your appointment at ${statusData.businessName} has been RESCHEDULED\nOld: ${statusData.date} at ${statusData.time}\nNew: ${statusData.newDate} at ${statusData.newTime}\nBooking ID: ${statusData.bookingId}`
        break
      case 'completed':
        message = `Your appointment at ${statusData.businessName} is now COMPLETED\nDate: ${statusData.date}\nThank you! Please share your feedback.\nBooking ID: ${statusData.bookingId}`
        break
    }
    return sendSMS(businessId, phoneNumber, message, 'status_change')
  },

  async sendOwnerNotification(
    businessId: string,
    phoneNumber: string,
    notificationData: {
      customerName: string; customerPhone: string; serviceName: string
      staffName?: string; date: string; time: string; businessName: string
    }
  ) {
    const message = `New Booking Alert!
    ${notificationData.customerName}
    Phone: ${notificationData.customerPhone}
    Service: ${notificationData.serviceName}
    ${notificationData.staffName ? `Staff: ${notificationData.staffName}` : ''}
    Date: ${notificationData.date}
    Time: ${notificationData.time}

Log in to Appoint Nepal dashboard to manage.`
    return sendSMS(businessId, phoneNumber, message, 'owner_notification')
  },

  async sendBulk(businessId: string, phoneNumbers: string[], message: string, type: SmsType = 'booking') {
    const results = await Promise.all(phoneNumbers.map((phone) => sendSMS(businessId, phone, message, type)))
    return {
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      total: results.length,
      results,
    }
  },

  formatPhoneNumber,
}

export default SparrowSMSService