import { prisma } from "../lib/prisma"
import type { Service, Prisma } from "../../prisma/src/generated/prisma/client"

export class ServiceService {
  /**
   * Create a new service
   */
  async createService(data: {
    businessId: string
    name: string
    price: number
    offerPrice?: number
    duration: number
    description?: string
    image?: string
    capacity?: number
     isActive?: boolean
  }): Promise<Service> {
    return prisma.service.create({
      data,
    })
  }

  /**
   * Get service by ID
   */
  async getServiceById(id: string): Promise<Service | null> {
    return prisma.service.findUnique({
      where: { id },
    })
  }

  /**
   * Get all services for a business
   */
  async getBusinessServices(businessId: string): Promise<Service[]> {
    return prisma.service.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * Update service
   */
  async updateService(id: string, data: Prisma.ServiceUpdateInput): Promise<Service> {
    return prisma.service.update({
      where: { id },
      data,
    })
  }

  /**
   * Delete service
   */
  async deleteService(id: string): Promise<Service> {
    return prisma.service.delete({
      where: { id },
    })
  }

  /**
   * Get all active services for a business
   */
  async getActiveServices(businessId: string): Promise<Service[]> {
    return prisma.service.findMany({
      where: { businessId, isActive: true },
      orderBy: { name: "asc" },
    })
  }

  /**
   * Get services with booking stats
   */
  async getServicesWithStats(businessId: string) {
    return prisma.service.findMany({
      where: { businessId },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }
}

export default new ServiceService()
