import  prisma  from '../lib/prisma'
import type { Subscription, Prisma, SubscriptionStatus, SubscriptionPlan, Business } from '@prisma/client'

// Type definitions for service methods
type SubscriptionWithRelations = Subscription & {
  plan: SubscriptionPlan
  business: Business
}

type AppointmentLimitResult = {
  allowed: boolean
  reason?: string
  current?: number
  limit?: number
  
}

type StaffLimitResult = {
  allowed: boolean
  reason?: string
  current?: number
  limit?: number
}

type ServiceLimitResult = {
  allowed: boolean
  reason?: string
  current?: number
  limit?: number
  
}

type SubscriptionStatusResult = {
  id?: string
  hasSubscription: boolean
  status: SubscriptionStatus | null
  planName?: string
  planPrice?: number
  currency?: string
  maxStaff?: number
  maxAppointmentsPerMonth?: number
  maxServices?: number
  maxCustomers?: number
  daysRemaining: number | null
  trialEndsAt: Date | null
  expiresAt: Date | null
  startDate?: Date | null
  autoRenew?: boolean
  isTrialUsed:boolean
}

type UsageDetailsResult = {
  planName: string
  currentUsage: {
    appointmentsThisMonth: number
    staff: number
    services: number
  }
  limits: {
    appointmentsPerMonth: number | string
    maxStaff: number | string
    maxServices: number | string
  }
  featuresEnabled: {
  emailNotifications: boolean
  onlineBooking: boolean
  reports: boolean
  customBranding: boolean
  prioritySupport: boolean
  }
  overLimit: {
  staff: boolean
  services: boolean
  appointments: boolean
  any: boolean
  }
} | null

class SubscriptionService {
  /**
   * Create subscription with 1 month free trial
   */
  async createSubscriptionWithTrial(data: {
    businessId: string
    planId: string
  }): Promise<SubscriptionWithRelations> {
    try {
      console.log(`[v0] Creating subscription with free trial for business: ${data.businessId}, planId: ${data.planId}`)

      const now = new Date()
      const trialEndsAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) // 15 days trial
      const trialDays = Math.floor((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: data.planId },
      })

      if (!plan) {
        throw new Error(`Subscription plan not found: ${data.planId}`)
      }
       const existingSubscription = await prisma.subscription.findUnique({
        where: { businessId: data.businessId },
        select: { isTrialUsed: true },
      })
      if (existingSubscription?.isTrialUsed) {
        throw new Error('Your free trial has already been used. Please choose a paid plan.')
      }


      await prisma.subscription.deleteMany({
        where: { businessId: data.businessId },
      })

      const subscription = await prisma.subscription.create({
        data: {
          businessId: data.businessId,
          planId: data.planId,
          status: 'TRIAL' as SubscriptionStatus,
          trialEndsAt,
          isTrialUsed: true,
          startDate: now,
          endDate: trialEndsAt,
          autoRenew: true,
        },
        include: {
          plan: true,
          business: true,
        },
      })

