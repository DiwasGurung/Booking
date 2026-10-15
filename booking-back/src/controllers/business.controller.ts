import { Request, Response } from "express"
import BusinessService from "../services/business.service"
import SubscriptionService from "../services/subscription.service"
import CustomerService from "../services/customer.service"
import { validateSlug } from '../utils/slug'

const branchIdFrom = (req: Request) =>
  typeof req.query.branchId === 'string' && req.query.branchId ? req.query.branchId : undefined

// Only these fields may be changed through the generic PUT /:id route
const UPDATABLE_FIELDS = [
  'name', 'description', 'email', 'phone', 'website', 'category',
  'address', 'city', 'state', 'zipCode', 'country', 'latitude', 'longitude',
] as const

class BusinessController {
  /** Setup basic business info (registration flow). Role change happens inside createBusiness. */
  async setupBasic(req: any, res: Response) {
    try {
      const userId = req.userId
      if (!userId) return res.status(401).json({ error: 'Not authenticated' })

      const business = await BusinessService.createBusiness({ ...req.body, userId })
      res.status(201).json(business)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message === "This user already has a business") return res.status(409).json({ error: message })
      if (message === "userId is required to create a business") return res.status(400).json({ error: message })
      console.error('[Business Setup] Error:', message)
      res.status(500).json({ error: "Failed to create business" })
    }
  }

  async getCurrentBusiness(req: any, res: Response) {
    try {
      const userId = req.userId
      if (!userId) return res.status(401).json({ message: "Not authenticated" })

      const business = await BusinessService.getBusinessByUserId(userId)
      if (!business) return res.status(404).json({ message: "No business found for this user" })
      res.json(business)
    } catch (error) {
      console.error('[Business] getCurrentBusiness error:', error)
      res.status(500).json({ message: "Failed to fetch current business" })
    }
  }

  /** Create business for the logged-in user (userId comes from the session, never the body). */
  async create(req: any, res: Response) {
    try {
      const userId = req.userId
      if (!userId) return res.status(401).json({ message: "Not authenticated" })

      // createBusiness already creates the Main branch in the same transaction
      const business = await BusinessService.createBusiness({ ...req.body, userId })
      res.status(201).json(business)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message === "This user already has a business") return res.status(409).json({ message })
      if (message === "userId is required to create a business") return res.status(400).json({ message })
      console.error('[Business] create error:', message)
      res.status(500).json({ message: "Failed to create business" })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const business = await BusinessService.getBusinessById(req.params.id as string)
      if (!business) return res.status(404).json({ message: "Business not found" })
      res.json(business)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business" })
    }
  }

  async customerInsights(req: Request, res: Response) {
    try {
      const businessId = req.params.businessId as string
      const subscription = await SubscriptionService.getSubscriptionStatus(businessId)
      if (!subscription.hasSubscription || !subscription.planName?.toLowerCase().includes('enterprise')) {
        return res.status(403).json({ error: 'Customer loyalty insights require an Enterprise subscription' })
      }
      const insights = await CustomerService.getBusinessInsights(businessId, branchIdFrom(req))
      return res.json({ insights })
    } catch (error) {
      console.error('[Business] customerInsights error:', error)
      return res.status(500).json({ error: 'Failed to load customer insights' })
    }
  }

  async checkSlug(req: any, res: Response) {
    try {
      const { businessId } = req.params
      const slug = String(req.query.slug || '').toLowerCase().trim()

      const invalid = validateSlug(slug)
      if (invalid) return res.json({ available: false, reason: invalid })

      const available = await BusinessService.isSlugAvailable(slug, businessId)
      res.json({ available, reason: available ? null : 'Already taken' })
    } catch (error) {
      console.error('[Business] checkSlug error:', error)
      res.status(500).json({ message: 'Failed to check slug' })
    }
  }

  async updateSlug(req: any, res: Response) {
    try {
      const { businessId } = req.params
      const slug = String(req.body.slug || '').toLowerCase().trim()

      const invalid = validateSlug(slug)
      if (invalid) return res.status(400).json({ message: invalid })

      const updated = await BusinessService.updateSlug(businessId, slug)
      res.json(updated)
    } catch (error: any) {
      if (error?.code === 'P2002') return res.status(409).json({ message: 'This slug is already taken' })
      console.error('[Business] updateSlug error:', error)
      res.status(500).json({ message: 'Failed to update slug' })
    }
  }

  async getByUserId(req: any, res: Response) {
    try {
      // A user may only look up their own business
      if (req.params.userId !== req.userId) return res.status(403).json({ message: "Forbidden" })

      const business = await BusinessService.getBusinessByUserId(req.params.userId as string)
      if (!business) return res.status(404).json({ message: "Business not found" })
      res.json(business)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business" })
    }
  }

  async update(req: Request, res: Response) {
    try {
      // Whitelist: never pass req.body straight to Prisma (it could set smsCredits, userId, isVerified...)
      const data: Record<string, unknown> = {}
      for (const key of UPDATABLE_FIELDS) {
        if (req.body[key] !== undefined) data[key] = req.body[key]
      }
      const business = await BusinessService.updateBusiness(req.params.id as string, data)
      res.json(business)
    } catch (error) {
      console.error('[Business] update error:', error)
      res.status(500).json({ message: "Failed to update business" })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const business = await BusinessService.deleteBusiness(req.params.id as string)
      res.json(business)
    } catch (error) {
      res.status(500).json({ message: "Failed to delete business" })
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1
      const limit = Math.min(Number(req.query.limit) || 10, 100)
      const category = req.query.category as string | undefined
      const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined

      res.json(await BusinessService.getAllBusinesses(page, limit, category, isActive))
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch businesses" })
    }
  }

  async stats(req: Request, res: Response) {
    try {
      const stats = await BusinessService.getBusinessStats(req.params.businessId as string, branchIdFrom(req))
      res.json(stats)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" })
    }
  }

  async analytics(req: Request, res: Response) {
    try {
      const days = Number(req.query.days) || 30
      const analytics = await BusinessService.getBusinessAnalytics(
        req.params.businessId as string, days, branchIdFrom(req)
      )
      res.json(analytics)
    } catch (error) {
      console.error('[Business] analytics error:', error)
      res.status(500).json({ message: 'Failed to fetch analytics' })
    }
  }

  async search(req: Request, res: Response) {
    try {
      const query = req.query.q as string
      const limit = Math.min(Number(req.query.limit) || 10, 50)
      if (!query) return res.status(400).json({ message: "Search query is required" })

      res.json(await BusinessService.searchBusinesses(query, limit))
    } catch (error) {
      res.status(500).json({ message: "Search failed" })
    }
  }

  async getSettings(req: Request, res: Response) {
    try {
      const settings = await BusinessService.getBusinessSettings(req.params.businessId as string)
      if (!settings) return res.status(404).json({ message: "Business settings not found" })
      res.json(settings)
    } catch (error) {
      console.error('[Business] getSettings error:', error)
      res.status(500).json({ message: "Failed to fetch settings" })
    }
  }

  async getPublicById(req: Request, res: Response) {
    try {
      const business = await BusinessService.getPublicBusinessById(req.params.id as string)
      if (!business || !business.isActive) return res.status(404).json({ message: "Business not found" })
      res.json(business)
    } catch (error) {
      console.error('[Business] getPublicById error:', error)
      res.status(500).json({ message: "Failed to fetch business" })
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      const settings = await BusinessService.updateBusinessSettings(req.params.businessId as string, req.body)
      res.json(settings)
    } catch (error) {
      console.error('[Business] updateSettings error:', error)
      const message = error instanceof Error ? error.message : String(error)
      res.status(500).json({ message: "Failed to update settings", error: message })
    }
  }
}

export default new BusinessController()