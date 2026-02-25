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

    if (!plan || !plan.active) {
      throw new Error("Invalid or inactive subscription plan")
    }

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(startDate.getDate() + plan.durationDays)

    const subscription = await prisma.subscription.upsert({
      where: { businessId },
      update: {
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        nextRenewalDate: endDate
      },
      create: {
        businessId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        nextRenewalDate: endDate,
        autoRenew: true
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
        status: SubscriptionStatus.CANCELLED,
        autoRenew: false
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

    if (
      subscription.endDate &&
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.endDate < new Date()
    ) {
      return prisma.subscription.update({
        where: { businessId },
        data: { status: SubscriptionStatus.EXPIRED }
      })
    }

    return subscription
  }

  /**
   * Start Trial (only once)
   */
  async startTrial(businessId: string, planId: string) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      throw new Error("Invalid subscription plan")
    }

    const trialDays = 7
    const startDate = new Date()
    const trialEndsAt = new Date()
    trialEndsAt.setDate(startDate.getDate() + trialDays)

    return prisma.subscription.upsert({
      where: { businessId },
      update: {
        status: SubscriptionStatus.TRIAL,
        startDate,
        trialEndsAt,
        endDate: trialEndsAt,
        isTrialUsed: true
      },
      create: {
        businessId,
        planId,
        status: SubscriptionStatus.TRIAL,
        startDate,
        trialEndsAt,
        endDate: trialEndsAt,
        isTrialUsed: true,
        autoRenew: false
      }
    })
  }
}

export default new SubscriptionService()