import axios from 'axios'
import prisma from '../lib/prisma'
import SubscriptionSmsService from './subscription-sms.service'

const SPARROW_SMS_API_URL = 'http://api.sparrowsms.com/v2/sms/'
const SPARROW_API_TOKEN = process.env.SPARROW_SMS_TOKEN
const SPARROW_SENDER_ID = process.env.SPARROW_SMS_SENDER_ID

if (!SPARROW_API_TOKEN || !SPARROW_SENDER_ID) {
  console.warn('[v0] Sparrow SMS credentials not configured. SMS features will be disabled.')
}

interface SparrowSMSResponse {
  response_code: number
  message: string
  data?: {
    request_id: string
  }
}

/**
 * Format phone number for Nepal (accepts both with/without +977)
 * Examples: "98141950023" -> "98141950023", "+98141950023" -> "98141950023"
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '')

  // If it starts with 977 (country code), keep it as is
  if (cleaned.startsWith('977')) {
    return cleaned
  }

  // If it's a 10-digit Nepal number starting with 9, add country code
  if (cleaned.length === 10 && cleaned.startsWith('9')) {
    return '977' + cleaned
  }

  // Return as is
  return cleaned
}

/**
 * Send SMS via Sparrow SMS API
 */
async function sendSMS(
  phoneNumber: string,
  message: string,
  type: 'verification' | 'booking' | 'reminder' | 'status_change' | 'owner_notification'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!SPARROW_API_TOKEN || !SPARROW_SENDER_ID) {
      console.warn('[v0] Sparrow SMS not configured, skipping SMS')
      return { success: false, error: 'Sparrow SMS not configured' }
    }

    const formattedPhone = formatPhoneNumber(phoneNumber)

    console.log(`[v0] Sending ${type} SMS to:`, formattedPhone)

    const response = await axios.post<SparrowSMSResponse>(SPARROW_SMS_API_URL, {
      token: SPARROW_API_TOKEN,
      from: SPARROW_SENDER_ID,
      to: formattedPhone,
      text: message,
    })

    console.log('[v0] Sparrow SMS response:', response.data)

    if (response.data.response_code === 200) {
      console.log(`[v0] ${type} SMS sent successfully:`, response.data.data?.request_id)

      // Log SMS to database for tracking
      try {
        await prisma.sMSLog.create({
          data: {
            phoneNumber: formattedPhone,
            message,
            type,
            status: 'SENT',
            messageId: response.data.data?.request_id || '',
            provider: 'SPARROW',
          },
        })
      } catch (dbError) {
        console.error('[v0] Failed to log SMS to database:', dbError)
      }

      return { success: true, messageId: response.data.data?.request_id }
    } else {
      console.error('[v0] Sparrow SMS error:', response.data.message)

      // Log failed SMS to database
      try {
        await prisma.sMSLog.create({
          data: {
            phoneNumber: formattedPhone,
            message,
            type,
            status: 'FAILED',
            messageId: '',
            provider: 'SPARROW',
            errorMessage: response.data.message,
          },
        })
      } catch (dbError) {
        console.error('[v0] Failed to log SMS error to database:', dbError)
      }

      return { success: false, error: response.data.message }
    }
  } catch (error: any) {
    console.error('[v0] Error sending SMS via Sparrow:', error.message)

    // Log exception to database
    try {
      await prisma.sMSLog.create({
        data: {
          phoneNumber: formatPhoneNumber(phoneNumber),
          message,
          type,
          status: 'FAILED',
          messageId: '',
          provider: 'SPARROW',
          errorMessage: error.message,
        },
      })
    } catch (dbError) {
      console.error('[v0] Failed to log SMS exception to database:', dbError)
    }

    return { success: false, error: error.message }
  }
}

