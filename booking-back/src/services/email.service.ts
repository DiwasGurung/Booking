import nodemailer from 'nodemailer'
import { validate } from 'deep-email-validator'

const emailUser = process.env.EMAIL_USER || ''
const emailPassword = process.env.EMAIL_PASSWORD || ''
const emailHost = process.env.EMAIL_HOST || ''
const emailPort = Number(process.env.EMAIL_PORT || 465)
// The From header MUST use the authenticated mailbox address, otherwise
// cPanel/Nest Nepal mail servers drop or spam-file the message.
const rawFrom = process.env.EMAIL_FROM || emailUser
const emailFrom = rawFrom.includes(emailUser) ? rawFrom : `Appoint-Nepal <${emailUser}>`
const businessTimeZone = process.env.BUSINESS_TIME_ZONE || 'Asia/Kathmandu'

const formatBookingDate = (value: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { ...options, timeZone: businessTimeZone }).format(new Date(value))

// Verify transporter configuration on startup
let transporter: nodemailer.Transporter | null = null

const initializeTransporter = () => {
  if (transporter) return transporter

  if (!emailHost || !emailUser || !emailPassword) {
    throw new Error('EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD must be configured')
  }
  transporter = nodemailer.createTransport(
    {
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: { user: emailUser, pass: emailPassword },
      tls: { rejectUnauthorized: false },
    logger: true,
    debug: true,
 
    },
    {
      // Force every message's From + envelope sender to the authenticated mailbox.
      from: emailFrom,
      sender: emailUser,
      replyTo: emailFrom,
    }
  )

  return transporter
}



