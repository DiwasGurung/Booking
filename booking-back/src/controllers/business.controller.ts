import { Request, Response } from "express"
import BusinessService from "../services/business.service.js"
import  {userService}  from "../services/user.service.js"
import SubscriptionService from "../services/subscription.service.js"
import CustomerService from "../services/customer.service.js"


class BusinessController {

  constructor() {
  }

  /**
   * Setup basic business info (for registration flow)
   */
  async setupBasic(req: any, res: Response) {
    try {
      const userId = req.userId
      
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      
      const business = await BusinessService.createBusiness({
        ...req.body,
        userId
      })
      await userService.updateUserRole(userId, 'BUSINESS_OWNER')
      
      
      res.status(201).json(business)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage === "This user already has a business") {
        return res.status(409).json({ error: errorMessage })
      }
      if (errorMessage === "userId is required to create a business") {
        return res.status(400).json({ error: errorMessage })
      }
      console.error('[Business Setup] Error:', errorMessage)
      res.status(500).json({ error: "Failed to create business" })
    }
  }
  async getCurrentBusiness(req: any, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" })
      }


      const business = await BusinessService.getBusinessByUserId(userId)

      if (!business) {
        return res.status(404).json({ message: "No business found for this user" })
      }

      res.json(business)
    } catch (error) {
      console.error('[v0] Error getting current business:', error)
      res.status(500).json({ message: "Failed to fetch current business", error })
    }
  }

  /**
   * Create business
   */
async create(req: Request, res: Response) {
  try {
    const business = await BusinessService.createBusiness(req.body)
    res.status(201).json(business)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage === "This user already has a business") {
      return res.status(409).json({ message: errorMessage })
    }
    if (errorMessage === "userId is required to create a business") {
      return res.status(400).json({ message: errorMessage })
    }
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
   async customerInsights(req: Request, res: Response) {
    try {
      const businessId = req.params.businessId as string
      const subscription = await SubscriptionService.getSubscriptionStatus(businessId)
      if (!subscription.hasSubscription || !subscription.planName?.toLowerCase().includes('enterprise')) {
        return res.status(403).json({ error: 'Customer loyalty insights require an Enterprise subscription' })
      }
      return res.json({ insights: await CustomerService.getBusinessInsights(businessId) })
    } catch (error) {
      return res.status(500).json({ error: 'Failed to load customer insights' })
    }
  }


  /**
   * Booking and customer analytics
   */
  async analytics(req: Request, res: Response) {
    try {
      const days = Number(req.query.days) || 30
      const analytics = await BusinessService.getBusinessAnalytics(req.params.businessId as string, days)
      res.json(analytics)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch analytics', error })
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
  /**
   * Get business settings
   */
  async getSettings(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      const settings = await BusinessService.getBusinessSettings(businessId as string)
      
      if (!settings) {
        return res.status(404).json({ message: "Business settings not found" })
      }
      
      res.json(settings)
    } catch (error) {
      console.error('[v0] getSettings error:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      res.status(500).json({ message: "Failed to fetch settings", error: errorMessage })
    }
  }

  /**
   * Update business settings
   */
  async updateSettings(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      const settings = await BusinessService.updateBusinessSettings(
        businessId as string,
        req.body
      )
      res.json(settings)
    } catch (error) {
      console.error('[v0] updateSettings error:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      res.status(500).json({ message: "Failed to update settings", error: errorMessage })
    }
  }
}

export default new BusinessController()