export const SparrowSMSService = {
  /**
   * Send verification code SMS
   */
  async sendVerificationCode(phoneNumber: string, code: string) {
    const message = `Your Appoint-Nepal verification code is: ${code}. Valid for 15 minutes.`
    return sendSMS(phoneNumber, message, 'verification')
  },

  /**
   * Send booking confirmation SMS to customer
   */
  async sendBookingConfirmation(
    phoneNumber: string,
    bookingData: {
      businessName: string
      serviceName: string
      date: string
      time: string
      bookingId: string
    }
  ) {
    const message = `Booking Confirmed!
${bookingData.businessName}
Service: ${bookingData.serviceName}
Date: ${bookingData.date}
Time: ${bookingData.time}
Booking ID: ${bookingData.bookingId}

Thank you for choosing Appoint-Nepal!`

    return sendSMS(phoneNumber, message, 'booking')
  },

  /**
   * Send appointment reminder SMS
   */
  async sendAppointmentReminder(
    phoneNumber: string,
    reminderData: {
      businessName: string
      date: string
      time: string
      hoursUntil: number
    }
  ) {
    const message = `Reminder: Appointment in ${reminderData.hoursUntil} hour(s)
${reminderData.businessName}
Date: ${reminderData.date}
Time: ${reminderData.time}

See you soon!`

    return sendSMS(phoneNumber, message, 'reminder')
  },

  /**
   * Send appointment status change SMS
   */
  async sendStatusChange(
    phoneNumber: string,
    statusData: {
      businessName: string
      date: string
      time: string
      status: 'confirmed' | 'cancelled' | 'rescheduled' | 'completed'
      bookingId: string
      newDate?: string
      newTime?: string
    }
  ) {
    let message = ''

    switch (statusData.status) {
      case 'confirmed':
        message = `Your appointment at ${statusData.businessName}
Date: ${statusData.date}
Time: ${statusData.time}
Status: CONFIRMED
Booking ID: ${statusData.bookingId}`
        break
      case 'cancelled':
        message = `Your appointment at ${statusData.businessName}
Date: ${statusData.date}
Status: CANCELLED
Booking ID: ${statusData.bookingId}`
        break
      case 'rescheduled':
        message = `Your appointment at ${statusData.businessName} has been RESCHEDULED
Old: ${statusData.date} at ${statusData.time}
New: ${statusData.newDate} at ${statusData.newTime}
Booking ID: ${statusData.bookingId}`
        break
      case 'completed':
        message = `Your appointment at ${statusData.businessName} is now COMPLETED
Date: ${statusData.date}
Thank you! Please share your feedback.
Booking ID: ${statusData.bookingId}`
        break
    }

    return sendSMS(phoneNumber, message, 'status_change')
  },

  /**
   * Send SMS notification to business owner about new booking
   */
  async sendOwnerNotification(
    phoneNumber: string,
    notificationData: {
      customerName: string
      customerPhone: string
      serviceName: string
      staffName?: string
      date: string
      time: string
      businessName: string
    }
  ) {
    const message = `New Booking Alert!
${notificationData.customerName}
Phone: ${notificationData.customerPhone}
Service: ${notificationData.serviceName}
${notificationData.staffName ? `Staff: ${notificationData.staffName}` : ''}
Date: ${notificationData.date}
Time: ${notificationData.time}

Log in to Appoint-Nepal dashboard to manage.`

    return sendSMS(phoneNumber, message, 'owner_notification')
  },

  /**
   * Send bulk SMS
   */
  async sendBulk(
    phoneNumbers: string[],
    message: string,
    type: 'verification' | 'booking' | 'reminder' | 'status_change' | 'owner_notification' = 'booking'
  ) {
    const results = await Promise.all(
      phoneNumbers.map(phone => sendSMS(phone, message, type))
    )

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return {
      successful,
      failed,
      total: results.length,
      results,
    }
  },

  /**
   * Get SMS logs for a phone number
   */
  async getLogsByPhoneNumber(phoneNumber: string) {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber)
      const logs = await prisma.sMSLog.findMany({
        where: { phoneNumber: formattedPhone },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      return logs
    } catch (error) {
      console.error('[v0] Failed to fetch SMS logs:', error)
      return []
    }
  },

  /**
   * Get SMS statistics
   */
  async getStatistics(startDate?: Date, endDate?: Date) {
    try {
      const where: any = {}
      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = startDate
        if (endDate) where.createdAt.lte = endDate
      }

      const [total, sent, failed, byType] = await Promise.all([
        prisma.sMSLog.count({ where }),
        prisma.sMSLog.count({ where: { ...where, status: 'SENT' } }),
        prisma.sMSLog.count({ where: { ...where, status: 'FAILED' } }),
        prisma.sMSLog.groupBy({
          by: ['type'],
          where,
          _count: { id: true },
        }),
      ])

      return {
        total,
        sent,
        failed,
        successRate: total > 0 ? ((sent / total) * 100).toFixed(2) + '%' : '0%',
        byType: byType.map(t => ({
          type: t.type,
          count: t._count.id,
        })),
      }
    } catch (error) {
      console.error('[v0] Failed to get SMS statistics:', error)
      return null
    }
  },

  /**
   * Format phone number (exported for use in other services)
   */
  formatPhoneNumber,
}

export default SparrowSMSService
