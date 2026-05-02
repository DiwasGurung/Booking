import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+1234567890'

export interface AppointmentSMSData {
  businessName: string
  appointmentDate: string
  appointmentTime: string
  appointmentId: string
}

export async function sendBookingConfirmationSMS(
  phoneNumber: string,
  data: AppointmentSMSData
) {
  try {
    // Format phone number for Nepal (+977)
    const formattedPhone = formatPhoneNumber(phoneNumber)

    const message = `Booking Confirmed! 
${data.businessName}
Date: ${data.appointmentDate}
Time: ${data.appointmentTime}
Booking ID: ${data.appointmentId}

Visit our website for details.`

    console.log('[v0] Sending booking confirmation SMS to:', formattedPhone)

    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    })

    console.log('[v0] SMS sent successfully:', result.sid)
    return result
  } catch (error) {
    console.error('[v0] Error sending booking SMS:', error)
    throw error
  }
}

export async function sendAppointmentReminderSMS(
  phoneNumber: string,
  hoursUntilAppointment: number,
  data: AppointmentSMSData
) {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)

    const message = `Reminder: Appointment in ${hoursUntilAppointment} hour(s)
${data.businessName}
Time: ${data.appointmentTime}
Booking ID: ${data.appointmentId}`

    console.log('[v0] Sending reminder SMS to:', formattedPhone)

    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    })

    console.log('[v0] Reminder SMS sent:', result.sid)
    return result
  } catch (error) {
    console.error('[v0] Error sending reminder SMS:', error)
    throw error
  }
}

export async function sendAppointmentStatusChangeSMS(
  phoneNumber: string,
  status: 'confirmed' | 'cancelled' | 'rescheduled',
  data: AppointmentSMSData
) {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)

    let statusMessage = ''
    if (status === 'confirmed') {
      statusMessage = `Your appointment at ${data.businessName} on ${data.appointmentDate} at ${data.appointmentTime} has been CONFIRMED.`
    } else if (status === 'cancelled') {
      statusMessage = `Your appointment at ${data.businessName} on ${data.appointmentDate} has been CANCELLED.`
    } else if (status === 'rescheduled') {
      statusMessage = `Your appointment at ${data.businessName} has been RESCHEDULED to ${data.appointmentDate} at ${data.appointmentTime}.`
    }

    const message = `${statusMessage}
Booking ID: ${data.appointmentId}`

    console.log('[v0] Sending status change SMS to:', formattedPhone)

    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    })

    console.log('[v0] Status change SMS sent:', result.sid)
    return result
  } catch (error) {
    console.error('[v0] Error sending status SMS:', error)
    throw error
  }
}

function formatPhoneNumber(phoneNumber: string): string {
  // Remove any spaces or dashes
  let cleaned = phoneNumber.replace(/\D/g, '')

  // If it's a Nepal number without country code, add +977
  if (cleaned.length === 10 && cleaned.startsWith('9')) {
    cleaned = '977' + cleaned
  }

  // Ensure it has + prefix
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }

  return cleaned
}

export async function sendVerificationCodeSMS(
  phoneNumber: string,
  verificationCode: string
) {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)

    const message = `Your verification code is: ${verificationCode}
This code will expire in 15 minutes.`

    console.log('[v0] Sending verification SMS to:', formattedPhone)

    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    })

    console.log('[v0] Verification SMS sent:', result.sid)
    return result
  } catch (error) {
    console.error('[v0] Error sending verification SMS:', error)
    throw error
  }
}
