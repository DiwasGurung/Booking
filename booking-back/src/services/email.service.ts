import nodemailer from 'nodemailer'

const emailUser = process.env.EMAIL_USER || 'your-email@gmail.com'
const emailPassword = process.env.EMAIL_PASSWORD || 'your-app-password'

// Verify transporter configuration on startup
let transporter: nodemailer.Transporter | null = null

const initializeTransporter = () => {
  if (transporter) return transporter

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  })

  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('[Email Service] Connection error. Please check your EMAIL_USER and EMAIL_PASSWORD environment variables:', error.message)
      console.error('[Email Setup] Make sure you are using a Gmail App Password, not your regular password.')
      console.error('[Email Setup] See: https://support.google.com/accounts/answer/185833')
    } else {
      console.log('[Email Service] Ready to send emails')
    }
  })

  return transporter
}

export const emailService = {
  /**
   * Send email verification code
   */
  async sendVerificationEmail(email: string, verificationCode: string) {
    try {
      const transporter = initializeTransporter()

      const mailOptions = {
        from: emailUser,
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
      console.error('[Email Service] Failed to send verification email:', error.message)
      
      // Provide helpful error messages
      if (error.code === 'EAUTH') {
        console.error('[Email Setup] Authentication failed. Please:')
        console.error('1. Enable 2-Factor Authentication on your Google Account')
        console.error('2. Generate an App Password: https://myaccount.google.com/apppasswords')
        console.error('3. Set EMAIL_PASSWORD to the 16-character App Password (without spaces)')
        console.error('4. Make sure EMAIL_USER is your full Gmail address')
      }
      
      throw error
    }
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string) {
    try {
      const transporter = initializeTransporter()
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

      const mailOptions = {
        from: emailUser,
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
      
      const formattedDate = new Date(bookingDetails.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      const formattedStartTime = new Date(bookingDetails.startTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
      
      const formattedEndTime = new Date(bookingDetails.endTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })

      const mailOptions = {
        from: emailUser,
        to: ownerEmail,
        subject: `New Booking Received - ${bookingDetails.serviceName} - Appoint-Nepal`,
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
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/bookings" 
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
      
      const formattedDate = new Date(bookingDetails.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      const formattedStartTime = new Date(bookingDetails.startTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })

      const mailOptions = {
        from: emailUser,
        to: customerEmail,
        subject: `Booking Confirmed - ${bookingDetails.businessName} - Appoint-Nepal`,
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
              
              <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
                Thank you for booking with Appoint-Nepal!
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
}
