import prisma from "../lib/prisma"

class ServiceService {
  /**
   * Get all services
   */
  async getAllServices() {
    return await prisma.service.findMany({
      include: {
        business: true,
      },
    })
  }

  /**
   * Get service by ID
   */
  async getServiceById(id: string) {
    return await prisma.service.findUnique({
      where: { id },
      include: {
        business: true,
      },
    })
  }

  /**
   * Get services by business ID
   */
  async getServicesByBusinessId(businessId: string) {
    return await prisma.service.findMany({
      where: { businessId },
      include: {
        business: true,
      },
    })
  }

  /**
   * Create service
   */
  async createService(data: {
    name: string
    description?: string
    price: number
    duration: number
    businessId: string
  }) {
    return await prisma.service.create({
      data,
      include: {
        business: true,
      },
    })
  }

  /**
   * Update service
   */
  async updateService(
    id: string,
    data: {
      name?: string
      description?: string
      price?: number
      duration?: number
    }
  ) {
    return await prisma.service.update({
      where: { id },
      data,
      include: {
        business: true,
      },
    })
  }

  /**
   * Delete service
   */
  async deleteService(id: string) {
    return await prisma.service.delete({
      where: { id },
    })
  }
/**
   * Get active services for a business
   */
  async getActiveServices(businessId: string) {
    return await prisma.service.findMany({
      where: { businessId },
      include: {
        business: true,
        staffServices: {
          include: {
            staff: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Get services with booking statistics for a business
   */
  async getServicesWithStats(businessId: string) {
    const services = await prisma.service.findMany({
      where: { businessId },
      include: {
        business: true,
        _count: {
          select: {
            bookings: true,
            staffServices: true,
          },
        },
      },
    })

    // Enrich with stats
    return services.map(service => ({
      ...service,
      stats: {
        totalBookings: service._count.bookings,
        staffCount: service._count.staffServices,
        revenue: 0, // Can be calculated from bookings if needed
      },
    }))
  }
}

export default new ServiceService()
