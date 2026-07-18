import  prisma  from "../lib/prisma"
import type  {Business, Prisma} from "@prisma/client"


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
  if (!data.userId) throw new Error("userId is required to create a business")

  // Check if user already has a business
  const existingBusiness = await prisma.business.findUnique({ where: { userId: data.userId } });
  if (existingBusiness) {
    throw new Error("This user already has a business");
  }

  // Create business and update user role to business_owner
  const business = await prisma.business.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      category: data.category,
      address: data.address,
      city: data.city,
      state: data.state || '',
      zipCode: data.zipCode || '',
      country: data.country,
      description: data.description,
      website: data.website,
      logo: data.logo,
      user: {
        connect: { id: data.userId }, 
      },
    },
  })

  // Update user role to BUSINESS_OWNER (must match the UserRole enum)
  await prisma.user.update({
    where: { id: data.userId },
    data: { role: 'BUSINESS_OWNER' }
  })

  return business
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
        staff: true,
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
        staff: true,
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

  /**
   * Get business settings
   */
  async getBusinessSettings(businessId: string) {
    try {
      console.log('[v0] getBusinessSettings called with:', businessId)
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          description: true,
          website: true,
          category: true,
          logo: true,
          coverImage: true,
          socialMedia: true,
          notificationSettings: true,
        }
      })
      
      console.log('[v0] business found:', business)
      
      if (!business) {
        throw new Error("Business not found")
      }
      
      return {
        businessName: business.name,
        email: business.email,
        phone: business.phone || '',
        address: business.address || '',
        city: business.city || '',
        state: business.state || '',
        zipCode: business.zipCode || '',
        country: business.country || '',
        description: business.description || '',
        website: business.website || '',
        category: business.category || '',
        logo: business.logo || '',
        coverImage: business.coverImage || '',
        socialMedia: business.socialMedia || {
          facebook: '',
          instagram: '',
          twitter: ''
        },
        notificationSettings: business.notificationSettings || {
          emailNotifications: true,
          smsNotifications: false,
          bookingReminders: true,
          paymentAlerts: true,
          marketingEmails: false
        }
      }
    } catch (error) {
      console.log('[v0] getBusinessSettings error:', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  /**
   * Update business settings
   */
  async updateBusinessSettings(businessId: string, settings: any) {
    try {
      const business = await prisma.business.update({
        where: { id: businessId },
        data: {
          name: settings.businessName,
          email: settings.email,
          phone: settings.phone,
          address: settings.address,
          city: settings.city,
          state: settings.state,
          zipCode: settings.zipCode,
          country: settings.country,
          description: settings.description,
          website: settings.website,
          category: settings.category,
          ...(settings.logo && { logo: settings.logo }),
          ...(settings.coverImage && { coverImage: settings.coverImage }),
          ...(settings.socialMedia && { socialMedia: settings.socialMedia }),
          ...(settings.notificationSettings && { notificationSettings: settings.notificationSettings }),
        }
      })
      
      return {
        businessName: business.name,
        email: business.email,
        phone: business.phone,
        address: business.address,
        city: business.city,
        state: business.state,
        zipCode: business.zipCode,
        country: business.country,
        description: business.description,
        website: business.website,
        category: business.category,
        logo: business.logo,
        coverImage: business.coverImage,
        socialMedia: business.socialMedia,
        notificationSettings: business.notificationSettings,
      }
    } catch (error) {
      throw error
    }
  }
}

export default new BusinessService()
