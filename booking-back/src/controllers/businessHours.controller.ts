import { Request, Response } from "express"
import BusinessHoursService from "../services/businessHours.service"

const NOT_FOUND_ERRORS = [
  "BRANCH_NOT_FOUND", "HOURS_NOT_FOUND", "TIME_OFF_NOT_FOUND",
  "CLOSED_DATE_NOT_FOUND", "STAFF_NOT_FOUND",
]

function sendError(res: Response, error: any, fallback: string) {
  if (NOT_FOUND_ERRORS.includes(error?.message)) {
    return res.status(404).json({ success: false, message: error.message })
  }
  console.error(`[BusinessHours] ${fallback}:`, error)
  return res.status(500).json({ success: false, message: fallback, error: error?.message })
}

class BusinessHoursController {
  /**
   * Set or update business hours for a day
   */
  async set(req: Request, res: Response) {
    try {
      const hours = await BusinessHoursService.setBusinessHours(req.body)
      res.status(201).json(hours)
    } catch (error) {
      res.status(500).json({ message: "Failed to set business hours", error })
    }
  }

  /**
   * Get all business hours
   */
  async getAll(req: Request, res: Response) {
    try {
     const { businessId } = req.params
const branchId = req.query.branchId as string | undefined
const hours = await BusinessHoursService.getBusinessHours(businessId as string, branchId)
      res.json(hours)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business hours", error })
    }
  }

  /**
   * Get hours for a specific day
   */
  async getByDay(req: Request, res: Response) {
    try {
      const { businessId, dayOfWeek } = req.params
const branchId = await BusinessHoursService.resolveBranchId(
  businessId as string,
  req.query.branchId as string | undefined,
)
const hours = await BusinessHoursService.getHoursForDay(branchId, Number(dayOfWeek))

      if (!hours) {
        return res.status(404).json({ message: "Business hours not found" })
      }

      res.json(hours)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business hours", error })
    }
  }

  /**
   * Update business hours by ID
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { businessId } = req.params
      const hours = await BusinessHoursService.updateBusinessHours(businessId as string, id as string, req.body)
      res.json(hours)
    } catch (error) {
      res.status(500).json({ message: "Failed to update business hours", error })
    }
  }

  /**
   * Delete business hours
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { businessId } = req.params
      const hours = await BusinessHoursService.deleteBusinessHours(businessId as string, id as string)
      res.json(hours)
    } catch (error) {
      res.status(500).json({ message: "Failed to delete business hours", error })
    }
  }

  /**
   * Check if business is open now
   */
  async isOpen(req: Request, res: Response) {
    try {
      const { businessId } = req.params
const branchId = await BusinessHoursService.resolveBranchId(
  businessId as string,
  req.query.branchId as string | undefined,
)
const open = await BusinessHoursService.isBusinessOpen(branchId)
      res.json({ isOpen: open })
    } catch (error) {
      res.status(500).json({ message: "Failed to check business status", error })
    }
  }
  /**
   * Add staff time off
   */
  async addTimeOff(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      const { staffId, branchId, startDate, endDate, reason, type } = req.body

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" })
      }

      const timeOff = await BusinessHoursService.addTimeOff({
        businessId: businessId as string,
        branchId,
        staffId,
        startDate,
        endDate,
        reason,
        type,
      })

      res.status(201).json({ success: true, data: timeOff })
    } catch (error: any) {
      console.error("[BusinessHours] Error adding time off:", error)
      res.status(500).json({ message: "Failed to add time off", error: error.message })
    }
  }

  /**
   * Get time off for a business or staff
   */
  async getTimeOffs(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      const { staffId } = req.query

      const timeOffs = await BusinessHoursService.getTimeOffs(
        businessId as string,
        staffId as string | undefined
      )

      res.json({ success: true, data: timeOffs })
    } catch (error: any) {
      console.error("[BusinessHours] Error fetching time offs:", error)
      res.status(500).json({ message: "Failed to fetch time offs", error: error.message })
    }
  }

  /**
   * Remove time off
   */
  async removeTimeOff(req: Request, res: Response) {
    try {
      const { businessId,timeOffId } = req.params
      const timeOff = await BusinessHoursService.removeTimeOff(businessId as string, timeOffId as string)

      res.json({ success: true, data: timeOff })
    } catch (error: any) {
      console.error("[BusinessHours] Error removing time off:", error)
      res.status(500).json({ message: "Failed to remove time off", error: error.message })
    }
  }

  /**
   * Get all closed dates for a business
   */
  async getClosedDates(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      const closedDates = await BusinessHoursService.getClosedDates(businessId as string, req.query.branchId as string | undefined)

      res.json({ success: true, data: closedDates })
    } catch (error: any) {
      console.error("[BusinessHours] Error fetching closed dates:", error)
      res.status(500).json({ message: "Failed to fetch closed dates", error: error.message })
    }
  }

  /**
   * Add a closed date
   */
  async addClosedDate(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      const { date, reason, branchId } = req.body


      if (!date) {
        return res.status(400).json({ message: "Date is required" })
      }

      const closedDate = await BusinessHoursService.addClosedDate(businessId as string, { date, reason, branchId })

      res.status(201).json({ success: true, data: closedDate })
    } catch (error: any) {
      console.error("[BusinessHours] Error adding closed date:", error)
      res.status(500).json({ message: "Failed to add closed date", error: error.message })
    }
  }

  /**
   * Remove a closed date
   */
  async removeClosedDate(req: Request, res: Response) {
    try {
      const { businessId, dateId } = req.params
      const closedDate = await BusinessHoursService.removeClosedDate(businessId as string, dateId as string)

      res.json({ success: true, data: closedDate })
    } catch (error: any) {
      console.error("[BusinessHours] Error removing closed date:", error)
      res.status(500).json({ message: "Failed to remove closed date", error: error.message })
    }
  }
}

export default new BusinessHoursController()
