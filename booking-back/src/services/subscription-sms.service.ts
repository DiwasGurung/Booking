import  prisma  from "../lib/prisma"

export type SmsType = 'verification' | 'booking' | 'reminder' | 'status_change' | 'owner_notification'
export type SmsStatus = 'SENT' | 'FAILED'

// Duplicated intentionally (rather than imported from sparrow-sms.service.ts)
// to avoid a circular import — that service already imports this one.
function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '')
  if (cleaned.startsWith('977')) return cleaned
  if (cleaned.length === 10 && cleaned.startsWith('9')) return '977' + cleaned
  return cleaned
}

/** 1 credit per SMS segment. ASCII/GSM text = 160 chars (153 when multipart); anything else = 70 (67). */
export function calculateSmsCredits(text: string): number {
  const isAscii = /^[\x00-\x7F]*$/.test(text)
  const single = isAscii ? 160 : 70
  const multi = isAscii ? 153 : 67
  if (text.length <= single) return 1
  return Math.ceil(text.length / multi)
}

/**
 * Single source of truth for:
 *  - checking whether a business can send an SMS right now
 *  - decrementing/tracking usage after a send
 *  - writing to SMSLog
 *
 * sparrow-sms.service.ts should NOT touch prisma.sMSLog or subscription
 * fields directly — everything routes through here so there's exactly
 * one place that owns quota + logging consistency.
 */
class SubscriptionSmsService {

  async getBalance(businessId: string): Promise<number> {
    const b = await prisma.business.findUnique({ where: { id: businessId }, select: { smsCredits: true } })
    return b?.smsCredits ?? 0
  }

  /** Atomically deduct credits. Fails (ok:false) if the balance is too low. */
  async reserveCredits(businessId: string, credits: number, description: string) {
    return prisma.$transaction(async (tx) => {
      const res = await tx.business.updateMany({
        where: { id: businessId, smsCredits: { gte: credits } },
        data: { smsCredits: { decrement: credits } },
      })
      if (res.count === 0) return { ok: false as const, balance: await this.getBalance(businessId) }

      const { smsCredits } = await tx.business.findUniqueOrThrow({
        where: { id: businessId }, select: { smsCredits: true },
      })
      await tx.smsCreditTransaction.create({
        data: { businessId, type: 'USAGE', amount: -credits, balanceAfter: smsCredits, description },
      })
      return { ok: true as const, balance: smsCredits }
    })
  }

  /** Return credits after a failed send. */
  async refundCredits(businessId: string, credits: number, description: string) {
    return this.addCredits(businessId, credits, 'REFUND', { description })
  }

  /** Single entry point for every credit increase (purchase, plan grant, bonus, refund, adjustment). */
  async addCredits(
    businessId: string,
    credits: number,
    type: 'PURCHASE' | 'PLAN_GRANT' | 'BONUS' | 'REFUND' | 'ADJUSTMENT',
    opts?: { description?: string; paymentId?: string }
  ) {
    return prisma.$transaction(async (tx) => {
      // Idempotency: one payment can only ever grant credits once.
      if (opts?.paymentId) {
        const existing = await tx.smsCreditTransaction.findUnique({ where: { paymentId: opts.paymentId } })
        if (existing) return { granted: false, balance: existing.balanceAfter }
      }
      const { smsCredits } = await tx.business.update({
        where: { id: businessId },
        data: { smsCredits: { increment: credits } },
        select: { smsCredits: true },
      })
      await tx.smsCreditTransaction.create({
        data: {
          businessId, type, amount: credits, balanceAfter: smsCredits,
          description: opts?.description, paymentId: opts?.paymentId,
        },
      })
      return { granted: true, balance: smsCredits }
    })
  }

