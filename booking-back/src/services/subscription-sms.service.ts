import prisma from "../lib/prisma"

class SubscriptionSmsService {
  /**
   * Check if business has SMS quota available
   */
  async checkSmsQuota(businessId: string): Promise<{ available: boolean; remaining: number; limit: number }> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { businessId },
        include: { plan: true }
      })

      if (!subscription) {
        console.log('[v0] No subscription found for business:', businessId)
        return { available: false, remaining: 0, limit: 0 }
      }

      // If plan doesn't allow SMS, return false
      if (!subscription.plan.allowSmsNotifications) {
        console.log('[v0] SMS not allowed for this subscription plan:', subscription.planId)
        return { available: false, remaining: 0, limit: subscription.plan.maxSmsPerMonth }
      }

      // If SMS limit is 0 (disabled), return false
      if (subscription.plan.maxSmsPerMonth <= 0) {
        console.log('[v0] SMS limit is 0 for plan:', subscription.planId)
        return { available: false, remaining: 0, limit: 0 }
      }

      // Check if usage reset date has passed
      const now = new Date()
      let smsUsed = subscription.smsUsedThisMonth
      let smsCreditBalance = subscription.smsCreditBalance

      if (subscription.usageResetDate && subscription.usageResetDate < now) {
        // Reset usage for new month
        smsUsed = 0
        smsCreditBalance = subscription.plan.maxSmsPerMonth
        
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            smsUsedThisMonth: 0,
            smsCreditBalance: subscription.plan.maxSmsPerMonth,
            usageResetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1)
          }
        })
      } else if (!subscription.usageResetDate) {
        // First time, set reset date
        smsCreditBalance = subscription.plan.maxSmsPerMonth
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            smsCreditBalance: subscription.plan.maxSmsPerMonth,
            usageResetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1)
          }
        })
      }

      const remaining = subscription.plan.maxSmsPerMonth - smsUsed
      const hasQuota = remaining > 0

      console.log('[v0] SMS quota check - Used:', smsUsed, 'Remaining:', remaining, 'Limit:', subscription.plan.maxSmsPerMonth)
      
      return {
        available: hasQuota,
        remaining: Math.max(0, remaining),
        limit: subscription.plan.maxSmsPerMonth
      }
    } catch (error) {
      console.error('[v0] Error checking SMS quota:', error)
      return { available: false, remaining: 0, limit: 0 }
    }
  }

  /**
   * Increment SMS usage after successful send
   */
  async incrementSmsUsage(businessId: string, count: number = 1, subscriptionId?: string): Promise<boolean> {
    try {
      let subscription = null
      
      if (subscriptionId) {
        subscription = await prisma.subscription.findUnique({
          where: { id: subscriptionId }
        })
      } else {
        subscription = await prisma.subscription.findUnique({
          where: { businessId }
        })
      }

      if (!subscription) {
        console.log('[v0] Subscription not found for SMS usage increment')
        return false
      }

      const newUsage = subscription.smsUsedThisMonth + count
      const newBalance = subscription.smsCreditBalance - count

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          smsUsedThisMonth: newUsage,
          smsCreditBalance: Math.max(0, newBalance)
        }
      })

      console.log('[v0] SMS usage incremented - New usage:', newUsage, 'New balance:', newBalance)
      return true
    } catch (error) {
      console.error('[v0] Error incrementing SMS usage:', error)
      return false
    }
  }

  /**
   * Get SMS usage statistics for a subscription
   */
  async getSmsUsageStats(businessId: string) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { businessId },
        include: {
          plan: true,
          smsLogs: {
            where: { status: 'SENT' },
            select: { type: true, createdAt: true, status: true }
          }
        }
      })

      if (!subscription) {
        return null
      }

      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

      const thisMonthLogs = subscription.smsLogs.filter(log => 
        log.createdAt >= monthStart && log.createdAt < monthEnd
      )

      // Group by type
      const byType = {
        owner_notification: thisMonthLogs.filter(l => l.type === 'owner_notification').length,
        booking: thisMonthLogs.filter(l => l.type === 'booking').length,
        reminder: thisMonthLogs.filter(l => l.type === 'reminder').length,
        verification: thisMonthLogs.filter(l => l.type === 'verification').length,
        status_change: thisMonthLogs.filter(l => l.type === 'status_change').length,
      }

      return {
        plan: {
          name: subscription.plan.displayName,
          maxSmsPerMonth: subscription.plan.maxSmsPerMonth,
          allowSms: subscription.plan.allowSmsNotifications
        },
        usage: {
          used: subscription.smsUsedThisMonth,
          remaining: subscription.smsCreditBalance,
          limit: subscription.plan.maxSmsPerMonth,
          percentageUsed: subscription.plan.maxSmsPerMonth > 0 
            ? Math.round((subscription.smsUsedThisMonth / subscription.plan.maxSmsPerMonth) * 100)
            : 0
        },
        byType,
        resetDate: subscription.usageResetDate,
        lastThirtyDays: {
          total: subscription.smsLogs.length,
          successful: subscription.smsLogs.filter(l => l.status === 'SENT').length,
          failed: subscription.smsLogs.filter(l => l.status === 'FAILED').length
        }
      }
    } catch (error) {
      console.error('[v0] Error getting SMS usage stats:', error)
      return null
    }
  }

  /**
   * Log SMS send attempt
   */
  async logSmsAttempt(data: {
    businessId: string
    subscriptionId?: string
    phoneNumber: string
    message: string
    type: string
    status: 'SENT' | 'FAILED'
    messageId?: string
    errorMessage?: string
  }) {
    try {
      await prisma.sMSLog.create({
        data: {
          businessId: data.businessId,
          subscriptionId: data.subscriptionId,
          phoneNumber: data.phoneNumber,
          message: data.message,
          type: data.type,
          status: data.status,
          messageId: data.messageId,
          errorMessage: data.errorMessage,
          provider: 'SPARROW'
        }
      })
    } catch (error) {
      console.error('[v0] Error logging SMS attempt:', error)
    }
  }
}

export default new SubscriptionSmsService()
