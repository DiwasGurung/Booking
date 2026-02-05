import  {prisma}  from "../lib/prisma"
import type  {Business, Prisma} from "../generated/prisma/client"


export class BusinessService {
  /**
   * Create a new business
   */
  async createBusiness(data: {
    userId: string
    name: string
    email: string
    phone: string
    category: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    description?: string
    website?: string
    logo?: string
  }): Promise<Business> {
    return prisma.business.create({
      data,
    })
  }

  /**
   * Get business by ID
   */
  async getBusinessById(id: string): Promise<Business | null> {
    return prisma.business.findUnique({
      where: { id },
      include: {
        user: true,
        services: true,
        hours: true,
      },
    })
  }

  /**
   * Get business by user ID
   */
  async getBusinessByUserId(userId: string): Promise<Business | null> {
    return prisma.business.findUnique({
      where: { userId },
      include: {
        user: true,
        services: true,
        hours: true,
      },
    })
  }

  /**
   * Update business
   */
  async updateBusiness(id: string, data: Prisma.BusinessUpdateInput): Promise<Business> {
    return prisma.business.update({
      where: { id },
      data,
    })
  }

  /**
   * Delete business
   */
  async deleteBusiness(id: string): Promise<Business> {
    return prisma.business.delete({
      where: { id },
    })
  }

  /**
   * Get all businesses with pagination
   */
  async getAllBusinesses(
    page = 1,
    limit = 10,
    category?: string,
    isActive?: boolean,
  ): Promise<{ businesses: Business[]; total: number }> {
    const skip = (page - 1) * limit

    const where: Prisma.BusinessWhereInput = {}
    if (category) where.category = category
    if (isActive !== undefined) where.isActive = isActive

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take: limit,
        include: { user: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.business.count({ where }),
    ])

    return { businesses, total }
  }

  /**
   * Get business statistics
   */
  async getBusinessStats(businessId: string) {
    const [totalBookings, totalRevenue, completedBookings, averageRating] = await Promise.all([
      prisma.booking.count({
        where: { businessId },
      }),
      prisma.payment.aggregate({
        where: { businessId, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.booking.count({
        where: { businessId, status: "COMPLETED" },
      }),
      prisma.business.findUnique({
        where: { id: businessId },
        select: { rating: true },
      }),
    ])

    return {
      totalBookings,
      totalRevenue: totalRevenue._sum.amount || 0,
      completedBookings,
      averageRating: averageRating?.rating || 0,
      conversionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
    }
  }

  /**
   * Get monthly revenue
   */
  async getMonthlyRevenue(businessId: string, months = 6) {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const payments = await prisma.payment.findMany({
      where: {
        businessId,
        status: "COMPLETED",
        createdAt: { gte: startDate },
      },
      select: { amount: true, createdAt: true },
    })

    // Group by month
    const monthlyData: Record<string, number> = {}
    payments.forEach((payment: any) => {
      const monthKey = payment.createdAt.toISOString().slice(0, 7)
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + payment.amount
    })

    return monthlyData
  }

  /**
   * Search businesses
   */
  async searchBusinesses(query: string, limit = 10) {
    return prisma.business.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      include: { user: true },
    })
  }
}

export default new BusinessService()
