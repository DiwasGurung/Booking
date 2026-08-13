"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const emailUser = process.env.EMAIL_USER || 'your-email@gmail.com';
const emailPassword = process.env.EMAIL_PASSWORD || 'your-app-password';
// Verify transporter configuration on startup
let transporter = null;
const initializeTransporter = () => {
    if (transporter)
        return transporter;
    transporter = nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: emailPassword,
        },
    });
    // Verify connection
    transporter.verify((error, success) => {
        if (error) {
            console.error('[Email Service] Connection error. Please check your EMAIL_USER and EMAIL_PASSWORD environment variables:', error.message);
            console.error('[Email Setup] Make sure you are using a Gmail App Password, not your regular password.');
            console.error('[Email Setup] See: https://support.google.com/accounts/answer/185833');
        }
        else {
        }
    });
    return transporter;
};
exports.emailService = {
    /**
     * Send verification email to customer for public booking
     */
    async sendVerificationCustomerEmail(email, verificationToken, bookingDetails) {
        try {
            const transporter = initializeTransporter();
            const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/book/verify/${verificationToken}`;
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
              <li><strong>Date:</strong> ${bookingDetails.date}</li>
              <li><strong>Time:</strong> ${bookingDetails.time}</li>
              ${bookingDetails.staffName ? `<li><strong>Staff:</strong> ${bookingDetails.staffName}</li>` : ''}
            </ul>
          </div>

          <p style="color: #777; font-size: 14px; margin-top: 20px;">
            This link will expire in 24 hours. If you did not make this booking, please ignore this email.
          </p>

          <p style="color: #777; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            Appoint-Nepal - Appointment Booking System<br>
            ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
          </p>
        </div>
      `;
            const result = await transporter.sendMail({
                from: emailUser,
                to: email,
                subject: `Verify Your Booking - ${bookingDetails.serviceName}`,
                html,
            });
            return true;
        }
        catch (error) {
            console.error('[Email Service] Failed to send verification email:', error.message);
            return false;
        }
    },
    /**
     * Send email verification code
     */
    async sendVerificationEmail(email, verificationCode) {
        try {
            const transporter = initializeTransporter();
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
            };
            const result = await transporter.sendMail(mailOptions);
            return result;
        }
        catch (error) {
            console.error('[Email Service] Failed to send verification email:', error.message);
            // Provide helpful error messages
            if (error.code === 'EAUTH') {
                console.error('[Email Setup] Authentication failed. Please:');
                console.error('1. Enable 2-Factor Authentication on your Google Account');
                console.error('2. Generate an App Password: https://myaccount.google.com/apppasswords');
                console.error('3. Set EMAIL_PASSWORD to the 16-character App Password (without spaces)');
                console.error('4. Make sure EMAIL_USER is your full Gmail address');
            }
            throw error;
        }
    },
    /**
   * Send password reset email
   */
    async sendPasswordResetEmail(email, resetToken, accountType = 'staff') {
        try {
            const transporter = initializeTransporter();
            const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${encodeURIComponent(resetToken)}&type=${accountType}`;
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
            };
            const result = await transporter.sendMail(mailOptions);
            return result;
        }
        catch (error) {
            console.error('[Email Service] Failed to send password reset email:', error.message);
            throw error;
        }
    },
    /**
     * Send new booking notification to business owner
     */
    async sendNewBookingNotification(ownerEmail, bookingDetails) {
        try {
            const transporter = initializeTransporter();
            const formattedDate = new Date(bookingDetails.startTime).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const formattedStartTime = new Date(bookingDetails.startTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const formattedEndTime = new Date(bookingDetails.endTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
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
            };
            const result = await transporter.sendMail(mailOptions);
            return result;
        }
        catch (error) {
            console.error('[Email Service] Failed to send new booking notification:', error.message);
            throw error;
        }
    },
    /**
     * Send booking confirmation to customer
     */
    async sendBookingConfirmationToCustomer(customerEmail, bookingDetails) {
        try {
            const transporter = initializeTransporter();
            const formattedDate = new Date(bookingDetails.startTime).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const formattedStartTime = new Date(bookingDetails.startTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
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
            };
            const result = await transporter.sendMail(mailOptions);
            return result;
        }
        catch (error) {
            console.error('[Email Service] Failed to send booking confirmation to customer:', error.message);
            throw error;
        }
    },
    /**
     * Send staff email verification
     */
    async sendStaffVerificationEmail(staffEmail, staffName, verificationToken, businessName) {
        try {
            const transporter = initializeTransporter();
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const verificationLink = `${baseUrl}/staff/verify-email?token=${verificationToken}`;
            const mailOptions = {
                from: emailUser,
                to: staffEmail,
                subject: `Verify Your Email - ${businessName} Staff Portal`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #008B8B; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">Welcome to Appoint-Nepal Staff Portal!</h2>
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
            };
            const result = await transporter.sendMail(mailOptions);
            return result;
        }
        catch (error) {
            console.error('[Email Service] Failed to send staff verification email:', error.message);
            throw error;
        }
    },
};
