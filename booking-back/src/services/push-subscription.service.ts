import { prisma } from '../lib/prisma'

export class PushSubscriptionService {
  /**
   * Create or update a push subscription for a user
   */
  static async createOrUpdateSubscription(
    userId: string,
    subscription: {
      endpoint: string
      keys: {
        p256dh: string
        auth: string
      }
    }
  ) {
    try {
      const existing = await prisma.pushSubscription.findFirst({
        where: {
          userId,
          endpoint: subscription.endpoint,
        },
      })

      if (existing) {
        // Update existing subscription
        return await prisma.pushSubscription.update({
          where: { id: existing.id },
          data: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            isActive: true,
            updatedAt: new Date(),
          },
        })
      } else {
        // Create new subscription
        return await prisma.pushSubscription.create({
          data: {
            userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            isActive: true,
          },
        })
      }
    } catch (error) {
      console.error('[PushSubscription] Failed to save subscription:', error)
      throw error
    }
  }

  /**
   * Get all active push subscriptions for a user
   */
  static async getUserSubscriptions(userId: string) {
    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: {
          userId,
          isActive: true,
        },
      })

      // Convert back to subscription objects
      return subscriptions.map((sub) => ({
        id: sub.id,
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      }))
    } catch (error) {
      console.error('[PushSubscription] Failed to get subscriptions:', error)
      return []
    }
  }

  /**
   * Deactivate a push subscription
   */
  static async deactivateSubscription(subscriptionId: string) {
    try {
      return await prisma.pushSubscription.update({
        where: { id: subscriptionId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      })
    } catch (error) {
      console.error('[PushSubscription] Failed to deactivate subscription:', error)
    }
  }

  /**
   * Remove an invalid subscription
   */
  static async removeSubscription(subscriptionId: string) {
    try {
      return await prisma.pushSubscription.delete({
        where: { id: subscriptionId },
      })
    } catch (error) {
      console.error('[PushSubscription] Failed to remove subscription:', error)
    }
  }

  /**
   * Check if user has any active push subscriptions
   */
  static async hasActiveSubscriptions(userId: string): Promise<boolean> {
    try {
      const count = await prisma.pushSubscription.count({
        where: {
          userId,
          isActive: true,
        },
      })
      return count > 0
    } catch (error) {
      console.error('[PushSubscription] Failed to check subscriptions:', error)
      return false
    }
  }
}
