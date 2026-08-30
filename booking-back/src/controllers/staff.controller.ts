import { Request, Response } from "express"
import staffService from "../services/staff.service"
import { CreateStaffSchema, StaffParamsSchema, BusinessIdParamsSchema, parseAndValidate } from "../validators/index"
import SubscriptionService from "../services/subscription.service"
import  prisma  from "../lib/prisma"

interface AuthRequest extends Request {
  user?: { id: string }
  userId?: string
}

/**
 * Create a new staff member
 */
export const createStaff = async (req: AuthRequest, res: Response) => {
  try {
    const validation = parseAndValidate(CreateStaffSchema, req.body)
    if (!validation.success) {
      return res.status(400).json({ error: validation.error })
    }

    // Check subscription staff limit
    const staffLimit = await SubscriptionService.canAddStaff(validation.data.businessId)
    
    if (!staffLimit.allowed) {
      console.warn('[v0] Staff limit exceeded for business:', validation.data.businessId)
      return res.status(429).json({
        message: staffLimit.reason || 'Staff limit reached. Please upgrade your subscription.',
        error: 'STAFF_LIMIT_EXCEEDED',
        current: staffLimit.current,
        limit: staffLimit.limit,
         overLimit: true,
      })
    }

    const staff = await staffService.createStaff(validation.data)

    res.status(201).json({ success: true, staff })
  } catch (error: any) {
    console.error("[Staff Controller] Create error:", error.message)
    res.status(500).json({ error: "Failed to create staff member" })
  }
}

/**
 * Get staff by ID
 */
export const getStaffById = async (req: Request, res: Response) => {
  try {
    const validation = parseAndValidate(StaffParamsSchema, req.params)
    if (!validation.success) {
      return res.status(400).json({ error: validation.error })
    }

    const staff = await staffService.getStaffById(validation.data.staffId)
    if (!staff) {
      return res.status(404).json({ error: "Staff not found" })
    }

    res.json({ staff })
  } catch (error: any) {
    console.error("[Staff Controller] Get by ID error:", error.message)
    res.status(500).json({ error: "Failed to get staff member" })
  }
}

/**
 * Get all staff for a business
 */
export const getBusinessStaff = async (req: Request, res: Response) => {
  try {
    const validation = parseAndValidate(BusinessIdParamsSchema, req.params)
    if (!validation.success) {
      return res.status(400).json({ error: validation.error })
    }

    const includeInactive = req.query.includeInactive === "true"

    const staff = await staffService.getBusinessStaff(validation.data.businessId, includeInactive)
    res.json({ staff })
  } catch (error: any) {
    console.error("[Staff Controller] Get business staff error:", error.message)
    res.status(500).json({ error: "Failed to get staff members" })
  }
}

/**
 * Get staff who can perform a specific service
 */
export const getStaffForService = async (req: Request, res: Response) => {
  try {
    const serviceId = req.params.serviceId as string

    const staff = await staffService.getStaffForService(serviceId)
    res.json({ staff })
  } catch (error: any) {
    console.error("[Staff Controller] Get staff for service error:", error.message)
    res.status(500).json({ error: "Failed to get staff for service" })
  }
}
/**
 * Get staff performance for a selected period.
 * This reports bookings and served customers only; it does not use subscription payments.
 */
export const getStaffPerformance = async (req: Request, res: Response) => {
  try {
    const staffId = req.params.staffId as string
    const staffMember = await prisma.staff.findUnique({ where: { id: staffId }, select: { businessId: true } })
    if (!staffMember) return res.status(404).json({ error: 'Staff member not found' })
    const subscription = await SubscriptionService.getSubscriptionStatus(staffMember.businessId)
    const planName = String(subscription?.planName || '').trim().toLowerCase()
    const isEnterprise = planName.includes('enterprise')
    const hasAccess = isEnterprise && (subscription?.hasSubscription === true || subscription?.status === 'ACTIVE' || subscription?.status === 'CANCELLED')
    if (!hasAccess) {
      return res.status(403).json({ error: 'Staff performance analytics require an Enterprise subscription' })
    }
    const startDate = typeof req.query.startDate === 'string' ? new Date(req.query.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const endDate = typeof req.query.endDate === 'string' ? new Date(req.query.endDate) : new Date()
    const dateFilter = { gte: startDate, lte: endDate }

    const [totalBookings, servedCustomers, pendingBookings, unverifiedBookings, customers] = await Promise.all([
      prisma.booking.count({ where: { staffId, startTime: dateFilter } }),
      prisma.booking.count({ where: { staffId, status: 'COMPLETED', startTime: dateFilter } }),
      prisma.booking.count({ where: { staffId, status: 'PENDING', startTime: dateFilter } }),
      prisma.booking.count({ where: { staffId, isEmailVerified: false, startTime: dateFilter } }),
      prisma.booking.findMany({ where: { staffId, startTime: dateFilter }, distinct: ['customerEmail'], select: { customerEmail: true } }),
    ])

    res.json({
      totalBookings,
      servedCustomers,
      pendingBookings,
      unverifiedBookings,
      uniqueCustomers: customers.length,
      completionRate: totalBookings ? (servedCustomers / totalBookings) * 100 : 0,
      startDate,
      endDate,
    })
  } catch (error: any) {
    console.error('[Staff Controller] Performance error:', error.message)
    res.status(500).json({ error: 'Failed to load staff performance' })
  }
}


/**
 * Update staff member
 */
export const updateStaff = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const { firstName, lastName, email, phone, avatar, role, isActive, workingHours, breakTimes, serviceIds } = req.body

    const staff = await staffService.updateStaff(id, {
      firstName,
      lastName,
      email,
      phone,
      avatar,
      role,
      isActive,
      workingHours,
      breakTimes,
      serviceIds,
    })

    res.json({ success: true, staff })
  } catch (error: any) {
    console.error("[Staff Controller] Update error:", error.message)
    res.status(500).json({ error: "Failed to update staff member" })
  }
}

