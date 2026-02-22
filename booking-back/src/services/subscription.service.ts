import { prisma } from "../lib/prisma"
import { SubscriptionStatus } from "../../prisma/src/generated/prisma/client"

export class SubscriptionService {

  /**
   * Create or Upgrade Subscription
   */
  async createSubscription(businessId: string, planId: string) {

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      throw new Error("Invalid subscription plan")
    }

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(startDate.getDate() + plan.durationInDays)

    // Upsert (create or update existing)
    const subscription = await prisma.subscription.upsert({
      where: { businessId },
      update: {
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate
      },
      create: {
        businessId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate
      }
    })

    return subscription
  }

  /**
   * Get Subscription by Business
   */
  async getBusinessSubscription(businessId: string) {
    return prisma.subscription.findUnique({
      where: { businessId },
      include: { plan: true }
    })
  }

  /**
   * Cancel Subscription
   */
  async cancelSubscription(businessId: string) {
    return prisma.subscription.update({
      where: { businessId },
      data: {
        status: SubscriptionStatus.CANCELLED
      }
    })
  }

  /**
   * Validate Subscription (Auto-expire check)
   */
  async validateSubscription(businessId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { businessId }
    })

    if (!subscription) return null

    if (subscription.endDate < new Date()) {
      return prisma.subscription.update({
        where: { businessId },
        data: { status: SubscriptionStatus.EXPIRED }
      })
    }

    return subscription
  }
}

export default new SubscriptionService()
