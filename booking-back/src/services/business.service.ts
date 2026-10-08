import prisma from "../lib/prisma"
import type { Business, Prisma } from "@prisma/client"
import { normalizeDataUrlImage } from "../utils/image"
import { generateUniqueSlug } from "../utils/slug"
import { createMainBranch, syncMainBranchIfSingle } from "../lib/branch"

function parseCoord(value: unknown, min: number, max: number): number | null | undefined {
  if (value === undefined) return undefined // field not sent: leave unchanged
  if (value === null || value === '') return null // explicit removal
  const n = Number(value)
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new Error('Invalid coordinates')
  }
  return n
}

const publicBusinessListSelect = {
  id: true,
  name: true,
  slug: true,
  category: true,
  description: true,
  phone: true,
  website: true,
  address: true,
  city: true,
  state: true,
  country: true,
  logo: true,
  coverImage: true,
  isVerified: true,
  isActive: true,
  rating: true,
  latitude: true,
  longitude: true,
  createdAt: true,
} satisfies Prisma.BusinessSelect

type PublicBusinessListItem = Prisma.BusinessGetPayload<{
  select: typeof publicBusinessListSelect
}>

export class BusinessService {

  async isSlugAvailable(slug: string, businessId: string) {
    const existing = await prisma.business.findUnique({ where: { slug }, select: { id: true } })
    return !existing || existing.id === businessId
  }

  async updateSlug(businessId: string, slug: string) {
    return prisma.business.update({
      where: { id: businessId },
      data: { slug },
      select: { id: true, slug: true },
    })
  }

  /**
   * Create a new business. The business, its Main branch and the owner's
   * role change are created in one transaction, so a business can never
   * exist without a branch.
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
    const existingBusiness = await prisma.business.findUnique({ where: { userId: data.userId } })
    if (existingBusiness) {
      throw new Error("This user already has a business")
    }

    let business: Business | null = null

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const slug = await generateUniqueSlug(data.name)

        business = await prisma.$transaction(async (tx) => {
          const created = await tx.business.create({
            data: {
              name: data.name,
              slug,
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
              user: { connect: { id: data.userId } },
            },
          })

          // Every business always has a Main branch
          await createMainBranch(tx, created)

          // Update user role to BUSINESS_OWNER (must match the UserRole enum)
          await tx.user.update({
            where: { id: data.userId },
            data: { role: 'BUSINESS_OWNER' },
          })

          return created
        })
        break
      } catch (err: any) {
        const target: string[] = err?.meta?.target ?? []
        // Only retry when the collision was on slug (not userId or email)
        if (err?.code === 'P2002' && target.includes('slug')) continue
        throw err
      }
    }

    if (!business) throw new Error('Could not generate a unique booking URL')

    return business
  }

  /**
   * Get business by ID
   */
  async getBusinessById(id: string) {
    return prisma.business.findUnique({
      where: { id },
      include: {
        user: true,
        services: true,
        staff: true,
        hours: true,
        branches: true,
      },
    })
  }

  /**
   * Get business by user ID
   */
  async getBusinessByUserId(userId: string) {
    return prisma.business.findUnique({
      where: { userId },
      include: {
        user: true,
        services: true,
        staff: true,
        hours: true,
        branches: true,
      },
    })
  }

  /**
   * Update business. While the business has a single branch, the Main
   * branch is kept in sync with the business profile.
   */
  async updateBusiness(id: string, data: Prisma.BusinessUpdateInput): Promise<Business> {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.business.update({ where: { id }, data })
      await syncMainBranchIfSingle(tx, updated)
      return updated
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

  async getAllBusinesses(
    page = 1,
    limit = 10,
    category?: string,
    isActive?: boolean,
  ): Promise<{ businesses: PublicBusinessListItem[]; total: number }> {
    const skip = (page - 1) * limit

    const where: Prisma.BusinessWhereInput = {}
    if (category) where.category = category
    if (isActive !== undefined) where.isActive = isActive

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          phone: true,
          website: true,
          address: true,
          city: true,
          state: true,
          country: true,
          logo: true,
          coverImage: true,
          isVerified: true,
          isActive: true,
          rating: true,
          latitude: true,
          longitude: true,
          createdAt: true,
          slug: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.business.count({ where }),
    ])