/**
 * Delete staff member
 */
export const deleteStaff = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string

    await staffService.deleteStaff(id)
    res.json({ success: true, message: "Staff member deleted" })
  } catch (error: any) {
    console.error("[Staff Controller] Delete error:", error.message)
    res.status(500).json({ error: "Failed to delete staff member" })
  }
}

/**
 * Toggle staff active status
 */
export const toggleStaffStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string

    const staff = await staffService.toggleStaffStatus(id)
    res.json({ success: true, staff })
  } catch (error: any) {
    console.error("[Staff Controller] Toggle status error:", error.message)
    res.status(500).json({ error: "Failed to toggle staff status" })
  }
}

/**
 * Get staff availability for a specific date
 */
export const getStaffAvailability = async (req: Request, res: Response) => {
  try {
    const staffId = req.params.staffId as string
    const { date, duration } = req.query

    if (!date || !duration) {
      return res.status(400).json({ error: "Date and duration are required" })
    }

    const slots = await staffService.getStaffAvailability(
      staffId,
      new Date(date as string),
      parseInt(duration as string, 10)
    )

    res.json({ slots })
  } catch (error: any) {
    console.error("[Staff Controller] Get availability error:", error.message)
    res.status(500).json({ error: "Failed to get staff availability" })
  }
}

/**
 * Get staff statistics
 */
export const getStaffStats = async (req: Request, res: Response) => {
  try {
    const staffId = req.params.staffId as string
    const { startDate, endDate } = req.query

    const stats = await staffService.getStaffStats(
      staffId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    )

    res.json({ stats })
  } catch (error: any) {
    console.error("[Staff Controller] Get stats error:", error.message)
    res.status(500).json({ error: "Failed to get staff statistics" })
  }
}

/**
 * Get staff by staffCode (public - for direct booking)
 */
export const getStaffByCode = async (req: Request, res: Response) => {
  try {
    const staffCode = req.params.staffCode as string

    if (!staffCode) {
      return res.status(400).json({ error: "Staff code is required" })
    }

    const staff = await staffService.getStaffByCode(staffCode)

    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" })
    }

    res.json(staff)
  } catch (error: any) {
    console.error("[Staff Controller] Get staff by code error:", error.message)
    res.status(500).json({ error: "Failed to get staff information" })
  }
}

/**
 * Get staff bookings by staffCode (public - for staff booking view)
 */
export const getStaffBookings = async (req: Request, res: Response) => {
  try {
    const staffCode = req.params.staffCode as string

    if (!staffCode) {
      return res.status(400).json({ error: "Staff code is required" })
    }

    const result = await staffService.getBookingsByStaffCodeUsingBooking(staffCode)

    if (!result) {
      return res.status(404).json({ error: "Staff member not found" })
    }

    res.json(result)
  } catch (error: any) {
    console.error("[Staff Controller] Get bookings error:", error.message)
    res.status(500).json({ error: "Failed to get bookings" })
  }
}

/**
 * Get bookings for authenticated staff member
 */
