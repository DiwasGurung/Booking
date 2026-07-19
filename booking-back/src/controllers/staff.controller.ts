import { Request, Response } from "express"
import staffService from "../services/staff.service"
import { CreateStaffSchema, StaffParamsSchema, BusinessIdParamsSchema, parseAndValidate } from "../validators"
import SubscriptionService from "../services/subscription.service"

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
