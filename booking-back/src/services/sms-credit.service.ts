import { randomUUID } from 'crypto'
import prisma from '../lib/prisma'
import SubscriptionSmsService from './subscription-sms.service'

class SmsCreditService {
  getPackages() {
    return prisma.smsCreditPackage.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    })
  }

  /** Step 1: create a pending payment for a package. Price comes from the DB, never the client. */
  async createPurchase(businessId: string, packageId: string, gateway: 'esewa' | 'khalti') {
    const pkg = await prisma.smsCreditPackage.findFirst({ where: { id: packageId, active: true } })
    if (!pkg) throw new Error('SMS package not found')

    return prisma.payment.create({
      data: {
        businessId,
        gateway,
        transactionId: `SMS-${randomUUID()}`,
        amount: pkg.priceNPR,
        status: 'pending',
        purpose: 'SMS_CREDITS',
        smsCreditPackageId: pkg.id,
        currency: 'NPR',
        reference: pkg.displayName,
      },
    })
  }

  /**
   * Step 3: call ONLY after the gateway has confirmed the payment server-side.
   * Safe to call repeatedly (callback + redirect + retries): the unique
   * paymentId on the ledger means credits are granted at most once.
   */
  async completePurchase(transactionId: string) {
    const payment = await prisma.payment.findUnique({ where: { transactionId } })
    if (!payment) throw new Error('Payment not found')
    if (payment.purpose !== 'SMS_CREDITS' || !payment.smsCreditPackageId) {
      throw new Error('Not an SMS credit payment')
    }

    const pkg = await prisma.smsCreditPackage.findUnique({ where: { id: payment.smsCreditPackageId } })
    if (!pkg) throw new Error('SMS package no longer exists')

    const result = await SubscriptionSmsService.addCredits(
      payment.businessId,
      pkg.credits + pkg.bonusCredits,
      'PURCHASE',
      { description: `Purchased ${pkg.displayName}`, paymentId: payment.id }
    )

    if (payment.status !== 'completed') {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'completed' } })
    }
    return { ...result, credits: pkg.credits + pkg.bonusCredits }
  }

  async failPurchase(transactionId: string, reason?: string) {
    await prisma.payment.updateMany({
      where: { transactionId, purpose: 'SMS_CREDITS', status: 'pending' },
      data: { status: 'failed', errorMessage: reason },
    })
  }
}

export default new SmsCreditService()