export const emailService = {
  /** Verify the Nest Nepal SMTP connection before sending mail. */
  async verifyTransporter() {
    const smtp = initializeTransporter()
    await smtp.verify()
    return { host: emailHost, port: emailPort, user: emailUser }
  },

  /**
   * Send email verification code
   */
  async sendVerificationEmail(email: string, verificationCode: string) {
    try {
      const transporter = initializeTransporter()

      const mailOptions = {
        from: emailFrom,
        to: email,
        subject: 'Verify Your Email Address - Appoint-Nepal',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin: 0;">Welcome to Appoint-Nepal!</h2>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Thank you for creating an account. Please verify your email address using the code below.
            </p>
            
            <div style="margin: 30px 0; text-align: center;">
              <p style="color: #999; font-size: 14px; margin-bottom: 10px;">Your verification code:</p>
              <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; border: 2px dashed #008B8B;">
                <p style="font-size: 32px; font-weight: bold; color: #008B8B; margin: 0; letter-spacing: 4px;">
                  ${verificationCode}
                </p>
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              1. Go to the verification page<br/>
              2. Enter the 6-digit code above<br/>
              3. Click verify to activate your account
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              This code will expire in 15 minutes.<br/>
              If you didn't create this account, please ignore this email.
            </p>
          </div>
        `,
      }

      const result = await transporter.sendMail(mailOptions)
      console.log('[Email Service] Verification code sent to:', email, 'Message ID:', result.messageId)
      return result
    } catch (error: any) {
      console.error('[Email Service] Failed to send verification email:', {
        code: error.code,
        responseCode: error.responseCode,
        command: error.command,
        message: error.message,
      })
      if (error.code === 'EAUTH') {
        console.error('[Email Setup] SMTP authentication failed. Confirm EMAIL_USER is the full Nest Nepal mailbox and EMAIL_PASSWORD is its mailbox password.')
      }
      
      throw error
    }
  },

    /**
   * Send feedback/suggestion notification to team inbox
   */
  async sendFeedbackEmail(feedbackDetails: {
    name?: string
    email?: string
    type: 'bug' | 'feature' | 'other'
    message: string
    page?: string
    businessName?: string
    role: 'customer' | 'business_owner' | 'staff' | 'visitor'
  }) {
    try {
      const transporter = initializeTransporter()
      const teamInbox = process.env.FEEDBACK_INBOX || emailUser

      const typeLabel = {
        bug: 'Bug Report',
        feature: 'Feature Suggestion',
        other: 'General Feedback',
      }[feedbackDetails.type]

      const mailOptions = {
        from: emailFrom,
        to: teamInbox,
        replyTo: feedbackDetails.email || emailFrom,
        subject: `[Feedback] ${typeLabel}${feedbackDetails.businessName ? ' - ' + feedbackDetails.businessName : ''}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #008B8B; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">New ${typeLabel}</h2>
            </div>
            <div style="border: 1px solid #e0e0e0; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 120px;">From:</td>
                  <td style="padding: 8px 0; color: #333;">${feedbackDetails.name || 'Anonymous'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Email:</td>
                  <td style="padding: 8px 0; color: #333;">${feedbackDetails.email || 'Not provided'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Role:</td>
                  <td style="padding: 8px 0; color: #333;">${feedbackDetails.role}</td>
                </tr>
                ${feedbackDetails.businessName ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Business:</td>
                  <td style="padding: 8px 0; color: #333;">${feedbackDetails.businessName}</td>
                </tr>` : ''}
                ${feedbackDetails.page ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Page:</td>
                  <td style="padding: 8px 0; color: #333;">${feedbackDetails.page}</td>
                </tr>` : ''}
              </table>
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                <p style="color: #333; white-space: pre-wrap; margin: 0;">${feedbackDetails.message}</p>
              </div>
            </div>
          </div>
        `,
      }

      const result = await transporter.sendMail(mailOptions)
      console.log('[Email Service] Feedback email sent, type:', feedbackDetails.type)
      return result
    } catch (error: any) {
      console.error('[Email Service] Failed to send feedback email:', error.message)
      throw error
    }
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string, accountType: 'business' | 'staff' = 'staff') {
    try {
      const transporter = initializeTransporter()
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || ''}/reset-password?token=${encodeURIComponent(resetToken)}&type=${accountType}`

      const mailOptions = {
        from: emailFrom,
        to: email,
        subject: 'Reset Your Password - Appoint-Nepal',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin: 0;">Password Reset Request</h2>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              We received a request to reset your password. Click the button below to set a new password.
            </p>
            
            <div style="margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #008B8B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              This link will expire in 1 hour.<br/>
              If you didn't request this, please ignore this email.
            </p>
          </div>
        `,
      }

      const result = await transporter.sendMail(mailOptions)
      console.log('[Email Service] Password reset email sent to:', email)
      return result
    } catch (error: any) {
      console.error('[Email Service] Failed to send password reset email:', error.message)
      throw error
    }
  },

  /**
   * Send new booking notification to business owner
   */
  async sendNewBookingNotification(ownerEmail: string, bookingDetails: {
    customerName: string
    customerEmail: string
    customerPhone: string
    serviceName: string
    staffName?: string
    startTime: Date
    endTime: Date
    businessName: string
    notes?: string
  }) {
    try {
      const transporter = initializeTransporter()
      
      const formattedDate = formatBookingDate(bookingDetails.startTime, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
      const formattedStartTime = formatBookingDate(bookingDetails.startTime, {
        hour: '2-digit', minute: '2-digit'
      })
      const formattedEndTime = formatBookingDate(bookingDetails.endTime, {
        hour: '2-digit', minute: '2-digit'
      })

      const mailOptions = {
        from: emailFrom,
        to: ownerEmail,
        subject: `New Booking Received - ${bookingDetails.serviceName} - Appoint Nepal`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #008B8B; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">New Booking Received!</h2>
            </div>
            
            <div style="border: 1px solid #e0e0e0; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                You have received a new booking for <strong>${bookingDetails.businessName}</strong>.
              </p>
              
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #008B8B; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #008B8B; padding-bottom: 10px;">
                  Booking Details
                </h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; width: 140px;">Service:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: bold;">${bookingDetails.serviceName}</td>
                  </tr>
                  ${bookingDetails.staffName ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Staff Member:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: bold;">${bookingDetails.staffName}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Date:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: bold;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Time:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: bold;">${formattedStartTime} - ${formattedEndTime}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: #f0f8f8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #008B8B; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #008B8B; padding-bottom: 10px;">
                  Customer Information
                </h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; width: 140px;">Name:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: bold;">${bookingDetails.customerName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Email:</td>
                    <td style="padding: 8px 0; color: #333;">
                      <a href="mailto:${bookingDetails.customerEmail}" style="color: #008B8B;">${bookingDetails.customerEmail}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Phone:</td>
                    <td style="padding: 8px 0; color: #333;">
                      <a href="tel:${bookingDetails.customerPhone}" style="color: #008B8B;">${bookingDetails.customerPhone}</a>
                    </td>
                  </tr>
                  ${bookingDetails.notes ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; vertical-align: top;">Notes:</td>
                    <td style="padding: 8px 0; color: #333;">${bookingDetails.notes}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/bookings" 
                   style="background-color: #008B8B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                  View in Dashboard
                </a>
              </div>
              
              <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
                This is an automated notification from Appoint-Nepal.<br/>
                Please do not reply to this email.
              </p>
            </div>
          </div>
        `,
      }

      const result = await transporter.sendMail(mailOptions)
      console.log('[Email Service] New booking notification sent to owner:', ownerEmail)
      return result
    } catch (error: any) {
      console.error('[Email Service] Failed to send new booking notification:', error.message)
      throw error
    }
  },
/**
 * Send booking confirmation to customer
 */
async sendBookingConfirmationToCustomer(customerEmail: string, bookingDetails: {
  customerName: string
  serviceName: string
  staffName?: string
  startTime: Date
  endTime: Date
  businessName: string
  businessPhone?: string
  businessAddress?: string
}) {
  try {
    const transporter = initializeTransporter()

    const formattedDate = formatBookingDate(bookingDetails.startTime, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
    const formattedStartTime = formatBookingDate(bookingDetails.startTime, {
      hour: '2-digit', minute: '2-digit'
    })
    const formattedEndTime = formatBookingDate(bookingDetails.endTime, {
      hour: '2-digit', minute: '2-digit'
    })

    // Base URL for the "visit us" CTA — set APP_URL in your env, falls back
    // to the production domain if not configured.
    const APP_URL = process.env.APP_URL || 'https://appointnepal.com'

    const mailOptions = {
      from: emailFrom,
      to: customerEmail,
      subject: `Booking Confirmed - ${bookingDetails.businessName} - Appoint Nepal`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #008B8B; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">Booking Confirmed!</h2>
          </div>
          
          <div style="border: 1px solid #e0e0e0; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Hi <strong>${bookingDetails.customerName}</strong>,<br/><br/>
              Your booking with <strong>${bookingDetails.businessName}</strong> has been confirmed!
            </p>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #008B8B; margin-top: 0;">Appointment Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 120px;">Service:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${bookingDetails.serviceName}</td>
                </tr>
                ${bookingDetails.staffName ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Staff:</td>
                  <td style="padding: 8px 0; color: #333;">${bookingDetails.staffName}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #666;">Date:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Time:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${formattedStartTime}</td>
                </tr>
                ${bookingDetails.businessAddress ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Location:</td>
                  <td style="padding: 8px 0; color: #333;">${bookingDetails.businessAddress}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            ${bookingDetails.businessPhone ? `
            <p style="color: #666; font-size: 14px;">
              Need to reschedule? Contact <strong>${bookingDetails.businessName}</strong> at 
              <a href="tel:${bookingDetails.businessPhone}" style="color: #008B8B;">${bookingDetails.businessPhone}</a>
            </p>
            ` : ''}

            <div style="text-align: center; margin: 30px 0 10px;">
              <p style="color: #333; font-size: 14px; margin-bottom: 16px;">
                Manage your bookings, discover more services, and book your next appointment in seconds.
              </p>
              <a href="${APP_URL}" target="_blank" style="display: inline-block; background-color: #008B8B; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 15px; padding: 12px 28px; border-radius: 6px;">
                Visit Appoint Nepal
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
              Thank you for booking with Appoint Nepal!
            </p>
          </div>
        </div>
      `,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('[Email Service] Booking confirmation sent to customer:', customerEmail)
    return result
  } catch (error: any) {
    console.error('[Email Service] Failed to send booking confirmation to customer:', error.message)
    throw error
  }
},

  /**
   * Send staff email verification
   */
  async sendStaffVerificationEmail(staffEmail: string, staffName: string, verificationToken: string, businessName: string) {
    try {
      const transporter = initializeTransporter()

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
      const verificationLink = `${baseUrl}/staff/verify-email?token=${verificationToken}`

      const mailOptions = {
        from: emailFrom,
        to: staffEmail,
        subject: `Verify Your Email - ${businessName} Staff Portal`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #008B8B; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">Welcome to Appoint Nepal Staff Portal!</h2>
            </div>
            
            <div style="border: 1px solid #e0e0e0; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Hi ${staffName},
              </p>
              
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                You have been added as a staff member at <strong>${businessName}</strong>. 
              </p>

              <p style="color: #333; font-size: 16px; margin-bottom: 30px;">
                Please verify your email address to access your staff portal and create your booking page.
              </p>

              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${verificationLink}" style="background-color: #008B8B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>

              <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
                Or copy this link if the button doesn't work:
              </p>

              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; word-break: break-all;">
                <a href="${verificationLink}" style="color: #008B8B; text-decoration: none;">${verificationLink}</a>
              </div>

              <p style="color: #666; font-size: 14px;">
                <strong>Note:</strong> This link expires in 24 hours. If it expires, you can request a new verification email from the login page.
              </p>

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Once verified, you'll be able to:
              </p>
              <ul style="color: #666; font-size: 14px;">
                <li>View your bookings and schedule</li>
                <li>Share your direct booking link with customers</li>
                <li>Manage your availability and services</li>
              </ul>

              <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
                If you didn't create this account, please ignore this email.
              </p>
            </div>
          </div>
        `,
      }

      const result = await transporter.sendMail(mailOptions)
      console.log('[Email Service] Staff verification email sent to:', staffEmail)
      return result
    } catch (error: any) {
      console.error('[Email Service] Failed to send staff verification email:', error.message)
      throw error
    }
  },

  /**
   * Validate email address using deep-email-validator
   * Checks format, typo, disposable status, MX records, and SMTP verification
   */
  async validateEmailAddress(email: string): Promise<{ isValid: boolean; reason?: string }> {
    try {
      console.log('[Email Service] Validating email:', email)
      
      // Do NOT run an outbound SMTP probe: most hosts (including Nest Nepal)
      // block outbound port 25, so validateSMTP falsely rejects valid inboxes
      // and prevents real emails from ever being sent. Format + MX is enough.
      const result = await validate({
        email,
        sender: emailUser,
        validateSMTP: false,
      })

      console.log('[Email Service] Email validation result:', {
        email,
        valid: result.valid,
        validators: result.validators,
        reason: result.reason,
      })

      if (result.valid) {
        console.log('[Email Service] Email validation SUCCESSFUL for:', email)
        return { isValid: true }
      }

      // Email failed validation - check if it's a timeout or actual invalid email
      const smtpValidator = result.validators?.smtp
      const smtpReason = smtpValidator?.reason?.toLowerCase() || ''

      // If SMTP timed out, allow the email (temporary network issue)
      if (smtpReason.includes('timeout') || smtpReason.includes('econnrefused') || smtpReason.includes('econnreset')) {
        console.log('[Email Service] SMTP timeout for', email, '- allowing due to temporary network issue')
        return { isValid: true }
      }

      // Otherwise reject - email doesn't exist or other permanent failure
      console.warn('[Email Service] Email validation FAILED for:', email, 'SMTP Reason:', smtpReason, 'Overall reason:', result.reason)
      return {
        isValid: false,
        reason: result.reason || 'smtp'
      }
    } catch (error: any) {
      console.error('[Email Service] Email validation exception:', error.message)

      // Check if error is a timeout
      const errorMsg = error.message?.toLowerCase() || ''
      
      if (errorMsg.includes('timeout') || errorMsg.includes('econnrefused') || errorMsg.includes('econnreset')) {
        console.log('[Email Service] Email validation timeout - allowing booking')
        return { isValid: true }
      }

      // Other errors - be more strict
      if (errorMsg.includes('invalid') || errorMsg.includes('malformed')) {
        return { isValid: false, reason: 'invalid_format' }
      }

      // Unknown error - reject to be safe
      console.warn('[Email Service] Unknown validation error, rejecting email:', errorMsg)
      return { isValid: false, reason: 'validation_error' }
    }
  },

  /**
   * Send verification email to customer for public booking
   */
  async sendVerificationCustomerEmail(email: string, verificationToken: string, bookingDetails: {
    customerName: string
    serviceName: string
    date: string
    time: string
    startTime: Date
    endTime: Date
    staffName?: string
  }): Promise<boolean> {
    try {
      console.log('[Email Service] Sending verification email to:', email)
      const transporter = initializeTransporter()

        const formattedDate = formatBookingDate(bookingDetails.startTime, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
      const formattedStartTime = formatBookingDate(bookingDetails.startTime, {
        hour: '2-digit', minute: '2-digit'
      })
      const formattedEndTime = formatBookingDate(bookingDetails.endTime, {
        hour: '2-digit', minute: '2-digit'
      })

      const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || ''}/book/verify/${verificationToken}`

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0;">Verify Your Booking</h2>
          </div>

          <p style="color: #555; font-size: 16px;">Hi ${bookingDetails.customerName},</p>

          <p style="color: #555; line-height: 1.6;">
            Thank you for booking with us! To confirm your appointment, please verify your email address by clicking the button below.
          </p>

          <div style="margin: 30px 0; text-align: center;">
            <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 12px 32px; text-decoration: none; border-radius: 4px; font-size: 16px; display: inline-block;">
              Verify Email & Confirm Booking
            </a>
          </div>

          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="color: #333; font-weight: bold; margin: 0 0 10px 0;">Booking Details:</p>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li><strong>Service:</strong> ${bookingDetails.serviceName}</li>
              <li><strong>Date:</strong> ${formattedDate}</li>
             <li><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</li>
              ${bookingDetails.staffName ? `<li><strong>Staff:</strong> ${bookingDetails.staffName}</li>` : ''}
            </ul>
          </div>

          <p style="color: #777; font-size: 14px; margin-top: 20px;">
            This link will expire in 24 hours. If you did not make this booking, please ignore this email.
          </p>

          <p style="color: #777; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            Appoint-Nepal - Appointment Booking System<br>
            ${process.env.NEXT_PUBLIC_APP_URL || ''}
          </p>
        </div>
      `

      const result = await transporter.sendMail({
        from: emailFrom,
        sender: emailUser,
        replyTo: emailFrom,
        to: email,
        envelope: { from: emailUser, to: email },
        subject: `Verify Your Booking - ${bookingDetails.serviceName}`,
        html,
      })

      // Log the real SMTP outcome so we can tell delivery from silent rejection.
      console.log('[Email Service] Verification email SMTP result:', {
        to: email,
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
        response: result.response,
      })

      if (result.rejected && result.rejected.length > 0) {
        console.error('[Email Service] Recipient was REJECTED by the mail server:', result.rejected)
        return false
      }

      return true
    } catch (error: any) {
      console.error('[Email Service] Failed to send verification email:', {
        code: error.code,
        responseCode: error.responseCode,
        command: error.command,
        message: error.message,
      })
      return false
    }
  },
}