    return { businesses, total }
  }

  /**
   * Get business statistics. Optional branch filter; payments are
   * business-level (subscription / SMS credits), so they are never filtered.
   */
  async getBusinessStats(businessId: string, branchId?: string) {
    const b = branchId ? { branchId } : {}

    const [totalBookings, totalRevenue, completedBookings, averageRating] = await Promise.all([
      prisma.booking.count({
        where: { businessId, ...b },
      }),
      prisma.payment.aggregate({
        where: { businessId, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.booking.count({
        where: { businessId, status: "COMPLETED", ...b },
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
          latitude: true,
          longitude: true,
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
        latitude: business.latitude ?? null,
        longitude: business.longitude ?? null,
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
   * Public profile. Includes active branches so the booking page can show
   * a branch picker (only when there is more than one).
   * Hours carry their branchId; clients filter by the chosen branch.
   */
  async getPublicBusinessById(identifier: string) {
    return prisma.business.findFirst({
      where: { OR: [{ slug: identifier.toLowerCase() }, { id: identifier }] },
      select: {
        id: true, slug: true, name: true, description: true, logo: true, coverImage: true,
        phone: true, website: true, category: true, address: true, city: true,
        state: true, country: true, isVerified: true, isActive: true, rating: true,
        latitude: true, longitude: true,
        services: {
          where: { isActive: true },
          select: { id: true, name: true, description: true, price: true, offerPrice: true, duration: true, capacity: true },
        },
        branches: {
          where: { isActive: true },
          orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
          select: {
            id: true, name: true, address: true, city: true, phone: true,
            latitude: true, longitude: true, isMain: true,
          },
        },
        hours: {
          select: { branchId: true, dayOfWeek: true, openTime: true, closeTime: true, isClosed: true },
        },
      },
    })
  }

  /**
   * Get booking and customer analytics. Subscription payments are intentionally excluded.
   * Optional branch filter applies to bookings only: customers belong to the business.
   */
  async getBusinessAnalytics(businessId: string, days = 30, branchId?: string) {
    const b = branchId ? { branchId } : {}
    const safeDays = Math.min(Math.max(days, 1), 365)
    const now = new Date()
    const currentStart = new Date(now)
    currentStart.setDate(now.getDate() - safeDays)
    const previousStart = new Date(currentStart)
    previousStart.setDate(currentStart.getDate() - safeDays)

    const [currentBookings, previousBookings, customers, currentCustomers, previousCustomers, statusRows, serviceRows] = await Promise.all([
      prisma.booking.findMany({
        where: { businessId, ...b, createdAt: { gte: currentStart } },
        select: { id: true, status: true, service: { select: { name: true } }, createdAt: true },
      }),
      prisma.booking.count({ where: { businessId, ...b, createdAt: { gte: previousStart, lt: currentStart } } }),
      prisma.customer.count({ where: { businessId } }),
      prisma.customer.count({ where: { businessId, createdAt: { gte: currentStart } } }),
      prisma.customer.count({ where: { businessId, createdAt: { gte: previousStart, lt: currentStart } } }),
      prisma.booking.groupBy({ by: ['status'], where: { businessId, ...b, createdAt: { gte: currentStart } }, _count: { _all: true } }),
      prisma.booking.groupBy({ by: ['serviceId'], where: { businessId, ...b, createdAt: { gte: currentStart } }, _count: { _all: true }, orderBy: { _count: { serviceId: 'desc' } }, take: 5 }),
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
   * Update business settings. While the business has a single branch, the
   * Main branch is kept in sync (address, phone, map pin).
   */
  async updateBusinessSettings(businessId: string, settings: any) {
    try {
      if (settings.logo) {
        settings.logo = await normalizeDataUrlImage(settings.logo, "logo")
      }
      if (settings.coverImage) {
        settings.coverImage = await normalizeDataUrlImage(settings.coverImage, "cover")
      }
      const latitude = parseCoord(settings.latitude, -90, 90)
      const longitude = parseCoord(settings.longitude, -180, 180)

      // Either both are set or both are cleared
      if ((latitude === null) !== (longitude === null) && latitude !== undefined && longitude !== undefined) {
        throw new Error('Invalid coordinates')
      }

      const business = await prisma.$transaction(async (tx) => {
        const updated = await tx.business.update({
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
            ...(latitude !== undefined && { latitude }),
            ...(longitude !== undefined && { longitude }),
            ...(settings.logo !== undefined && { logo: settings.logo || null }),
            ...(settings.coverImage !== undefined && { coverImage: settings.coverImage || null }),
            ...(settings.socialMedia && { socialMedia: settings.socialMedia }),
            ...(settings.notificationSettings && { notificationSettings: settings.notificationSettings }),
          },
        })

        await syncMainBranchIfSingle(tx, updated)
        return updated
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
        latitude: business.latitude,
        longitude: business.longitude,
      }
    } catch (error) {
      throw error
    }
  }
}

export default new BusinessService()