  async logSmsAttempt(data: {
    businessId?: string; phoneNumber: string; message: string; type: SmsType
    status: 'SENT' | 'FAILED'; messageId?: string; errorMessage?: string; creditsUsed?: number
  }) {
    const subscription = data.businessId
      ? await prisma.subscription.findUnique({ where: { businessId: data.businessId }, select: { id: true } })
      : null
    return prisma.sMSLog.create({
      data: {
        businessId: data.businessId,
        subscriptionId: subscription?.id,
        phoneNumber: data.phoneNumber,
        message: data.message,
        type: data.type,
        status: data.status,
        messageId: data.messageId,
        errorMessage: data.errorMessage,
        creditsUsed: data.status === 'SENT' ? data.creditsUsed ?? 0 : 0,
      },
    })
  }
   /**
   * Paginated SMS log list, ALWAYS scoped to a single business. Never
   * expose an endpoint that queries SMSLog without a businessId filter,
   * or one business owner could read another's SMS history.
   */
  async getLogs(
    businessId: string,
    filters: { phoneNumber?: string; type?: string; status?: string; limit?: number; offset?: number }
  ) {
    const where: Record<string, unknown> = { businessId }
    if (filters.phoneNumber) where.phoneNumber = filters.phoneNumber
    if (filters.type) where.type = filters.type
    if (filters.status) where.status = filters.status

    const [logs, total] = await Promise.all([
      prisma.sMSLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit ?? 50,
        skip: filters.offset ?? 0,
      }),
      prisma.sMSLog.count({ where }),
    ])

    return { logs, total }
  }

  async getLogsByPhone(businessId: string, phoneNumber: string) {
    const formatted = formatPhoneNumber(phoneNumber)
    return prisma.sMSLog.findMany({
      where: { businessId, phoneNumber: formatted },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  /** Aggregate send/fail counts, scoped to one business, optionally date-bounded. */
  async getStatistics(businessId: string, startDate?: Date, endDate?: Date) {
    const where: Record<string, unknown> = { businessId }
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      }
    }

    const [total, sent, failed, byType] = await Promise.all([
      prisma.sMSLog.count({ where }),
      prisma.sMSLog.count({ where: { ...where, status: 'SENT' } }),
      prisma.sMSLog.count({ where: { ...where, status: 'FAILED' } }),
      prisma.sMSLog.groupBy({ by: ['type'], where, _count: { id: true } }),
    ])

    return {
      total,
      sent,
      failed,
      successRate: total > 0 ? ((sent / total) * 100).toFixed(2) + '%' : '0%',
      byType: byType.map((t) => ({ type: t.type, count: t._count.id })),
    }
  }

  /** Credit ledger for the business's "credit history" screen. */
  async getTransactions(businessId: string, limit = 50, offset = 0) {
    const [transactions, total] = await Promise.all([
      prisma.smsCreditTransaction.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.smsCreditTransaction.count({ where: { businessId } }),
    ])
    return { transactions, total }
  }

  /** SMS usage stats for a business's dashboard (credit-based). */
  async getSmsUsageStats(businessId: string) {
    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const where = { businessId, createdAt: { gte: monthStart } }

      const [balance, logs, creditAgg] = await Promise.all([
        this.getBalance(businessId),
        prisma.sMSLog.findMany({ where, select: { type: true, status: true } }),
        prisma.sMSLog.aggregate({ where, _sum: { creditsUsed: true } }),
      ])

      const byType: Record<string, number> = {
        owner_notification: 0, booking: 0, reminder: 0, verification: 0, status_change: 0,
      }
      for (const l of logs) byType[l.type] = (byType[l.type] ?? 0) + 1

      return {
        credits: {
          balance,
          usedThisMonth: creditAgg._sum.creditsUsed ?? 0,
        },
        byType,
        thisMonth: {
          total: logs.length,
          successful: logs.filter((l) => l.status === 'SENT').length,
          failed: logs.filter((l) => l.status === 'FAILED').length,
        },
      }
    } catch (error) {
      console.error('[v0] Error getting SMS usage stats:', error)
      return null
    }
  }

  
}

export default new SubscriptionSmsService()