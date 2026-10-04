import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import SmsCreditService from '../services/sms-credit.service'
import SubscriptionSmsService from '../services/subscription-sms.service'

/** Every endpoint is scoped to a business the logged-in user owns. */
async function ownsBusiness(req: Request, businessId: string) {
  const userId = (req as any).userId
  if (!userId) return false
  const b = await prisma.business.findFirst({ where: { id: businessId, userId }, select: { id: true } })
  return !!b
}

class SmsCreditController {
  async getPackages(_req: Request, res: Response) {
    try {
      res.json({ success: true, data: await SmsCreditService.getPackages() })
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message })
    }
  }

  async getBalance(req: Request, res: Response) {
    const businessId = req.params.businessId as string
    if (!(await ownsBusiness(req, businessId))) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    const stats = await SubscriptionSmsService.getSmsUsageStats(businessId)
    res.json({ success: true, data: stats })
  }

  async getTransactions(req: Request, res: Response) {
    const businessId = req.params.businessId as string
    if (!(await ownsBusiness(req, businessId))) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50))
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0)
    const data = await SubscriptionSmsService.getTransactions(businessId, limit, offset)
    res.json({ success: true, data })
  }

  async initiatePurchase(req: Request, res: Response) {
    try {
      const businessId = req.params.businessId as string
      const { packageId, gateway } = req.body as { packageId?: string; gateway?: 'esewa' | 'khalti' }

      if (!(await ownsBusiness(req, businessId))) {
        return res.status(403).json({ success: false, message: 'Access denied' })
      }
      if (!packageId || (gateway !== 'esewa' && gateway !== 'khalti')) {
        return res.status(400).json({ success: false, message: 'packageId and a valid gateway are required' })
      }

      const payment = await SmsCreditService.createPurchase(businessId, packageId, gateway)

      // Hand off to the SAME gateway-initiation code you use for subscriptions,
      // passing payment.transactionId and payment.amount (see section 4).
      res.status(201).json({
        success: true,
        data: { paymentId: payment.id, transactionId: payment.transactionId, amount: payment.amount, gateway },
      })
    } catch (e: any) {
      console.error('[v0] SMS purchase initiation failed:', e)
      res.status(500).json({ success: false, message: e.message || 'Failed to start purchase' })
    }
  }
}

export default new SmsCreditController()