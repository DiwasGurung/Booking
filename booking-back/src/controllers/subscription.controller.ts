import { Request, Response } from 'express'
import subscriptionService from '../services/subscription.service'

class SubscriptionController {
  /**
   * Create subscription with free trial
   */
  async createWithTrial(req: Request, res: Response) {
    try {
      const { businessId, planId } = req.body

      if (!businessId || !planId) {
        return res.status(400).json({ message: 'businessId and planId are required' })
      }

      console.log(`[v0] Creating free trial subscription for business: ${businessId}`)

      const subscription = await subscriptionService.createSubscriptionWithTrial({
        businessId,
        planId,
      })

      res.json({
        message: 'Free trial subscription created successfully',
        subscription,
      })
    } catch (error: any) {
      console.error('[v0] Error creating subscription with trial:', error)
      res.status(500).json({ message: 'Failed to create subscription', error: error.message })
    }
  }

  /**
   * Get subscription status for a business
   */
  async getStatus(req: Request, res: Response) {
    try {
      const { businessId } = req.params

      if (!businessId || Array.isArray(businessId)) {
        return res.status(400).json({ message: 'businessId is required' })
      }

      console.log(`[v0] Fetching subscription status for business: ${businessId}`)

      const status = await subscriptionService.getSubscriptionStatus(businessId)

      res.json(status)
    } catch (error: any) {
      console.error('[v0] Error fetching subscription status:', error)
      res.status(500).json({ message: 'Failed to get subscription status', error: error.message })
    }
  }

  /**
   * Check if subscription is valid
   */
  async checkValidity(req: Request, res: Response) {
    try {
      const { businessId } = req.params

      if (!businessId || Array.isArray(businessId)) {
        return res.status(400).json({ message: 'businessId is required' })
      }

      console.log(`[v0] Checking subscription validity for business: ${businessId}`)

      const isValid = await subscriptionService.isSubscriptionValid(businessId)

      res.json({
        businessId,
        isValid,
      })
    } catch (error: any) {
      console.error('[v0] Error checking subscription validity:', error)
      res.status(500).json({ message: 'Failed to check subscription validity', error: error.message })
    }
  }

  /**
   * Activate subscription after payment
   */
  async activate(req: Request, res: Response) {
    try {
      const { subscriptionId } = req.params
      const { paymentId, durationDays } = req.body

      if (!subscriptionId || Array.isArray(subscriptionId) || !paymentId) {
        return res.status(400).json({ message: 'subscriptionId and paymentId are required' })
      }

      console.log(`[v0] Activating subscription: ${subscriptionId}`)

      const subscription = await subscriptionService.activateSubscription(subscriptionId, {
        paymentId,
        durationDays,
      })

      res.json({
        message: 'Subscription activated successfully',
        subscription,
      })
    } catch (error: any) {
      console.error('[v0] Error activating subscription:', error)
      res.status(500).json({ message: 'Failed to activate subscription', error: error.message })
    }
  }

  /**
   * Check if trial has expired
   */
  async checkTrialExpiration(req: Request, res: Response) {
    try {
      const { businessId } = req.params

      if (!businessId || Array.isArray(businessId)) {
        return res.status(400).json({ message: 'businessId is required' })
      }

      console.log(`[v0] Checking trial expiration for business: ${businessId}`)

      const expired = await subscriptionService.hasTrialExpired(businessId)

      res.json({
        businessId,
        trialExpired: expired,
      })
    } catch (error: any) {
      console.error('[v0] Error checking trial expiration:', error)
      res.status(500).json({ message: 'Failed to check trial expiration', error: error.message })
    }
  }

  /**
   * Cancel subscription
   */
  async cancel(req: Request, res: Response) {
    try {
      const { subscriptionId } = req.params

      if (!subscriptionId || Array.isArray(subscriptionId)) {
        return res.status(400).json({ message: 'subscriptionId is required' })
      }

      console.log(`[v0] Cancelling subscription: ${subscriptionId}`)

      const subscription = await subscriptionService.cancelSubscription(subscriptionId)

      res.json({
        message: 'Subscription cancelled successfully',
        subscription,
      })
    } catch (error: any) {
      console.error('[v0] Error cancelling subscription:', error)
      res.status(500).json({ message: 'Failed to cancel subscription', error: error.message })
    }
  }

  /**
   * Get all expired subscriptions (for admin)
   */
  async getExpired(req: Request, res: Response) {
    try {
      console.log('[v0] Fetching expired subscriptions')

      const subscriptions = await subscriptionService.getExpiredSubscriptions()

      res.json({
        count: subscriptions.length,
        subscriptions,
      })
    } catch (error: any) {
      console.error('[v0] Error fetching expired subscriptions:', error)
      res.status(500).json({ message: 'Failed to fetch expired subscriptions', error: error.message })
    }
  }

  /**
   * Get subscriptions expiring soon (for admin)
   */
  async getExpiringSoon(req: Request, res: Response) {
    try {
      console.log('[v0] Fetching subscriptions expiring soon')

      const subscriptions = await subscriptionService.getExpiringSoonSubscriptions()

      res.json({
        count: subscriptions.length,
        subscriptions,
      })
    } catch (error: any) {
      console.error('[v0] Error fetching expiring soon subscriptions:', error)
      res
        .status(500)
        .json({ message: 'Failed to fetch expiring soon subscriptions', error: error.message })
    }
  }
}

export default new SubscriptionController()

