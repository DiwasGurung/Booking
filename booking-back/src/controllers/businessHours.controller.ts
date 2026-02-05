import { Request, Response } from "express"
import BusinessHoursService from "../services/businessHours.service"

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
      const hours = await BusinessHoursService.getBusinessHours(businessId as string)
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
      const hours = await BusinessHoursService.getHoursForDay(
        businessId as string,
        Number(dayOfWeek),
      )

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
      const hours = await BusinessHoursService.updateBusinessHours(id as string, req.body)
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
      const hours = await BusinessHoursService.deleteBusinessHours(id as string)
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
      const open = await BusinessHoursService.isBusinessOpen(businessId as string)
      res.json({ isOpen: open })
    } catch (error) {
      res.status(500).json({ message: "Failed to check business status", error })
    }
  }
}

export default new BusinessHoursController()
