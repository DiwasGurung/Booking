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
      throw error
    }
  }
  /**
   * Get booking and customer analytics. Subscription payments are intentionally excluded.
   */
  async getBusinessAnalytics(businessId: string, days = 30) {
    const safeDays = Math.min(Math.max(days, 1), 365)
    const now = new Date()
    const currentStart = new Date(now)
    currentStart.setDate(now.getDate() - safeDays)
    const previousStart = new Date(currentStart)
    previousStart.setDate(currentStart.getDate() - safeDays)

    const [currentBookings, previousBookings, customers, currentCustomers, previousCustomers, statusRows, serviceRows] = await Promise.all([
      prisma.booking.findMany({
        where: { businessId, createdAt: { gte: currentStart } },
        select: { id: true, status: true, service: { select: { name: true } }, createdAt: true },
      }),
      prisma.booking.count({ where: { businessId, createdAt: { gte: previousStart, lt: currentStart } } }),
      prisma.customer.count({ where: { businessId } }),
      prisma.customer.count({ where: { businessId, createdAt: { gte: currentStart } } }),
      prisma.customer.count({ where: { businessId, createdAt: { gte: previousStart, lt: currentStart } } }),
      prisma.booking.groupBy({ by: ['status'], where: { businessId, createdAt: { gte: currentStart } }, _count: { _all: true } }),
      prisma.booking.groupBy({ by: ['serviceId'], where: { businessId, createdAt: { gte: currentStart } }, _count: { _all: true }, orderBy: { _count: { serviceId: 'desc' } }, take: 5 }),
    ])

    const serviceIds = serviceRows.map((row: { serviceId: any }) => row.serviceId)
    const services = await prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true } })
    const serviceNames = new Map(services.map((service: { id: any; name: any }) => [service.id, service.name]))
    const bookingsByStatus = Object.fromEntries(statusRows.map((row: { status: any; _count: { _all: any } }) => [row.status, row._count._all]))
    const bookingGrowth = previousBookings === 0 ? (currentBookings.length ? 100 : 0) : ((currentBookings.length - previousBookings) / previousBookings) * 100
    const customerGrowth = previousCustomers === 0 ? (currentCustomers ? 100 : 0) : ((currentCustomers - previousCustomers) / previousCustomers) * 100

    return {
      totalBookings: currentBookings.length,
      bookingGrowth,
      totalCustomers: customers,
      newCustomers: currentCustomers,
      customersGrowth: customerGrowth,
      conversionRate: currentBookings.length ? ((bookingsByStatus.COMPLETED || 0) / currentBookings.length) * 100 : 0,
      bookingsByStatus,
      topServices: serviceRows.map((row: { serviceId: unknown; _count: { _all: any } }) => ({ name: serviceNames.get(row.serviceId) || 'Unknown service', bookings: row._count._all })),
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
