import prisma  from "../lib/prisma"
import bcrypt from "bcrypt"


export const userService = {
  // Create a new user
  async createUser(data: {
    email: string
    password?: string
    firstName: string
    lastName: string
    phone?: string
    role?: "CUSTOMER" | "BUSINESS_OWNER"
    googleId?: string
    authProvider?: "EMAIL" | "GOOGLE" 
    emailVerificationCode?: string
    emailVerificationCodeExpires?: Date
    firebaseUid?: string
    isPhoneVerified?: boolean
    isEmailVerified?:boolean
  }) {
    // Password is already hashed by the controller
    // Do NOT hash it again here
    return prisma.user.create({
      data: {
        ...data,
        role: data.role || "CUSTOMER",
        authProvider: data.authProvider || "EMAIL",
      },
      include: {
        business: true,
      },
    })
  },

  // Get user by ID
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        business: true,
      },
    })
  },

 
  

  // Get user by email
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        business: true,
      },
    })
  },

  // Get user by Google ID
  async findByGoogleId(googleId: string) {
    return prisma.user.findUnique({
      where: { googleId },
      include: {
        business: true,
      },
    })
  },

  // Find user by email verification token (kept for compatibility)
  async findByVerificationToken(token: string) {
    return prisma.user.findUnique({
      where: { emailVerificationCode: token },
      include: {
        business: true,
      },
    })
  },

  // Verify password
  async verifyPassword(password: string, hashedPassword: string | null): Promise<boolean> {
    if (!hashedPassword) {
      return false
    }
    return bcrypt.compare(password, hashedPassword)
  },

  // Link Google to existing user
  async linkGoogleToUser(userId: string, googleId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        googleId,
        authProvider: "GOOGLE",
      },
      include: {
        business: true,
      },
    })
  },

  

  // Update phone verification status
  async updatePhoneVerification(userId: string, isVerified: boolean, phone?: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isPhoneVerified: isVerified,
        ...(phone && { phone }),
      },
      include: { business: true },
    })
  },

  // Update email verification
  async updateEmailVerification(userId: string, isVerified: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isEmailVerified: isVerified,
        emailVerificationCode: null,
        emailVerificationCodeExpires: null,
      },
      include: { business: true },
    })
  },

  // Store phone verification code
  async storePhoneVerificationCode(userId: string, code: string, expiresAt: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        phoneVerificationCode: code,
        phoneVerificationCodeExpires: expiresAt,
        phoneVerificationAttempts: 0,
      },
      include: { business: true },
    })
  },

  // Increment phone verification attempts
  async incrementPhoneVerificationAttempts(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        phoneVerificationAttempts: {
          increment: 1,
        },
      },
      include: { business: true },
    })
  },

  // Verify phone code
  async verifyPhoneCode(userId: string, code: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error("User not found")
    }

    if (user.phoneVerificationCode !== code) {
      await this.incrementPhoneVerificationAttempts(userId)
      throw new Error("Invalid verification code")
    }

    if (user.phoneVerificationCodeExpires && user.phoneVerificationCodeExpires < new Date()) {
      throw new Error("Verification code expired")
    }

    if (user.phoneVerificationAttempts >= 5) {
      throw new Error("Too many failed attempts")
    }

    // Code is valid, mark phone as verified
    return prisma.user.update({
      where: { id: userId },
      data: {
        isPhoneVerified: true,
        phoneVerificationCode: null,
        phoneVerificationCodeExpires: null,
        phoneVerificationAttempts: 0,
      },
      include: { business: true },
    })
  },

  // Update user
  async updateUser(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        business: true,
      },
    })
  },

  // Update user role
  async updateUserRole(userId: string, role: "CUSTOMER" | "BUSINESS_OWNER") {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
      include: {
        business: true,
      },
    })
  },

  // Delete user
  async deleteUser(id: string) {
    return prisma.user.delete({
      where: { id },
    })
  },


 

  // Get all users with pagination
  async getAllUsers(page = 1, limit = 10, role?: "CUSTOMER" | "BUSINESS_OWNER") {
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: role ? { role } : {},
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          business: true,
        },
      }),
      prisma.user.count({
        where: role ? { role } : {},
      }),
    ])

    return { users, total }
  },

  // Update user password
  async updatePassword(id: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    return prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      include: {
        business: true,
      },
    })
  },

  // Get verified users (both email and phone verified)
  async getVerifiedUsers(limit = 100) {
    return prisma.user.findMany({
      where: {
        isEmailVerified: true,
        isPhoneVerified: true,
      },
      take: limit,
      include: {
        business: true,
      },
    })
  },

  // Get users needing SMS notifications
  async getUsersForSmsNotification(limit = 100) {
    return prisma.user.findMany({
      where: {
        isPhoneVerified: true,
        phone: {
          not: null,
        },
      },
      take: limit,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
      },
    })
  },
}
