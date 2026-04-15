import { prisma } from '../lib/prisma'
import type { Subscription, Prisma, SubscriptionStatus } from '../../prisma/src/generated/prisma/client'

class SubscriptionService {
  /**
   * Create subscription with 1 month free trial
   */
  async createSubscriptionWithTrial(data: {
    businessId: string
    planId: string
  }): Promise<Subscription> {
    try {
      console.log(`[v0] Creating subscription with free trial for business: ${data.businessId}`)

      const now = new Date()
      const trialEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

      // Delete existing subscription if any
      await prisma.subscription.deleteMany({
        where: { businessId: data.businessId },
      })

      const subscription = await prisma.subscription.create({
        data: {
          businessId: data.businessId,
          planId: data.planId,
          status: 'TRIAL' as SubscriptionStatus,
          trialEndsAt,
          isTrialUsed: false,
          startDate: now,
          endDate: trialEndsAt,
          autoRenew: true,
        },
        include: {
          plan: true,
          business: true,
        },
      })

      console.log(`[v0] Subscription created with trial until: ${trialEndsAt}`)
      return subscription
    } catch (error) {
      console.error(`[v0] Failed to create subscription:`, error)
      throw error
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(id: string): Promise<Subscription | null> {
    try {
      return await prisma.subscription.findUnique({
        where: { id },
        include: {
          plan: true,
          business: true,
        },
      })
    } catch (error) {
      console.error(`[v0] Failed to get subscription by ID: ${id}`, error)
      throw error
    }
  }

  /**
   * Get business subscription
   */
  async getBusinessSubscription(businessId: string): Promise<Subscription | null> {
    try {
      return await prisma.subscription.findUnique({
        where: { businessId },
        include: {
          plan: true,
          business: true,
        },
      })
    } catch (error) {
      console.error(`[v0] Failed to get subscription for business: ${businessId}`, error)
      throw error
    }
  }

  /**
   * Check if subscription is valid (trial or active)
   */
  async isSubscriptionValid(businessId: string): Promise<boolean> {
    try {
      const subscription = await this.getBusinessSubscription(businessId)

      if (!subscription) {
        console.log(`[v0] No subscription found for business: ${businessId}`)
        return false
      }

      const now = new Date()

      // Trial is valid if not expired
      if (subscription.status === 'TRIAL') {
        if (subscription.trialEndsAt && subscription.trialEndsAt > now) {
          console.log(`[v0] Trial subscription is valid`)
          return true
        }
        console.log(`[v0] Trial subscription has expired`)
        return false
      }

      // Active subscription is valid if not expired
      if (subscription.status === 'ACTIVE') {
        if (subscription.endDate && subscription.endDate > now) {
          console.log(`[v0] Active subscription is valid`)
          return true
        }
        console.log(`[v0] Active subscription has expired`)
        return false
      }

      console.log(`[v0] Subscription status is: ${subscription.status}`)
      return false
    } catch (error) {
      console.error(`[v0] Failed to check subscription validity:`, error)
      return false
    }
  }

  /**
   * Get subscription status details
   */
  async getSubscriptionStatus(businessId: string) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { businessId },
        include: {
          plan: true,
          business: true,
        },
      })

      if (!subscription) {
        return {
          hasSubscription: false,
          status: null,
          daysRemaining: null,
          trialEndsAt: null,
          expiresAt: null,
        }
      }

      const now = new Date()
      let daysRemaining = 0
      let expiresAt = null

      if (subscription.status === 'TRIAL' && subscription.trialEndsAt) {
        daysRemaining = Math.ceil(
          (subscription.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        expiresAt = subscription.trialEndsAt
      } else if (subscription.status === 'ACTIVE' && subscription.endDate) {
        daysRemaining = Math.ceil(
          (subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        expiresAt = subscription.endDate
      }

      return {
        hasSubscription: true,
        status: subscription.status,
        planName: subscription.plan?.displayName,
        daysRemaining: Math.max(0, daysRemaining),
        trialEndsAt: subscription.trialEndsAt,
        expiresAt,
        autoRenew: subscription.autoRenew,
      }
    } catch (error) {
      console.error(`[v0] Failed to get subscription status:`, error)
      return null
    }
  }

  /**
   * Activate subscription after payment
   */
  async activateSubscription(subscriptionId: string, data: {
    paymentId: string
    durationDays?: number
  }): Promise<Subscription> {
    try {
      console.log(`[v0] Activating subscription: ${subscriptionId}`)

      const now = new Date()
      const durationDays = data.durationDays || 30
      const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

      const subscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'ACTIVE' as SubscriptionStatus,
          startDate: now,
          endDate,
          lastPaymentId: data.paymentId,
          isTrialUsed: true,
        },
        include: {
          plan: true,
          business: true,
        },
      })

      console.log(`[v0] Subscription activated until: ${endDate}`)
      return subscription
    } catch (error) {
      console.error(`[v0] Failed to activate subscription:`, error)
      throw error
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    subscriptionId: string,
    data: Prisma.SubscriptionUpdateInput
  ): Promise<Subscription> {
    try {
      return await prisma.subscription.update({
        where: { id: subscriptionId },
        data,
        include: {
          plan: true,
          business: true,
        },
      })
    } catch (error) {
      console.error(`[v0] Failed to update subscription:`, error)
      throw error
    }
  }

  /**
   * Check if trial has expired
   */
  async hasTrialExpired(businessId: string): Promise<boolean> {
    try {
      const subscription = await this.getBusinessSubscription(businessId)

      if (!subscription || subscription.status !== 'TRIAL') {
        return false
      }

      if (!subscription.trialEndsAt) {
        return true
      }

      const now = new Date()
      return subscription.trialEndsAt <= now
    } catch (error) {
      console.error(`[v0] Failed to check trial expiration:`, error)
      return false
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      console.log(`[v0] Cancelling subscription: ${subscriptionId}`)

      return await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CANCELLED' as SubscriptionStatus,
          autoRenew: false,
        },
        include: {
          plan: true,
          business: true,
        },
      })
    } catch (error) {
      console.error(`[v0] Failed to cancel subscription:`, error)
      throw error
    }
  }

  /**
   * Get all expired subscriptions
   */
  async getExpiredSubscriptions(): Promise<Subscription[]> {
    try {
      const now = new Date()

      return await prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            lte: now,
          },
        },
        include: {
          plan: true,
          business: true,
        },
      })
    } catch (error) {
      console.error(`[v0] Failed to get expired subscriptions:`, error)
      throw error
    }
  }

  /**
   * Get expiring soon subscriptions (within 7 days)
   */
  async getExpiringSoonSubscriptions(): Promise<Subscription[]> {
    try {
      const now = new Date()
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      return await prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
        include: {
          plan: true,
          business: true,
        },
      })
    } catch (error) {
      console.error(`[v0] Failed to get expiring soon subscriptions:`, error)
      throw error
    }
  }
}

export default new SubscriptionService()

