import  prisma  from "../lib/prisma"
import type { BusinessHours, Prisma } from "../../prisma/src/generated/prisma/client"

export class BusinessHoursService {
  /**
   * Set business hours for a day
   */
  async setBusinessHours(data: {
    businessId: string
    dayOfWeek: number // 0-6, Monday-Sunday
    openTime: string // HH:MM format
    closeTime: string
    isClosed?: boolean
  }): Promise<BusinessHours> {
    return prisma.businessHours.upsert({
      where: {
        businessId_dayOfWeek: {
          businessId: data.businessId,
          dayOfWeek: data.dayOfWeek,
        },
      },
      update: {
        openTime: data.openTime,
        closeTime: data.closeTime,
        isClosed: data.isClosed || false,
      },
      create: {
        businessId: data.businessId,
        dayOfWeek: data.dayOfWeek,
        openTime: data.openTime,
        closeTime: data.closeTime,
        isClosed: data.isClosed || false,
      },
    })
  }

  /**
   * Get business hours
   */
  async getBusinessHours(businessId: string): Promise<BusinessHours[]> {
    return prisma.businessHours.findMany({
      where: { businessId },
      orderBy: { dayOfWeek: "asc" },
    })
  }

  /**
   * Get hours for a specific day
   */
  async getHoursForDay(businessId: string, dayOfWeek: number): Promise<BusinessHours | null> {
    return prisma.businessHours.findUnique({
      where: {
        businessId_dayOfWeek: {
          businessId,
          dayOfWeek,
        },
      },
    })
  }

  /**
   * Update business hours
   */
  async updateBusinessHours(id: string, data: Prisma.BusinessHoursUpdateInput): Promise<BusinessHours> {
    return prisma.businessHours.update({
      where: { id },
      data,
    })
  }

  /**
   * Delete business hours
   */
  async deleteBusinessHours(id: string): Promise<BusinessHours> {
    return prisma.businessHours.delete({
      where: { id },
    })
  }

  /**
   * Check if business is open
   */
  async isBusinessOpen(businessId: string, date: Date = new Date()): Promise<boolean> {
    const dayOfWeek = date.getDay()
    const hours = await this.getHoursForDay(businessId, dayOfWeek === 0 ? 6 : dayOfWeek - 1)

    if (!hours || hours.isClosed) return false

    const [openHour, openMin] = hours.openTime.split(":").map(Number)
    const [closeHour, closeMin] = hours.closeTime.split(":").map(Number)

    const currentHour = date.getHours()
    const currentMin = date.getMinutes()

    const currentTime = currentHour * 60 + currentMin
    const openTime = openHour * 60 + openMin
    const closeTime = closeHour * 60 + closeMin

    return currentTime >= openTime && currentTime < closeTime
  }
}

export default new BusinessHoursService()
