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
  async getBusinessBookings(
  businessId: string,
  page = 1,
  limit = 10,
  status?: BookingStatus,
  staffId?: string,
  verified?: boolean,
  startDate?: Date,
  endDate?: Date
): Promise<{ bookings: Booking[]; total: number }> {
  const skip = (page - 1) * limit;

  const where: Prisma.BookingWhereInput = { businessId };
  if (status) where.status = status;
  if (staffId) where.staffId = staffId;
  if (verified !== undefined) where.isEmailVerified = verified;
  if (startDate || endDate) {
    where.startTime = { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) };
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      include: { service: true, customer: true, staff: true },
      orderBy: { startTime: "desc" },
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, total };
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

    
    // Business timezone: slots are generated as wall-clock times in this zone,
    // and stored bookings (absolute UTC instants) are converted to the same zone
    // before comparison. This avoids the server-local vs UTC mismatch that left
    // fully-booked slots looking free.
    const BUSINESS_TZ = process.env.BUSINESS_TIME_ZONE || 'Asia/Kathmandu'

    // Wall-clock date (YYYY-MM-DD) + minutes-since-midnight for a Date in the business zone.
    const toBusinessWallClock = (d: Date) => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: BUSINESS_TZ,
        hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }).formatToParts(d)
      const get = (t: string) => parts.find(p => p.type === t)?.value || '00'
      const hour = Number(get('hour')) % 24
      return {
        dateStr: `${get('year')}-${get('month')}-${get('day')}`,
        minutes: hour * 60 + Number(get('minute')),
      }
    }

    // The requested calendar date, reconstructed from the server-local Date the
    // controller built from the "YYYY-MM-DD" query string.
    const pad = (n: number) => String(n).padStart(2, '0')
    const requestedDateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

    // Widen the query window by a day on each side so no booking is dropped by
    // the timezone offset, then filter precisely by business-zone wall clock.
    const windowStart = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000)
    const windowEnd = new Date(endOfDay.getTime() + 24 * 60 * 60 * 1000)

    // Confirmed bookings for ANY service the staff are handling that day — a staff
    // booked for a different service is still busy.
    const rawBookings = await prisma.booking.findMany({
      where: {
        staffId: { in: staffList.map(s => s.id) },
        startTime: { gte: windowStart, lt: windowEnd },
        status: "CONFIRMED",
      },
      select: { staffId: true, startTime: true, endTime: true },
    })

    // Pre-compute each booking's busy minute range on the requested day.
    const busyRanges = rawBookings
      .map(b => {
        const start = toBusinessWallClock(b.startTime)
        const end = toBusinessWallClock(b.endTime)
        return { staffId: b.staffId, dateStr: start.dateStr, startMin: start.minutes, endMin: end.minutes }
      })
      .filter(b => b.dateStr === requestedDateStr)

    // Get timeoffs for all staff on this date
    const timeOffs = await prisma.timeOff.findMany({
      where: {
        staffId: { in: staffList.map(s => s.id) },
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay },
      },
    })

    const slots: string[] = []
    const slotDuration = service.duration
    const SLOT_INTERVAL = 15 // 15-minute intervals
    const closeMinutes = closeHour * 60 + closeMin

    // Generate slots in 15-minute intervals (business-local wall clock)
    for (let hour = openHour; hour < closeHour; hour++) {
      for (let min = hour === openHour ? openMin : 0; min < 60; min += SLOT_INTERVAL) {
        const slotStartMin = hour * 60 + min
        const slotEndMin = slotStartMin + slotDuration

        // Skip slots whose service would run past closing time
        if (slotEndMin > closeMinutes) continue

        // Slot is available if AT LEAST ONE staff has no conflicting booking/timeoff.
        const isSlotAvailable = staffList.some((staff: any) => {
          const hasBookingConflict = busyRanges.some(b =>
            b.staffId === staff.id && slotStartMin < b.endMin && slotEndMin > b.startMin
          )

          const slotStartDate = new Date(startOfDay)
          slotStartDate.setHours(hour, min, 0, 0)
          const slotEndDate = new Date(slotStartDate)
          slotEndDate.setMinutes(slotEndDate.getMinutes() + slotDuration)
          const hasTimeOff = timeOffs.some((timeOff: any) =>
            timeOff.staffId === staff.id &&
            slotStartDate < new Date(timeOff.endDate) &&
            slotEndDate > new Date(timeOff.startDate)
          )

          return !hasBookingConflict && !hasTimeOff
        })

        if (isSlotAvailable) {
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
