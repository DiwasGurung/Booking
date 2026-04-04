import { prisma } from "../lib/prisma"
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
  }) {
    

    return prisma.user.create({
      data: {
        ...data,
        role: data.role || "CUSTOMER",
        password: data.password,
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
}
