import  prisma  from '../lib/prisma'
import crypto from 'crypto'
import { emailService } from './email.service'

class StaffVerificationService {
  /**
   * Generate a verification token for staff
   */
  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Send verification email to staff
   */
  async sendVerificationEmail(staffId: string, staffEmail: string, staffName: string, businessId: string) {
    try {
      // Check if staff exists
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        include: { business: true },
      })

      if (!staff) {
        throw new Error('Staff not found')
      }

      // Generate verification token
      const verificationToken = this.generateVerificationToken()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      // Update staff with verification token
      await prisma.staff.update({
        where: { id: staffId },
        data: {
          verificationToken,
          verificationTokenExpiresAt: expiresAt,
        },
      })

      // Send verification email to staff
      await emailService.sendStaffVerificationEmail(
        staffEmail,
        staffName,
        verificationToken,
        staff.business.name
      )

      console.log(`[v0] Verification email sent to ${staffEmail}`)
      return { success: true, message: 'Verification email sent' }
    } catch (error: any) {
      console.error('[v0] Error sending verification email:', error)
      throw error
    }
  }

  /**
   * Verify staff email with token
   */
  async verifyEmail(token: string, staffId?: string) {
    try {
      const staff = staffId
        ? await prisma.staff.findUnique({ where: { id: staffId } })
        : await prisma.staff.findUnique({ where: { verificationToken: token } })

      if (!staff) {
        throw new Error('Invalid verification link')
      }

      if (staff.verificationToken !== token) {
        throw new Error('Invalid verification token')
      }

      if (!staff.verificationTokenExpiresAt || staff.verificationTokenExpiresAt < new Date()) {
        throw new Error('Verification token expired')
      }

      // Keep the token until the password is set. The set-password endpoint
      // uses this same token to authorize the first password creation.
      await prisma.staff.update({
        where: { id: staff.id },
        data: { emailVerified: true },
      })

      console.log(`[v0] Email verified for staff ${staff.id}`)
      return { success: true, staffId: staff.id, message: 'Email verified successfully' }
    } catch (error: any) {
      console.error('[v0] Error verifying email:', error)
      throw error
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(staffId?: string, token?: string) {
    try {
      const staff = staffId
        ? await prisma.staff.findUnique({ where: { id: staffId } })
        : token
          ? await prisma.staff.findUnique({ where: { verificationToken: token } })
          : null

      if (!staff) {
        throw new Error('Staff not found for this verification link')
      }

      if (staff.emailVerified) {
        throw new Error('Email already verified')
      }

      // Always rotate the token so an expired or rejected link gets replaced.
      await this.sendVerificationEmail(staff.id, staff.email, staff.firstName, staff.businessId)
      return { success: true, message: 'Verification email resent' }
    } catch (error: any) {
      console.error('[v0] Error resending verification email:', error)
      throw error
    }
  }

  /**
   * Get verification status for staff
   */
  async getVerificationStatus(staffId: string) {
    try {
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          verificationTokenExpiresAt: true,
          staffCode: true,
        },
      })

      if (!staff) {
        throw new Error('Staff not found')
      }

      return {
        id: staff.id,
        email: staff.email,
        emailVerified: staff.emailVerified,
        verificationTokenExpired: staff.verificationTokenExpiresAt ? staff.verificationTokenExpiresAt < new Date() : false,
        staffCode: staff.staffCode,
      }
    } catch (error: any) {
      console.error('[v0] Error getting verification status:', error)
      throw error
    }
  }
}

export const staffVerificationService = new StaffVerificationService()
