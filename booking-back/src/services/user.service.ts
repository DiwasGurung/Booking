import { prisma } from "../lib/prisma"
import type { User, Prisma } from "../generated/prisma/client"
import bcrypt from "bcrypt"

export class UserService {
  /**
   * Create a new user
   */
  async createUser(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
    role?: "CUSTOMER" | "BUSINESS_OWNER"
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10)

    return prisma.user.create({
      data: {
        ...data,
        role: data.role || "CUSTOMER",
        password: hashedPassword,
      },
    })
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    })
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    })
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    })
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    })
  }

  /**
   * Get all users with pagination
   */
  async getAllUsers(page = 1, limit = 10, role?: "CUSTOMER" | "BUSINESS_OWNER"): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: role ? { role } : {},
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({
        where: role ? { role } : {},
      }),
    ])

    return { users, total }
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, newPassword: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    return prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    })
  }
}

export default new UserService()
