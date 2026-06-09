import { Request, Response } from 'express'
import SparrowSMSService from '../services/sparrow-sms.service'
import prisma from '../lib/prisma'

interface AuthRequest extends Request {
  userId?: string
  userRole?: string
}

export const SmsController = {
  /**
   * Send test SMS
   */
  async sendTest(req: AuthRequest, res: Response) {
    try {
      const { phoneNumber, message } = req.body

      if (!phoneNumber || !message) {
        return res.status(400).json({
          success: false,
          error: 'Phone number and message are required',
        })
      }

      const result = await SparrowSMSService.sendBulk([phoneNumber], message, 'booking')

      res.json({
        success: result.successful > 0,
        message: `SMS ${result.successful > 0 ? 'sent' : 'failed'}`,
        result,
      })
    } catch (error: any) {
      console.error('[v0] Error sending test SMS:', error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  },

  /**
   * Get SMS logs for business owner
   */
  async getLogs(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { phoneNumber, type, status, limit = '50', offset = '0' } = req.query

      const where: any = {}
      if (phoneNumber) where.phoneNumber = phoneNumber
      if (type) where.type = type
      if (status) where.status = status

      const [logs, total] = await Promise.all([
        prisma.sMSLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: parseInt(limit as string),
          skip: parseInt(offset as string),
        }),
        prisma.sMSLog.count({ where }),
      ])

      res.json({
        success: true,
        logs,
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      })
    } catch (error: any) {
      console.error('[v0] Error fetching SMS logs:', error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  },

  /**
   * Get SMS statistics
   */
  async getStatistics(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { startDate, endDate } = req.query

      const stats = await SparrowSMSService.getStatistics(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      )

      res.json({
        success: true,
        statistics: stats,
      })
    } catch (error: any) {
      console.error('[v0] Error fetching SMS statistics:', error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  },

  /**
   * Get logs by phone number
   */
  async getLogsByPhone(req: AuthRequest, res: Response) {
    try {
      const phoneNumberParam = req.params.phoneNumber
      const phoneNumber = Array.isArray(phoneNumberParam) ? phoneNumberParam[0] : phoneNumberParam

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          error: 'Phone number is required',
        })
      }

      const logs = await SparrowSMSService.getLogsByPhoneNumber(phoneNumber)

      res.json({
        success: true,
        phoneNumber,
        logs,
      })
    } catch (error: any) {
      console.error('[v0] Error fetching logs by phone:', error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  },

  /**
   * Send bulk SMS
   */
  async sendBulk(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { phoneNumbers, message, type = 'booking' } = req.body

      if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Phone numbers array is required',
        })
      }

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message is required',
        })
      }

      const result = await SparrowSMSService.sendBulk(phoneNumbers, message, type)

      res.json({
        success: true,
        message: `${result.successful} sent, ${result.failed} failed`,
        result,
      })
    } catch (error: any) {
      console.error('[v0] Error sending bulk SMS:', error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  },

  /**
   * Resend SMS for specific phone number
   */
  async resendSMS(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { phoneNumber, message, type = 'booking' } = req.body

      if (!phoneNumber || !message) {
        return res.status(400).json({
          success: false,
          error: 'Phone number and message are required',
        })
      }

      const result = await SparrowSMSService.sendBulk([phoneNumber], message, type)

      res.json({
        success: result.successful > 0,
        message: result.successful > 0 ? 'SMS sent' : 'SMS failed',
        result: result.results[0],
      })
    } catch (error: any) {
      console.error('[v0] Error resending SMS:', error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  },
}

export default SmsController
