import { Request, Response } from "express"
import SubscriptionService from "../services/subscription.service"

class SubscriptionController {

  async create(req: Request, res: Response) {
    try {
      const { businessId, planId } = req.body

      if (!businessId || !planId) {
        return res.status(400).json({ message: "businessId and planId are required" })
      }

      const subscription = await SubscriptionService.createSubscription(
        businessId,
        planId
      )

      res.status(201).json(subscription)
    } catch (error) {
      res.status(500).json({ message: "Failed to create subscription", error })
    }
  }

    async getByBusiness(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      
      // Ensure businessId is a string, not an array
      const id = Array.isArray(businessId) ? businessId[0] : businessId

      const subscription =
        await SubscriptionService.getBusinessSubscription(id)

      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" })
      }

      res.json(subscription)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription", error })
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      
      // Ensure businessId is a string, not an array
      const id = Array.isArray(businessId) ? businessId[0] : businessId

      const subscription =
        await SubscriptionService.cancelSubscription(id)

      res.json(subscription)
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel subscription", error })
    }
  }

  async validate(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      
      // Ensure businessId is a string, not an array
      const id = Array.isArray(businessId) ? businessId[0] : businessId

      const subscription =
        await SubscriptionService.validateSubscription(id)

      res.json(subscription)
    } catch (error) {
      res.status(500).json({ message: "Validation failed", error })
    }
  }
}

export default new SubscriptionController()
