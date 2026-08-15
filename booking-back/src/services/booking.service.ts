import  prisma  from "../lib/prisma.js"
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
    staffId?: string,
    verified?: boolean,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ bookings: Booking[]; total: number }> {
    const skip = (page - 1) * limit

    const where: Prisma.BookingWhereInput = { businessId }
    if (status) where.status = status
    if (staffId) where.staffId = staffId
    if (verified !== undefined) where.isEmailVerified = verified
    if (startDate || endDate) {
      where.startTime = { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) }
    }

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
  async getAvailableSlots(serviceId: string, businessId: string, date: Date, staffId?: string): Promise<string[]> {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) throw new Error("Service not found")

    // Create proper date range without mutating the original date
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

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

    // Get staff for this service through StaffService join table
    let staffStaffServices
    if (staffId) {
      // If specific staff is selected, verify they're assigned to this service
      staffStaffServices = await prisma.staffService.findMany({
        where: {
          staffId: staffId,
          serviceId: serviceId
        },
        include: {
          staff: true
        }
      })
      if (staffStaffServices.length === 0) {
        throw new Error("Staff not found or not assigned to this service")
      }
    } else {
      // If no staff selected, get all staff for this service and business
      // First get all StaffService records for this service
      const allStaffServices = await prisma.staffService.findMany({
        where: {
          serviceId: serviceId
        },
        include: {
          staff: true
        }
      })
      
      // Filter to only active staff from this business
      staffStaffServices = allStaffServices.filter((ss: { staff: { businessId: string; isActive: any } }) => ss.staff.businessId === businessId && ss.staff.isActive)
      
      if (staffStaffServices.length === 0) {
        console.error('[v0] No staff found for service:', { businessId, serviceId })
        throw new Error(`No staff members are assigned to this service. Please contact the business.`)
      }
    }

    // Extract staff list
    const staffList = staffStaffServices.map((ss: { staff: any }) => ss.staff)

    // Get all CONFIRMED bookings for the service on this date
    const bookings = await prisma.booking.findMany({
      where: {
        serviceId,
        startTime: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: "CONFIRMED",
      },
    })

    // Get timeoffs for all staff on this date
    const timeOffs = await prisma.timeOff.findMany({
      where: {
        staffId: {
          in: staffList.map((s: { id: any }) => s.id)
        },
        startDate: {
          lte: endOfDay
        },
        endDate: {
          gte: startOfDay
        }
      }
    })

    const slots: string[] = []
    const slotDuration = service.duration

      const SLOT_INTERVAL = 15 // 15-minute intervals

    // Generate slots in 15-minute intervals
    for (let hour = openHour; hour < closeHour; hour++) {
      for (let min = hour === openHour ? openMin : 0; min < 60; min += SLOT_INTERVAL) {
        const slotStart = new Date(startOfDay)
        slotStart.setHours(hour, min, 0, 0)

        const slotEnd = new Date(slotStart)
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration)

        // Check if slot end time is past closing time
        if (slotEnd > new Date(startOfDay.getTime() + closeHour * 60 * 60 * 1000)) break

        // Check if at least one staff member is available for this slot
        const isSlotAvailable = staffList.some((staff: any) => {
          // Check if this staff has any conflicting bookings
          const hasBookingConflict = bookings.some((booking: any) => {
            return booking.staffId === staff.id && 
                   slotStart < booking.endTime && 
                   slotEnd > booking.startTime
          })

          // Check if this staff has timeoff on this date
          const hasTimeOff = timeOffs.some((timeOff: any) => {
            return timeOff.staffId === staff.id &&
                   slotStart < new Date(timeOff.endDate) &&
                   slotEnd > new Date(timeOff.startDate)
          })

          return !hasBookingConflict && !hasTimeOff
        })

        if (isSlotAvailable) {
          // Format as HH:MM string
          const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
          slots.push(timeStr)
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
  async getBusinessAvailableSlots(serviceId: string, businessId: string, date: Date, staffId?: string): Promise<string[]> {
    return this.getAvailableSlots(serviceId, businessId, date, staffId)
  }
}

export default new BookingService()