export const getStaffAuthenticatedBookings = async (req: any, res: Response) => {
  try {
    const staffId = req.params.staffId as string
    const requestingStaffId = req.staffId // From middleware

    // Security: Staff can only view their own bookings
    if (staffId !== requestingStaffId) {
      return res.status(403).json({ error: "Unauthorized: You can only view your own bookings" })
    }

    const bookings = await prisma.booking.findMany({
      where: {
        staffId,
        status: "CONFIRMED",
        startTime: {
          gte: new Date(),
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    })

    res.json(bookings)
  } catch (error: any) {
    console.error("[Staff Controller] Get authenticated bookings error:", error.message)
    res.status(500).json({ error: "Failed to get bookings" })
  }
}

export const getTimeOff = async (req: AuthRequest, res: Response) => {
  try {
    const staffId = req.params.staffId as string
    const month = req.query.month as string // Format: YYYY-MM

    if (!staffId) {
      return res.status(400).json({ error: "Staff ID is required" })
    }

    // Verify staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    })

    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" })
    }

    let whereClause: any = { staffId }

    // If month is provided, filter by month
    if (month) {
      const [year, monthNum] = month.split('-').map(Number)
      const monthStart = new Date(year, monthNum - 1, 1)
      const monthEnd = new Date(year, monthNum, 0, 23, 59, 59)
      
      // Find time-off records that overlap with the requested month
      whereClause.AND = [
        {
          startDate: {
            lte: monthEnd, // Time-off starts before or on the last day of month
          },
        },
        {
          endDate: {
            gte: monthStart, // Time-off ends on or after the first day of month
          },
        },
      ]
    }

    const timeOffs = await prisma.timeOff.findMany({
      where: whereClause,
      orderBy: { startDate: "asc" },
    })

    // Transform the response to include individual dates for compatibility with frontend
    const expandedTimeOffs = timeOffs.flatMap((timeOff) => {
      const dates = []
      const start = new Date(timeOff.startDate)
      const end = new Date(timeOff.endDate)
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push({
          ...timeOff,
          date: new Date(d).toISOString().split('T')[0], // Add individual date for frontend
        })
      }
      return dates
    })

    res.status(200).json(expandedTimeOffs)
  } catch (error: any) {
    console.error("[Staff Controller] Get time off error:", error.message)
    res.status(500).json({ error: "Failed to fetch time off" })
  }
}

 export const addTimeOff = async (req: AuthRequest, res: Response) => {
  try {
    const staffId = req.params.staffId as string
    const { startDate, endDate, type, reason } = req.body

    if (!staffId || !startDate || !endDate) {
      return res.status(400).json({ error: "Staff ID, start date, and end date are required" })
    }

    // Verify staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    })

    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" })
    }

    // Create time off records for each day in the range
    const start = new Date(startDate)
    const end = new Date(endDate)
    const timeOffs = []

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // Prisma TimeOffCreateManyInput expects businessId, startDate and endDate
      timeOffs.push({
        staffId,
        businessId: staff.businessId,
        startDate: new Date(d),
        endDate: new Date(d),
        type: type || "VACATION",
        reason: reason || null,
      })
    }

    // Use createMany for bulk insert
    const result = await prisma.timeOff.createMany({
      data: timeOffs,
      skipDuplicates: true,
    })

    res.status(201).json({
      success: true,
      message: `Time off added for ${result.count} day(s)`,
      count: result.count,
    })
  } catch (error: any) {
    console.error("[Staff Controller] Add time off error:", error.message)
    res.status(500).json({ error: "Failed to add time off" })
  }

  
}
/**
 * Get bookings for a staff member on a specific date
 */
export const getStaffBookingsByDate = async (req: Request, res: Response) => {
  try {
    const staffCode = req.params.staffCode as string
    const date = req.query.date as string // Format: YYYY-MM-DD

    if (!staffCode || !date) {
      return res.status(400).json({ error: "Staff code and date are required" })
    }

    // Verify staff exists
    const staff = await prisma.staff.findUnique({
      where: { staffCode },
    })

    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" })
    }

    // Parse the date
     // Parse the date string (format: YYYY-MM-DD)
    // Create dates treating the input as a local date, not UTC
    const [year, month, day] = date.split('-').map(Number)
    const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0)
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999)

    // Fetch bookings for this staff member on the specified date
    // Include both PENDING and CONFIRMED bookings to block time slots for guests
    const bookings = await prisma.booking.findMany({
      where: {
        staffId: staff.id,
        startTime: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: {
          in: ["PENDING", "CONFIRMED"], // Include both PENDING and CONFIRMED
        },
      },
      include: {
        service: true,
        customer: true,
      },
      orderBy: { startTime: "asc" },
    })

    res.status(200).json(bookings)
  } catch (error: any) {
    console.error("[Staff Controller] Get bookings by date error:", error.message)
    res.status(500).json({ error: "Failed to fetch bookings" })
  }
}