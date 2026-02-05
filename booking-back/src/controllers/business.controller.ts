import { Request, Response } from "express"
import BusinessService from "../services/business.service"

class BusinessController {
  /**
   * Create business
   */
  async create(req: Request, res: Response) {
    try {
      const business = await BusinessService.createBusiness(req.body)
      res.status(201).json(business)
    } catch (error) {
      res.status(500).json({ message: "Failed to create business", error })
    }
  }

  /**
   * Get business by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const business = await BusinessService.getBusinessById(id as string)

      if (!business) {
        return res.status(404).json({ message: "Business not found" })
      }

      res.json(business)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business", error })
    }
  }

  /**
   * Get business by user ID
   */
  async getByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params
      const business = await BusinessService.getBusinessByUserId(userId as string)

      if (!business) {
        return res.status(404).json({ message: "Business not found" })
      }

      res.json(business)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business", error })
    }
  }

  /**
   * Update business
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      const business = await BusinessService.updateBusiness(id as string, req.body)
      res.json(business)
    } catch (error) {
      res.status(500).json({ message: "Failed to update business", error })
    }
  }

  /**
   * Delete business
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      const business = await BusinessService.deleteBusiness(id as string)
      res.json(business)
    } catch (error) {
      res.status(500).json({ message: "Failed to delete business", error })
    }
  }

  /**
   * Get all businesses (pagination + filters)
   */
  async getAll(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 10
      const category = req.query.category as string | undefined
      const isActive =
        req.query.isActive !== undefined
          ? req.query.isActive === "true"
          : undefined

      const result = await BusinessService.getAllBusinesses(
        page,
        limit,
        category,
        isActive,
      )

      res.json(result)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch businesses", error })
    }
  }

  /**
   * Business statistics
   */
  async stats(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      const stats = await BusinessService.getBusinessStats(businessId as string)
      res.json(stats)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics", error })
    }
  }

  /**
   * Monthly revenue
   */
  async monthlyRevenue(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      const months = Number(req.query.months) || 6

      const data = await BusinessService.getMonthlyRevenue(businessId as string, months)
      res.json(data)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch revenue", error })
    }
  }

  /**
   * Search businesses
   */
  async search(req: Request, res: Response) {
    try {
      const query = req.query.q as string
      const limit = Number(req.query.limit) || 10

      if (!query) {
        return res.status(400).json({ message: "Search query is required" })
      }

      const businesses = await BusinessService.searchBusinesses(query, limit)
      res.json(businesses)
    } catch (error) {
      res.status(500).json({ message: "Search failed", error })
    }
  }
}

export default new BusinessController()
