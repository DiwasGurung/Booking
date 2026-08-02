import  prisma  from "../lib/prisma"
import type { Booking, Prisma, BookingStatus } from "@prisma/client"

export class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(data: {
    serviceId: string
    businessId: string
    userId: string
    customerId?: string
    startTime: Date
    endTime: Date
    customerName: string
    customerEmail: string
    customerPhone: string
    notes?: string
  }): Promise<Booking> {
    return prisma.booking.create({
      data,
    })
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<Booking | null> {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        business: true,
        user: true,
        customer: true,
        staff: true,
      },
    })
  }

  /**
   * Get all bookings for a business
   */
  async getBusinessBookings(
    businessId: string,
    page = 1,
    limit = 10,
    status?: BookingStatus,
  ): Promise<{ bookings: Booking[]; total: number }> {
    const skip = (page - 1) * limit

    const where: Prisma.BookingWhereInput = { businessId }
    if (status) where.status = status

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: { service: true, customer: true, staff: true},
        orderBy: { startTime: "desc" },
      }),
      prisma.booking.count({ where }),
    ])

    return { bookings, total }
  }

  /**
   * Get bookings for a customer
   */
  async getCustomerBookings(userId: string): Promise<Booking[]> {
    return prisma.booking.findMany({
      where: { userId },
      include: { service: true, business: true, staff: true },
      orderBy: { startTime: "desc" },
    })
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
    return prisma.booking.update({
      where: { id },
      data: { status },
    })
  }

  /**
   * Update booking
   */
  async updateBooking(id: string, data: Prisma.BookingUpdateInput): Promise<Booking> {
    return prisma.booking.update({
      where: { id },
      data,
    })
  }

  /**
   * Cancel booking
   */
  async cancelBooking(id: string): Promise<Booking> {
    return prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    })
  }

  /**
   * Delete booking
   */
  async deleteBooking(id: string): Promise<Booking> {
    return prisma.booking.delete({
      where: { id },
    })
  }

  /**
   * Get available slots for a service on a specific date
   */
  async getAvailableSlots(serviceId: string, businessId: string, date: Date): Promise<Date[]> {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) throw new Error("Service not found")

    // Get business hours for the day
    const dayOfWeek = date.getDay()
    const businessHours = await prisma.businessHours.findUnique({
      where: {
        businessId_dayOfWeek: {
          businessId,
          dayOfWeek: dayOfWeek === 0 ? 6 : dayOfWeek - 1, // Convert JS day (0=Sun) to DB day (0=Mon)
        },
      },
    })

    if (!businessHours || businessHours.isClosed) return []

    // Parse opening hours
    const [openHour, openMin] = businessHours.openTime.split(":").map(Number)
    const [closeHour, closeMin] = businessHours.closeTime.split(":").map(Number)

    // Get booked slots
    const bookings = await prisma.booking.findMany({
      where: {
        serviceId,
        startTime: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
         BookingStatus: "CONFIRMED",
      },
    })

    const slots: Date[] = []
    const slotDuration = service.duration

    for (let hour = openHour; hour < closeHour; hour++) {
      for (let min = hour === openHour ? openMin : 0; min < 60; min += slotDuration) {
        const slotStart = new Date(date)
        slotStart.setHours(hour, min, 0, 0)

        const slotEnd = new Date(slotStart)
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration)

        if (slotEnd.getHours() > closeHour) break

        // Check if slot is available
        const isAvailable = !bookings.some((booking: any) => {
          return slotStart < booking.endTime && slotEnd > booking.startTime
        })

        if (isAvailable) {
          slots.push(slotStart)
        }
      }
    }

    return slots
  }

  /**
   * Get booking trends
   */
  async getBookingTrends(businessId: string, days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const bookings = await prisma.booking.findMany({
      where: {
        businessId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        status: true,
      },
    })

    const trends: Record<string, { total: number; completed: number }> = {}

    bookings.forEach((booking: any) => {
      const dateKey = booking.createdAt.toISOString().split("T")[0]
      if (!trends[dateKey]) {
        trends[dateKey] = { total: 0, completed: 0 }
      }
      trends[dateKey].total++
      if (booking.status === "COMPLETED") {
        trends[dateKey].completed++
      }
    })

    return trends
  }
}

export default new BookingService()
