import express, { Request, Response } from 'express'
import { staffVerificationService } from '../services/staff-verification.service'
import { parseAndValidate, isValidationError } from '../validators'
import z from 'zod'

const staffVerificationRoutes = express.Router()

// Validation schemas
const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
  staffId: z.string().min(1).optional(),
})

const ResendVerificationSchema = z.object({
  staffId: z.string().min(1).optional(),
  token: z.string().min(1).optional(),
}).refine((value) => value.staffId || value.token, {
  message: 'Staff ID or verification token is required',
})

const VerificationStatusSchema = z.object({
  staffId: z.string().min(1, 'Staff ID is required'),
})

/**
 * Verify staff email with token
 */
staffVerificationRoutes.post('/verify', async (req: Request, res: Response) => {
  try {
    const validation = parseAndValidate(VerifyEmailSchema, req.body)

    if (isValidationError(validation)) {
      return res.status(400).json({ message: validation.error })
    }

    const { token, staffId } = validation.data

    const result = await staffVerificationService.verifyEmail(token, staffId)
    res.json(result)
  } catch (error: any) {
    console.error('[v0] Error verifying email:', error)
    res.status(400).json({ message: error.message || 'Failed to verify email' })
  }
})

/**
 * Resend verification email
 */
staffVerificationRoutes.post('/resend', async (req: Request, res: Response) => {
  try {
    const validation = parseAndValidate(ResendVerificationSchema, req.body)

    if (isValidationError(validation)) {
      return res.status(400).json({ message: validation.error })
    }

    const { staffId, token } = validation.data

    const result = await staffVerificationService.resendVerificationEmail(staffId, token)
    res.json(result)
  } catch (error: any) {
    console.error('[v0] Error resending verification email:', error)
    res.status(400).json({ message: error.message || 'Failed to resend verification email' })
  }
})

/**
 * Get verification status
 */
staffVerificationRoutes.get('/status/:staffId', async (req: Request, res: Response) => {
  try {
    const validation = parseAndValidate(VerificationStatusSchema, req.params)

    if (isValidationError(validation)) {
      return res.status(400).json({ message: validation.error })
    }

    const { staffId } = validation.data

    const result = await staffVerificationService.getVerificationStatus(staffId)
    res.json(result)
  } catch (error: any) {
    console.error('[v0] Error getting verification status:', error)
    res.status(400).json({ message: error.message || 'Failed to get verification status' })
  }
})

export default staffVerificationRoutes
