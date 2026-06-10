import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER

if (!accountSid || !authToken || !fromPhoneNumber) {
  console.warn('[v0] Twilio credentials not configured. SMS features will be disabled.')
}

const client = twilio(accountSid, authToken)

export class TwilioService {
  /**
   * Format phone number to E.164 format (required by Twilio)
   * Example: "98141950023" -> "+98141950023"
   */
  static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '')
    
    // Add + prefix if not already present
    if (!cleaned.startsWith('+')) {
      return `+977=-${cleaned}`
    }
    return cleaned
  }

  static async sendVerificationSMS(phoneNumber: string, code: string): Promise<boolean> {
    try {
      if (!accountSid || !authToken) {
        console.warn('[v0] Twilio not configured, skipping SMS')
        return false
      }

      // Format phone number to E.164 format
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber)
      console.log('[v0] Sending SMS to formatted number:', formattedPhoneNumber)

      const message = await client.messages.create({
        body: `Your Appoint-Nepal verification code is: ${code}. Valid for 15 minutes.`,
        from: fromPhoneNumber,
        to: formattedPhoneNumber,
      })

      console.log('[v0] Verification SMS sent:', message.sid)
      return true
    } catch (error) {
      console.error('[v0] Failed to send verification SMS:', error)
      return false
    }
  }

  static async sendAppointmentUpdateSMS(
    phoneNumber: string,
    appointmentData: {
      type: 'booking' | 'reminder' | 'status_change'
      businessName: string
      appointmentDate: string
      appointmentTime: string
      status?: string
    }
  ): Promise<boolean> {
    try {
      if (!accountSid || !authToken) {
        console.warn('[v0] Twilio not configured, skipping SMS')
        return false
      }

      // Format phone number to E.164 format
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber)

      let messageBody = ''

      switch (appointmentData.type) {
        case 'booking':
          messageBody = `Booking confirmed! Your appointment with ${appointmentData.businessName} is on ${appointmentData.appointmentDate} at ${appointmentData.appointmentTime}. Reply HELP for support.`
          break
        case 'reminder':
          messageBody = `Reminder: You have an appointment with ${appointmentData.businessName} on ${appointmentData.appointmentDate} at ${appointmentData.appointmentTime}.`
          break
        case 'status_change':
          messageBody = `Your appointment with ${appointmentData.businessName} has been ${appointmentData.status}. Date: ${appointmentData.appointmentDate} Time: ${appointmentData.appointmentTime}`
          break
      }

      const message = await client.messages.create({
        body: messageBody,
        from: fromPhoneNumber,
        to: formattedPhoneNumber,
      })

      console.log('[v0] Appointment update SMS sent:', message.sid)
      return true
    } catch (error) {
      console.error('[v0] Failed to send appointment SMS:', error)
      return false
    }
  }
}
