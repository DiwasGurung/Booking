import nodemailer from 'nodemailer'

const emailUser = process.env.EMAIL_USER || 'diwasgrg14@gmail.com'
const emailPassword = process.env.EMAIL_PASSWORD || 'your-app-password'

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
})

export const emailService = {
  /**
   * Send email verification code
   */
  async sendVerificationEmail(email: string, verificationCode: string) {
    try {
      const mailOptions = {
        from: emailUser,
        to: email,
        subject: 'Verify Your Email Address - BookFlow',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin: 0;">Welcome to BookFlow!</h2>
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

      await transporter.sendMail(mailOptions)
      console.log('[v0] Email verification code sent to:', email)
    } catch (error) {
      console.error('[v0] Failed to send verification email:', error)
      throw error
    }
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}`

      const mailOptions = {
        from: emailUser,
        to: email,
        subject: 'Reset Your Password - BookFlow',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="color: #666; font-size: 16px;">
              Click the link below to reset your password. This link will expire in 1 hour.
            </p>
            <a href="${resetLink}" style="background-color: #008B8B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; margin: 20px 0;">
              Reset Password
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
        `,
      }

      await transporter.sendMail(mailOptions)
      console.log('[v0] Password reset email sent to:', email)
    } catch (error) {
      console.error('[v0] Failed to send password reset email:', error)
      throw error
    }
  },
}
