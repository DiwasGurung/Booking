import { Request, Response } from 'express'
import  prisma  from '../lib/prisma'
import SparrowSMSService  from '../services/sparrow-sms.service'
import {SmsType} from '../services/subscription-sms.service'
import SubscriptionSmsService from '../services/subscription-sms.service'

interface AuthRequest extends Request {
  userId?: string
  userRole?: string
}

/**
 * Resolves the calling user's own business. Every handler below scopes
 * its query/send to this id — never trust a businessId from the request
 * body/query, or one owner could read or send SMS on another's behalf.
 */
async function getOwnedBusinessId(req: AuthRequest): Promise<string | null> {
  if (!req.userId) return null
  const business = await prisma.business.findUnique({ where: { userId: req.userId } })
  return business?.id ?? null
}

const VALID_TYPES: SmsType[] = ['verification', 'booking', 'reminder', 'status_change', 'owner_notification']

export const SmsController = {
  /**
   * Send test SMS
   */
  async sendTest(req: AuthRequest, res: Response) {
    try {
      const businessId = await getOwnedBusinessId(req)
      if (!businessId) return res.status(403).json({ success: false, error: 'No business found for this account' })

      const { phoneNumber, message } = req.body
      if (!phoneNumber || !message) {
        return res.status(400).json({ success: false, error: 'Phone number and message are required' })
      }

      const result = await SparrowSMSService.sendBulk(businessId, [phoneNumber], message, 'booking')

      res.json({
        success: result.successful > 0,
        message: `SMS ${result.successful > 0 ? 'sent' : 'failed'}`,
        result,
      })
    } catch (error: any) {
      console.error('[v0] Error sending test SMS:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },

  /**
   * Get SMS logs for the logged-in business owner (scoped to their own business only)
   */
  async getLogs(req: AuthRequest, res: Response) {
    try {
      const businessId = await getOwnedBusinessId(req)
      if (!businessId) return res.status(403).json({ success: false, error: 'No business found for this account' })

      const { phoneNumber, type, status, limit = '50', offset = '0' } = req.query

      const { logs, total } = await SubscriptionSmsService.getLogs(businessId, {
        phoneNumber: phoneNumber as string | undefined,
        type: type as string | undefined,
        status: status as string | undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      })

      res.json({ success: true, logs, total, limit: parseInt(limit as string), offset: parseInt(offset as string) })
    } catch (error: any) {
      console.error('[v0] Error fetching SMS logs:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },

  /**
   * Get SMS statistics, scoped to the logged-in owner's business
   */
  async getStatistics(req: AuthRequest, res: Response) {
    try {
      const businessId = await getOwnedBusinessId(req)
      if (!businessId) return res.status(403).json({ success: false, error: 'No business found for this account' })

      const { startDate, endDate } = req.query
      const stats = await SubscriptionSmsService.getStatistics(
        businessId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      )

      res.json({ success: true, statistics: stats })
    } catch (error: any) {
      console.error('[v0] Error fetching SMS statistics:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },

  /**
   * Get logs by phone number, scoped to the logged-in owner's business
   */
  async getLogsByPhone(req: AuthRequest, res: Response) {
    try {
      const businessId = await getOwnedBusinessId(req)
      if (!businessId) return res.status(403).json({ success: false, error: 'No business found for this account' })

      const phoneNumberParam = req.params.phoneNumber
      const phoneNumber = Array.isArray(phoneNumberParam) ? phoneNumberParam[0] : phoneNumberParam
      if (!phoneNumber) return res.status(400).json({ success: false, error: 'Phone number is required' })

      const logs = await SubscriptionSmsService.getLogsByPhone(businessId, phoneNumber)
      res.json({ success: true, phoneNumber, logs })
    } catch (error: any) {
      console.error('[v0] Error fetching logs by phone:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },

  /**
   * Send bulk SMS — counts against the owner's own SMS quota
   */
  async sendBulk(req: AuthRequest, res: Response) {
    try {
      const businessId = await getOwnedBusinessId(req)
      if (!businessId) return res.status(403).json({ success: false, error: 'No business found for this account' })

      const { phoneNumbers, message, type = 'booking' } = req.body

      if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        return res.status(400).json({ success: false, error: 'Phone numbers array is required' })
      }
      if (!message) return res.status(400).json({ success: false, error: 'Message is required' })
      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ success: false, error: `type must be one of: ${VALID_TYPES.join(', ')}` })
      }

      const result = await SparrowSMSService.sendBulk(businessId, phoneNumbers, message, type)

      res.json({ success: true, message: `${result.successful} sent, ${result.failed} failed`, result })
    } catch (error: any) {
      console.error('[v0] Error sending bulk SMS:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },

  /**
   * Resend SMS for a specific phone number
   */
  async resendSMS(req: AuthRequest, res: Response) {
    try {
      const businessId = await getOwnedBusinessId(req)
      if (!businessId) return res.status(403).json({ success: false, error: 'No business found for this account' })

      const { phoneNumber, message, type = 'booking' } = req.body
      if (!phoneNumber || !message) {
        return res.status(400).json({ success: false, error: 'Phone number and message are required' })
      }
      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ success: false, error: `type must be one of: ${VALID_TYPES.join(', ')}` })
      }

      const result = await SparrowSMSService.sendBulk(businessId, [phoneNumber], message, type)

      res.json({
        success: result.successful > 0,
        message: result.successful > 0 ? 'SMS sent' : 'SMS failed',
        result: result.results[0],
      })
    } catch (error: any) {
      console.error('[v0] Error resending SMS:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },

  /**
   * Get plan quota / usage summary for the dashboard
   */
  async getUsage(req: AuthRequest, res: Response) {
    try {
      const businessId = await getOwnedBusinessId(req)
      if (!businessId) return res.status(403).json({ success: false, error: 'No business found for this account' })

      const stats = await SubscriptionSmsService.getSmsUsageStats(businessId)
      if (!stats) return res.status(404).json({ success: false, error: 'No subscription found' })

      res.json({ success: true, ...stats })
    } catch (error: any) {
      console.error('[v0] Error fetching SMS usage:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },
}

export default SmsController