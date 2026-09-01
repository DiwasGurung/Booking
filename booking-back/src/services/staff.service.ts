import  prisma  from "../lib/prisma"
import { staffVerificationService } from "./staff-verification.service"
import  SubscriptionService  from "./subscription.service"

export interface WorkingHours {
  [day: string]: {
    start: string
    end: string
    isWorking: boolean
  }
}

export interface BreakTime {
  start: string
  end: string
}

export interface CreateStaffData {
  businessId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  avatar?: string
  role?: string
  workingHours?: WorkingHours
  breakTimes?: BreakTime[]
  serviceIds?: string[]
}

export interface UpdateStaffData {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  avatar?: string
  role?: string
  isActive?: boolean
  workingHours?: WorkingHours
  breakTimes?: BreakTime[]
  serviceIds?: string[]
}

export class StaffService {
  /**
   * Create a new staff member
   */
  async createStaff(data: CreateStaffData) {
    const { serviceIds, ...staffData } = data

    const staff = await prisma.staff.create({
      data: {
        ...(staffData as any),
        workingHours: staffData.workingHours as any,
        breakTimes: staffData.breakTimes as any,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    })

    // Connect services if provided
    if (serviceIds && serviceIds.length > 0) {
      await prisma.staffService.createMany({
        data: serviceIds.map((serviceId) => ({
          staffId: staff.id,
          serviceId,
        })),
      })

      // Fetch updated staff with services
      const updatedStaff = await this.getStaffById(staff.id)
      
      // Send verification email asynchronously (don't wait)
      if (updatedStaff) {
        try {
       
          staffVerificationService.sendVerificationEmail(
            updatedStaff.id,
            updatedStaff.email,
            updatedStaff.firstName,
            updatedStaff.businessId
          ).catch(err => console.error('[v0] Failed to send verification email:', err))
        } catch (error) {
          console.error('[v0] Error importing verification service:', error)
        }
      }
      
      return updatedStaff
    }

    // Send verification email asynchronously (don't wait)
    try {
  
      staffVerificationService.sendVerificationEmail(
        staff.id,
        staff.email,
        staff.firstName,
        staff.businessId
      ).catch(err => console.error('[v0] Failed to send verification email:', err))
    } catch (error) {
      console.error('[v0] Error importing verification service:', error)
    }

    return staff
  }

  /**
   * Get staff by ID
   */
  async getStaffById(id: string) {
    return prisma.staff.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        bookings: {
          where: {
            status: { in: ["PENDING", "CONFIRMED"] },
            startTime: { gte: new Date() },
          },
          orderBy: { startTime: "asc" },
          take: 10,
        },
      },
    })
  }

  /**
   * Get all staff for a business
   */
  async getBusinessStaff(businessId: string, includeInactive = false) {
    return prisma.staff.findMany({
      where: {
        businessId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * Get staff who can perform a specific service
   */
  async getStaffForService(serviceId: string) {
    const staffServices = await prisma.staffService.findMany({
      where: { serviceId },
      include: {
        staff: {
          include: {
            services: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    })

    return staffServices
      .map((ss) => ss.staff)
      .filter((staff) => staff.isActive)
  }

  /**
   * Update staff member
   */
  async updateStaff(id: string, data: UpdateStaffData) {
    const { serviceIds, ...staffData } = data

    // Update staff basic info
    await prisma.staff.update({
      where: { id },
      data: {
        ...staffData,
        workingHours: staffData.workingHours as any,
        breakTimes: staffData.breakTimes as any,
      },
    })

    // Update services if provided
    if (serviceIds !== undefined) {
      // Remove existing service connections
      await prisma.staffService.deleteMany({
        where: { staffId: id },
      })

      // Add new service connections
      if (serviceIds.length > 0) {
        await prisma.staffService.createMany({
          data: serviceIds.map((serviceId) => ({
            staffId: id,
            serviceId,
          })),
        })
      }
    }

    return this.getStaffById(id)
  }

  /**
   * Delete staff member
   */
  async deleteStaff(id: string) {
    return prisma.staff.delete({
      where: { id },
    })
  }

  /**
   * Toggle staff active status
   */
  async toggleStaffStatus(id: string) {
    const staff = await prisma.staff.findUnique({ where: { id } })
    if (!staff) throw new Error("Staff not found")

       // Reactivating staff must respect the current plan after a downgrade.
    if (!staff.isActive) {
   
      const limit = await SubscriptionService.canAddStaff(staff.businessId)
      if (!limit.allowed) {
        const error = new Error(limit.reason || 'Staff limit reached. Upgrade your plan to reactivate this staff member.')
        ;(error as Error & { code?: string }).code = 'STAFF_LIMIT_EXCEEDED'
        throw error
      }
    }

    return prisma.staff.update({
      where: { id },
      data: { isActive: !staff.isActive },
    })
  }

  /**
   * Get available time slots for a staff member on a specific date
   */
  async getStaffAvailability(staffId: string, date: Date, serviceDuration: number) {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { business: true },
    })

    if (!staff) throw new Error("Staff not found")

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const dayName = days[date.getDay()]

    // Parse working hours
    const workingHours = staff.workingHours as WorkingHours | null
    if (!workingHours || !workingHours[dayName]?.isWorking) {
      return [] // Staff not working this day
    }

    const dayHours = workingHours[dayName]
    const [startHour, startMin] = (dayHours.start as string).split(":").map(Number)
    const [endHour, endMin] = (dayHours.end as string).split(":").map(Number)

    // Get existing bookings for this staff on this date
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const existingBookings = await prisma.booking.findMany({
      where: {
        staffId,
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      orderBy: { startTime: "asc" },
    })

    // Parse break times
    const breakTimes = (staff.breakTimes as BreakTime[] | null) || []

    // Generate available slots
    const slots: { start: Date; end: Date }[] = []
    const slotDuration = serviceDuration // in minutes

    for (let hour = startHour; hour < endHour || (hour === endHour && 0 < endMin); hour++) {
      for (let min = hour === startHour ? startMin : 0; min < 60; min += slotDuration) {
        if (hour === endHour && min >= endMin) break

        const slotStart = new Date(date)
        slotStart.setHours(hour, min, 0, 0)

        const slotEnd = new Date(slotStart)
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration)

        // Check if slot exceeds working hours
        if (slotEnd.getHours() > endHour || (slotEnd.getHours() === endHour && slotEnd.getMinutes() > endMin)) {
          continue
        }

        // Check if slot overlaps with break time
        const isBreak = breakTimes.some((bt) => {
          const [bStartH, bStartM] = (bt.start as string).split(":").map(Number)
          const [bEndH, bEndM] = (bt.end as string).split(":").map(Number)
          const breakStart = new Date(date)
          breakStart.setHours(bStartH, bStartM, 0, 0)
          const breakEnd = new Date(date)
          breakEnd.setHours(bEndH, bEndM, 0, 0)
          return slotStart < breakEnd && slotEnd > breakStart
        })

        if (isBreak) continue

        // Check if slot overlaps with existing booking
        const isBooked = existingBookings.some((booking) => {
          return slotStart < booking.endTime && slotEnd > booking.startTime
        })

        if (isBooked) continue

        // Check if slot is in the past
        if (slotStart < new Date()) continue

        slots.push({ start: slotStart, end: slotEnd })
      }
    }

    return slots
  }

  /**
   * Get staff statistics
   */
  async getStaffStats(staffId: string, startDate?: Date, endDate?: Date) {
    const where: any = { staffId }

    if (startDate && endDate) {
      where.startTime = { gte: startDate, lte: endDate }
    }

    const [totalBookings, completedBookings, cancelledBookings, revenue] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.count({ where: { ...where, status: "COMPLETED" } }),
      prisma.booking.count({ where: { ...where, status: "CANCELLED" } }),
      prisma.booking.findMany({
        where: { ...where, status: "COMPLETED" },
        include: { service: true },
      }),
    ])

    const totalRevenue = revenue.reduce((sum, booking) => {
      return sum + (booking.service.offerPrice || booking.service.price)
    }, 0)

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
    }
  }

  /**
   * Get staff info by staffCode (public)
   */
  async getStaffByCode(staffCode: string) {
    const staff = await prisma.staff.findUnique({
      where: { staffCode },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        business:true
      },
    })

    if (!staff) return null

    // Return only public information
    return {
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      phone: staff.phone,
      avatar: staff.avatar,
      staffCode: staff.staffCode,
      isActive: staff.isActive,
      businessId: staff.business.id,
      businessName: staff.business.name,
      services: staff.services.map(ss => ({
       id: ss.id,
        staffId: ss.staffId,
        serviceId: ss.serviceId,
        service: {
          id: ss.service.id,
          name: ss.service.name,
          duration: ss.service.duration,
          price: ss.service.price,
          description: ss.service.description,
        },
      })),
    }
  }

  /**
   * Get staff bookings by staffCode (public)
   */
 async getBookingsByStaffCodeUsingBooking(staffCode: string) {
  // Find the staff by staffCode to get staffId
  const staff = await prisma.staff.findUnique({
    where: { staffCode },
    select: { id: true },
  })

  if (!staff) return null

  // Fetch bookings directly from Booking model
  const bookings = await prisma.booking.findMany({
    where: {
      staffId: staff.id,
      status: { in: ['CANCELLED', 'CONFIRMED', 'COMPLETED'] }, // include all relevant statuses
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
      startTime: 'asc',
    },
  })

  // Return formatted data
  return {
    staffName: '', // optional, can be fetched if needed
    staffCode,
    bookings: bookings.map((booking) => ({
      id: booking.id,
      customer: {
        id: booking.customer?.id || '',
        name: booking.customer?.name || '',
        email: booking.customer?.email || '',
        phone: booking.customer?.phone || '',
      },
      service: {
        id: booking.service.id,
        name: booking.service.name,
        duration: booking.service.duration,
        price: booking.service.price,
      },
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      notes: booking.notes,
    })),
  }
}

  // Inside your StaffService class
async getBookingsByStaffCodeAndDate(staffCode: string, date: Date) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const staff = await prisma.staff.findUnique({
    where: { staffCode },
    include: {
      bookings: {
        where: {
          status: 'CONFIRMED',
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
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
          startTime: 'asc',
        },
      },
    },
  })

  if (!staff) return null

  return {
    staffName: `${staff.firstName} ${staff.lastName}`,
    staffCode: staff.staffCode,
    bookings: staff.bookings.map(booking => ({
      id: booking.id,
      customer: booking.customer,
      service: booking.service,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      notes: booking.notes,
    })),
  }
}
}

export default new StaffService()