      const actualTrialDays = Math.floor((subscription.endDate!.getTime() - subscription.startDate!.getTime()) / (1000 * 60 * 60 * 24))
      console.log(`[v0] Subscription created - Trial: ${actualTrialDays} days, ends: ${subscription.endDate}, trialEndsAt: ${subscription.trialEndsAt}`)
      return subscription as SubscriptionWithRelations
    } catch (error) {
      console.error(`[v0] Failed to create subscription:`, error)
      throw error
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(id: string): Promise<SubscriptionWithRelations | null> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: {
          plan: true,
          business: true,
        },
      })
      return subscription as SubscriptionWithRelations | null
    } catch (error) {
      console.error(`[v0] Failed to get subscription by ID: ${id}`, error)
      throw error
    }
  }

  /**
   * Get business subscription
   */
  async getBusinessSubscription(businessId: string): Promise<SubscriptionWithRelations | null> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { businessId },
        include: {
          plan: true,
          business: true,
        },
      })
      return subscription as SubscriptionWithRelations | null
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

      if (subscription.status === 'TRIAL') {
        if (subscription.trialEndsAt && subscription.trialEndsAt > now) {
          console.log(`[v0] Trial subscription is valid`)
          return true
        }
        console.log(`[v0] Trial subscription has expired`)
        return false
      }

       if (subscription.status === 'ACTIVE' || subscription.status === 'CANCELLED') {
        if (subscription.endDate && subscription.endDate > now) {
          console.log(`[v0] ${subscription.status} subscription is still valid until ${subscription.endDate}`)
          return true
        }
        console.log(`[v0] ${subscription.status} subscription has expired`)
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
  async getSubscriptionStatus(businessId: string): Promise<SubscriptionStatusResult> {
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
          isTrialUsed: false,
        }
      }

      const now = new Date()
      let daysRemaining = 0
      let expiresAt: Date | null = null
      let hasValidSubscription = true

      if (subscription.status === 'TRIAL' && subscription.trialEndsAt) {
        daysRemaining = Math.ceil(
          (subscription.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        expiresAt = subscription.trialEndsAt
        
        // If trial has expired, subscription is no longer valid
        if (daysRemaining <= 0) {
          console.log(`[v0] Trial expired for business ${businessId}`)
          hasValidSubscription = false
        }
      } else if ((subscription.status === 'ACTIVE' || subscription.status === 'CANCELLED') && subscription.endDate) {
        daysRemaining = Math.ceil(
          (subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        expiresAt = subscription.endDate
        
        // If CANCELLED and already expired, subscription is no longer valid
        if (subscription.status === 'CANCELLED' && daysRemaining <= 0) {
          console.log(`[v0] Cancelled subscription expired for business ${businessId}`)
          hasValidSubscription = false
        }
        
        // If ACTIVE but somehow expired, subscription is no longer valid
        if (subscription.status === 'ACTIVE' && daysRemaining <= 0) {
          console.log(`[v0] Active subscription expired for business ${businessId}`)
          hasValidSubscription = false
        }
      }

      return {
        id: subscription.id,
        hasSubscription: hasValidSubscription,
        status: subscription.status,
        planName: subscription.plan.displayName,
        planPrice: subscription.plan.priceMonthlyNPR,
        currency: subscription.plan.currency,
        maxStaff: subscription.plan.maxStaff,
        maxAppointmentsPerMonth: subscription.plan.maxAppointmentsPerMonth,
        maxServices: subscription.plan.maxServices,
        maxCustomers: subscription.plan.maxCustomers,
        daysRemaining: Math.max(0, daysRemaining),
        trialEndsAt: subscription.trialEndsAt,
        expiresAt,
        startDate: subscription.startDate,
        autoRenew: subscription.autoRenew,
        isTrialUsed:subscription.isTrialUsed,
      
      }
    } catch (error) {
            return {
        hasSubscription: false,
        status: null,
        daysRemaining: null,
        trialEndsAt: null,
        expiresAt: null,
         isTrialUsed: false,
        
      }
    }
  }

  /**
   * Activate subscription after payment
   */
  async activateSubscription(subscriptionId: string, data: {
    paymentId: string
    durationDays?: number
  }): Promise<SubscriptionWithRelations> {
    try {
      console.log(`[v0] Activating subscription: ${subscriptionId}`)

      // Fetch subscription to get billing period
      const currentSubscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      })

      if (!currentSubscription) {
        throw new Error(`Subscription not found: ${subscriptionId}`)
      }

      const now = new Date()
      
       // Use calendar periods so monthly/yearly expiry dates remain accurate.
      const endDate = new Date(now)
      switch (currentSubscription.billingPeriod) {
        case 'QUARTERLY': endDate.setMonth(endDate.getMonth() + 3); break
        case 'HALF_YEARLY': endDate.setMonth(endDate.getMonth() + 6); break
        case 'YEARLY': endDate.setFullYear(endDate.getFullYear() + 1); break
        case 'MONTHLY': endDate.setMonth(endDate.getMonth() + 1); break
        default: endDate.setDate(endDate.getDate() + (data.durationDays || 30))
      }
      const billingCycleEndDate = new Date(endDate)

      const subscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'ACTIVE' as SubscriptionStatus,
          startDate: now,
          endDate,
          billingCycleEndDate,
          lastPaymentId: data.paymentId,
          nextRenewalDate: endDate,
          isTrialUsed: true,
        },
        include: {
          plan: true,
          business: true,
        },
      })
      return subscription as SubscriptionWithRelations
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
  ): Promise<SubscriptionWithRelations> {
    try {
      const subscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data,
        include: {
          plan: true,
          business: true,
        },
      })
      return subscription as SubscriptionWithRelations
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
   * Get all expired subscriptions
   */
  async getExpiredSubscriptions(): Promise<SubscriptionWithRelations[]> {
    try {
      const now = new Date()

      const subscriptions = await prisma.subscription.findMany({
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
      return subscriptions as SubscriptionWithRelations[]
    } catch (error) {
      console.error(`[v0] Failed to get expired subscriptions:`, error)
      throw error
    }
  }

  /**
   * Get expiring soon subscriptions (within 7 days)
   */
  async getExpiringSoonSubscriptions(): Promise<SubscriptionWithRelations[]> {
    try {
      const now = new Date()
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const subscriptions = await prisma.subscription.findMany({
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
      return subscriptions as SubscriptionWithRelations[]
    } catch (error) {
      console.error(`[v0] Failed to get expiring soon subscriptions:`, error)
      throw error
    }
  }

  /**
   * Check if business can add more appointments
   */
  async canAddAppointment(businessId: string): Promise<AppointmentLimitResult> {
    try {
      const subscription = await this.getBusinessSubscription(businessId)

      if (!subscription || !(await this.isSubscriptionValid(businessId))) {
        return { allowed: false, reason: 'No active subscription found' }
      }

      const plan = subscription.plan

      if (plan.maxAppointmentsPerMonth === -1) {
          return { allowed: true, current: subscription.appointmentsThisMonth, limit: -1 }
      }

      if (subscription.appointmentsThisMonth >= plan.maxAppointmentsPerMonth) {
        return {
          allowed: false,
          reason: `Monthly booking limit (${plan.maxAppointmentsPerMonth}) reached. Upgrade to increase limit.`,
          current: subscription.appointmentsThisMonth,
          limit: plan.maxAppointmentsPerMonth,
        }
      }

      return {
        allowed: true,
        current: subscription.appointmentsThisMonth,
        limit: plan.maxAppointmentsPerMonth,
      }
    } catch (error) {

      return { allowed: false, reason: 'Error checking subscription' }
    }
  }

  /**
   * Check if business can add more staff
   */
  async canAddStaff(businessId: string): Promise<StaffLimitResult> {
    try {
      const subscription = await this.getBusinessSubscription(businessId)

      if (!subscription) {
        return { allowed: false, reason: 'No subscription found' }
      }

      const plan = subscription.plan

      if (plan.maxStaff === -1) {
        return { allowed: true }
      }

      const staffCount = await prisma.staff.count({
        where: { businessId, isActive:true },
      })

      if (staffCount >= plan.maxStaff) {
        return {
          allowed: false,
          reason: `Staff limit (${plan.maxStaff}) reached for ${plan.displayName} plan. Upgrade to add more staff.`,
          current: staffCount,
          limit: plan.maxStaff,
        }
      }

      return { allowed: true, current: staffCount, limit: plan.maxStaff }
    } catch (error) {
      console.error(`[v0] Failed to check staff limit:`, error)
      return { allowed: false, reason: 'Error checking subscription' }
    }
  }

  /**
   * Check if business can add more services
   */
  async canAddService(businessId: string): Promise<ServiceLimitResult> {
    try {
      const subscription = await this.getBusinessSubscription(businessId)

      if (!subscription) {
        return { allowed: false, reason: 'No subscription found' }
      }

      const plan = subscription.plan

      if (plan.maxServices === -1) {
        return { allowed: true }
      }

      const serviceCount = await prisma.service.count({
        where: { businessId },
      })

      if (serviceCount >= plan.maxServices) {
        return {
          allowed: false,
          reason: `Service limit (${plan.maxServices}) reached for ${plan.displayName} plan. Upgrade to add more services.`,
          current: serviceCount,
          limit: plan.maxServices,
        }
      }

      return { allowed: true, current: serviceCount, limit: plan.maxServices }
    } catch (error) {
      console.error(`[v0] Failed to check service limit:`, error)
      return { allowed: false, reason: 'Error checking subscription' }
    }
  }

  /**
   * Reset monthly usage counters
   */
  async resetMonthlyUsage(businessId: string): Promise<void> {
    try {
      const now = new Date()
      await prisma.subscription.updateMany({
        where: { businessId },
        data: {
          appointmentsThisMonth: 0,
          usageResetDate: now,
        },
      })
      console.log(`[v0] Monthly usage reset for business: ${businessId}`)
    } catch (error) {
      console.error(`[v0] Failed to reset monthly usage:`, error)
      throw error
    }
  }

  /**
   * Get subscription usage details
   */
  async getUsageDetails(businessId: string): Promise<UsageDetailsResult> {
    try {
      const subscription = await this.getBusinessSubscription(businessId)

      if (!subscription) {
        return null
      }

      const plan = subscription.plan
      const staffCount = await prisma.staff.count({ where: { businessId } })
      const serviceCount = await prisma.service.count({ where: { businessId } })
      const staffOverLimit = plan.maxStaff !== -1 && staffCount > plan.maxStaff
      const servicesOverLimit = plan.maxServices !== -1 && serviceCount > plan.maxServices
      const appointmentsOverLimit = plan.maxAppointmentsPerMonth !== -1 && subscription.appointmentsThisMonth > plan.maxAppointmentsPerMonth

      return {
        planName: plan.displayName,
        currentUsage: {
          appointmentsThisMonth: subscription.appointmentsThisMonth,
          staff: staffCount,
          services: serviceCount,
        },
        limits: {
          appointmentsPerMonth: plan.maxAppointmentsPerMonth === -1 ? 'Unlimited' : plan.maxAppointmentsPerMonth,
          maxStaff: plan.maxStaff === -1 ? 'Unlimited' : plan.maxStaff,
          maxServices: plan.maxServices === -1 ? 'Unlimited' : plan.maxServices,
        },
        featuresEnabled: {
          emailNotifications: plan.allowEmailNotifications,
          onlineBooking: plan.allowOnlineBooking,
          reports: plan.allowReports,
          customBranding: plan.allowCustomBranding,
          prioritySupport: plan.prioritySupport,
        },overLimit: {
          staff: staffOverLimit,
          services: servicesOverLimit,
          appointments: appointmentsOverLimit,
          any: staffOverLimit || servicesOverLimit || appointmentsOverLimit,
        },
      }
    } catch (error) {
      console.error(`[v0] Failed to get usage details:`, error)
      return null
    }
  }

  /**
   * Upgrade subscription to a higher tier
   */
  async upgradeSubscription(
    businessId: string,
    newPlanId: string,
    paymentId: string
  ): Promise<SubscriptionWithRelations> {
    try {
      console.log(`[v0] Upgrading subscription for business: ${businessId} to plan: ${newPlanId}`)

      const subscription = await prisma.subscription.findUnique({
        where: { businessId },
        include: { plan: true },
      })

      if (!subscription) {
        throw new Error('No subscription found for this business')
      }

      const newPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: newPlanId },
      })

      if (!newPlan) {
        throw new Error('Plan not found')
      }

      const now = new Date()
      const updated = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planId: newPlanId,
          status: 'ACTIVE' as SubscriptionStatus,
          lastPaymentId: paymentId,
          appointmentsThisMonth: 0,
          usageResetDate: now,
        },
        include: {
          plan: true,
          business: true,
        },
      })

      console.log(`[v0] Subscription upgraded successfully`)
      return updated as SubscriptionWithRelations
    } catch (error) {
      console.error(`[v0] Failed to upgrade subscription:`, error)
      throw error
    }
  }

  /**
   * Downgrade subscription to a lower tier
   */
  async downgradeSubscription(
    businessId: string,
    newPlanId: string,
    paymentId: string
  ): Promise<SubscriptionWithRelations> {
    try {
      console.log(`[v0] Downgrading subscription for business: ${businessId} to plan: ${newPlanId}`)

      const subscription = await prisma.subscription.findUnique({
        where: { businessId },
        include: { plan: true },
      })

      if (!subscription) {
        throw new Error('No subscription found for this business')
      }

      const newPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: newPlanId },
      })

      if (!newPlan) {
        throw new Error('Plan not found')
      }

        const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            planId: newPlanId,
            lastPaymentId: paymentId,
          },
          include: {
            plan: true,
            business: true,
          },
        })

        // Never delete staff or alter historical bookings. If the new plan has a
        // finite limit, deactivate only the newest excess active staff records.
        if (newPlan.maxStaff !== -1) {
          const activeStaff = await tx.staff.findMany({
            where: { businessId, isActive: true },
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            select: { id: true },
          })
          const excessStaff = activeStaff.slice(newPlan.maxStaff)
          if (excessStaff.length > 0) {
            await tx.staff.updateMany({
              where: { id: { in: excessStaff.map((staff) => staff.id) } },
              data: { isActive: false },
            })
            console.log(`[v0] Deactivated ${excessStaff.length} excess staff after downgrade`)
          }
        }

        return result
      })


      console.log(`[v0] Subscription downgraded successfully`)
      return updated as SubscriptionWithRelations
    } catch (error) {
      console.error(`[v0] Failed to downgrade subscription:`, error)
      throw error
    }
  }

  /**
   * Renew subscription after payment
   */
  async renewSubscription(
    subscriptionId: string,
    paymentId: string,
    durationDays: number = 30
  ): Promise<SubscriptionWithRelations> {
    try {
      console.log(`[v0] Renewing subscription: ${subscriptionId}`)

      const now = new Date()
      const newEndDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

      const updated = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'ACTIVE' as SubscriptionStatus,
          startDate: now,
          endDate: newEndDate,
          nextRenewalDate: newEndDate,
          lastPaymentId: paymentId,
          appointmentsThisMonth: 0,
          usageResetDate: now,
        },
        include: {
          plan: true,
          business: true,
        },
      })

      console.log(`[v0] Subscription renewed until: ${newEndDate}`)
      return updated as SubscriptionWithRelations
    } catch (error) {
      console.error(`[v0] Failed to renew subscription:`, error)
      throw error
    }
  }

  /**
   * Increment appointment usage
   */
  async incrementAppointmentUsage(businessId: string, count: number = 1): Promise<void> {
    try {
      await prisma.subscription.updateMany({
        where: { businessId },
        data: {
          appointmentsThisMonth: {
            increment: count,
          },
        },
      })
      console.log(`[v0] Appointment usage incremented by ${count} for business: ${businessId}`)
    } catch (error) {
      console.error(`[v0] Failed to increment appointment usage:`, error)
      throw error
    }
  }

  /**
   * Schedule trial to active transition
   */
  async scheduleTrialToActive(businessId: string): Promise<SubscriptionWithRelations> {
    try {
      console.log(`[v0] Scheduling subscription transition from trial to active: ${businessId}`)

      const subscription = await this.getBusinessSubscription(businessId)

      if (!subscription) {
        throw new Error('Subscription not found')
      }

      return subscription
    } catch (error) {
      console.error(`[v0] Failed to schedule trial transition:`, error)
      throw error
    }
  }

  /**
   * Auto-renew expired subscriptions
   */
  async autoRenewExpiredSubscriptions(): Promise<number> {
    try {
      console.log('[v0] Starting auto-renewal of expired subscriptions')

      const expiredSubs = await this.getExpiredSubscriptions()
      let renewedCount = 0

      for (const sub of expiredSubs) {
        if (sub.autoRenew) {
          try {
            await this.renewSubscription(sub.id, sub.lastPaymentId || '', 30)
            renewedCount++
          } catch (error) {
            console.error(`[v0] Failed to auto-renew subscription ${sub.id}:`, error)
          }
        }
      }

      console.log(`[v0] Auto-renewed ${renewedCount} subscriptions`)
      return renewedCount
    } catch (error) {
      console.error(`[v0] Failed to auto-renew subscriptions:`, error)
      throw error
    }
  }

  /**
   * Get subscription renewal date
   */
  async getNextRenewalDate(businessId: string): Promise<Date | null> {
    try {
      const subscription = await this.getBusinessSubscription(businessId)

      if (!subscription) {
        return null
      }

      if (subscription.status === 'TRIAL') {
        return subscription.trialEndsAt
      }

      if (subscription.status === 'ACTIVE') {
        return subscription.endDate
      }

      return null
    } catch (error) {
      console.error(`[v0] Failed to get renewal date:`, error)
      return null
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(data: {
    subscriptionId: string
    userId: string
  }): Promise<SubscriptionWithRelations> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: data.subscriptionId },
      include: { plan: true, business: true },
    })

    if (!subscription) {
      throw new Error(`Subscription not found: ${data.subscriptionId}`)
    }

    console.log(`[v0] Cancelling subscription ${data.subscriptionId}`)

    const updated = await prisma.subscription.update({
      where: { id: data.subscriptionId },
      data: {
        status: 'CANCELLED' as SubscriptionStatus,
        cancelledAt: new Date(),
      },
      include: { plan: true, business: true },
    })

    console.log(`[v0] Subscription cancelled successfully`)
    return updated as SubscriptionWithRelations
  }
}

export default new SubscriptionService()
