import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import  prisma from '../lib/prisma'
import { emailService } from './email.service'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const SALT_ROUNDS = 10

interface StaffLoginPayload {
  staffId: string
  email: string
  businessId: string
}

class StaffAuthService {
  /**
   * Hash a password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS)
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Set password for staff after email verification
   */
  async setPassword(staffId: string, password: string) {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    const hashedPassword = await this.hashPassword(password)

    const staff = await prisma.staff.update({
      where: { id: staffId },
      data: {
        password: hashedPassword,
        emailVerified: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        businessId: true,
      },
    })

    return staff
  }

  /**
   * Login staff with email and password
   */
  async login(email: string, password: string) {
    const staff = await prisma.staff.findFirst({
      where: {
        email: email.toLowerCase(),
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
        businessId: true,
        emailVerified: true,
        avatar: true,
        role: true,
      },
    })

    if (!staff) {
      throw new Error('Staff member not found')
    }

    if (!staff.emailVerified) {
      throw new Error('Email not verified. Please verify your email first.')
    }

    if (!staff.password) {
      throw new Error('Password not set. Please check your email for setup instructions.')
    }

    const isPasswordValid = await this.comparePassword(password, staff.password)

    if (!isPasswordValid) {
      throw new Error('Invalid password')
    }

    // Generate JWT token
    const token = this.generateToken({
      staffId: staff.id,
      email: staff.email,
      businessId: staff.businessId,
    })

    return {
      token,
      staff: {
        id: staff.id,
        email: staff.email,
        firstName: staff.firstName,
        lastName: staff.lastName,
        avatar: staff.avatar,
        role: staff.role,
        businessId: staff.businessId,
      },
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: StaffLoginPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '7d',
    })
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET) as StaffLoginPayload
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    const staff = await prisma.staff.findFirst({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, firstName: true, businessId: true, business: { select: { name: true } } },
    })

    if (!staff) {
      // Don't reveal if email exists for security
      return { message: 'If an account exists, a reset link has been sent' }
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiresAt: resetTokenExpiry,
      },
    })
    await emailService.sendPasswordResetEmail(staff.email, resetToken, 'staff')

    return { message: 'If an account exists, a reset link has been sent' }
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetToken: string, newPassword: string) {
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    const staff = await prisma.staff.findFirst({
      where: {
        passwordResetToken: resetToken,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
    })

    if (!staff) {
      throw new Error('Invalid or expired reset token')
    }

    const hashedPassword = await this.hashPassword(newPassword)

    const updatedStaff = await prisma.staff.update({
      where: { id: staff.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
      },
    })

    return updatedStaff
  }

  /**
   * Check if staff has password set
   */
  async hasPasswordSet(staffId: string): Promise<boolean> {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { password: true },
    })

    return !!staff?.password
  }
}

export const staffAuthService = new StaffAuthService()
