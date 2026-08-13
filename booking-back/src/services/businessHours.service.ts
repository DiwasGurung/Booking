import  prisma  from "../lib/prisma.js"
import type { BusinessHours, Prisma, TimeOff, ClosedDate } from "@prisma/client"

export class BusinessHoursService {
  /**
   * Set business hours for a day
   */
  async setBusinessHours(data: {
    businessId: string
    dayOfWeek: number 
    openTime: string 
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


 
  /**
   * Add staff time off
   */
  async addTimeOff(data: {
    businessId: string
    staffId?: string
    startDate: string // YYYY-MM-DD format
    endDate: string
    reason?: string
    type?: string
  }): Promise<TimeOff> {
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    return prisma.timeOff.create({
      data: {
        businessId: data.businessId,
        staffId: data.staffId,
        startDate,
        endDate,
        reason: data.reason,
        type: data.type || "BREAK",
      },
    })
  }

  /**
   * Get time off periods for a business or staff
   */
  async getTimeOffs(businessId: string, staffId?: string): Promise<TimeOff[]> {
    return prisma.timeOff.findMany({
      where: {
        businessId,
        ...(staffId && { staffId }),
      },
      orderBy: { startDate: "asc" },
    })
  }

  /**
   * Remove time off
   */
  async removeTimeOff(timeOffId: string): Promise<TimeOff> {
    return prisma.timeOff.delete({
      where: { id: timeOffId },
    })
  }

  

  /**
   * Check if staff is on time off on a date
   */
  async isStaffOnTimeOff(businessId: string, staffId: string, date: Date): Promise<boolean> {
    const timeOff = await prisma.timeOff.findFirst({
      where: {
        businessId,
        staffId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    })

    return !!timeOff
  }

  
  /**
   * Get all closed dates for a business
   */
  async getClosedDates(businessId: string): Promise<ClosedDate[]> {
    return prisma.closedDate.findMany({
      where: { businessId },
      orderBy: { date: "asc" },
    })
  }

  /**
   * Add a closed date
   */
  async addClosedDate(businessId: string, data: { date: string; reason?: string }): Promise<ClosedDate> {
    const dateObj = new Date(data.date)
    
    return prisma.closedDate.create({
      data: {
        businessId,
        date: dateObj,
        reason: data.reason,
      },
    })
  }

  /**
   * Remove a closed date
   */
  async removeClosedDate(businessId: string, closedDateId: string): Promise<ClosedDate> {
    return prisma.closedDate.delete({
      where: {
        id: closedDateId,
      },
    })
  }
}

export default new BusinessHoursService()
