import { Request, Response } from 'express'
import VerificationService, { VerifyEntityType, VerifyPurpose } from '../services/phone-verification.service'
import { entityResolvers } from '../services/verification-resolvers'
import { sendBookingConfirmationByPlan } from './booking.controller'
import prisma from '../lib/prisma'

const SEND_ERROR_STATUS: Record<string, number> = {
  COOLDOWN: 429,
  RATE_LIMITED: 429,
  SEND_FAILED: 502,
}

const VERIFY_ERROR_STATUS: Record<string, number> = {
  NO_CODE: 400,
  EXPIRED: 410,
  TOO_MANY_ATTEMPTS: 429,
  INVALID_CODE: 400,
}

function parseEntityType(raw: string | string[] | undefined): VerifyEntityType | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return null

  const upper = value.toUpperCase()
  return upper in entityResolvers ? (upper as VerifyEntityType) : null
}

function getParamValue(raw: string | string[] | undefined): string {
  return Array.isArray(raw) ? raw[0] || '' : raw || ''
}

export const VerificationController = {
  async sendCode(req: Request, res: Response) {
    const entityType = parseEntityType(req.params.entityType)
    const entityId = getParamValue(req.params.entityId)
    const purpose = ((req.body?.purpose as VerifyPurpose) || 'PHONE_VERIFICATION') as VerifyPurpose

    if (!entityType) return res.status(400).json({ success: false, error: 'Unsupported entity type' })
    const resolver = entityResolvers[entityType]

    if (await resolver.isAlreadyVerified(entityId)) {
      return res.status(400).json({ success: false, error: 'Already verified' })
    }

    const destination = await resolver.getDestination(entityId)
    if (!destination) {
      return res.status(404).json({ success: false, error: 'No phone number on file for this record' })
    }

    const businessId = resolver.getBusinessId ? await resolver.getBusinessId(entityId) : undefined

    const result = await VerificationService.sendCode({ entityType, entityId, destination, purpose, businessId })
    if (!result.success) {
      return res.status(SEND_ERROR_STATUS[result.code] || 400).json({
        success: false,
        error: result.error,
        ...('retryAfterSeconds' in result ? { retryAfterSeconds: result.retryAfterSeconds } : {}),
      })
    }

    res.json({ success: true, message: 'Verification code sent' })
  },

  async verifyCode(req: Request, res: Response) {
    const entityType = parseEntityType(req.params.entityType)
    const entityId = getParamValue(req.params.entityId)
    const purpose = ((req.body?.purpose as VerifyPurpose) || 'PHONE_VERIFICATION') as VerifyPurpose
    const { code } = req.body

    if (!entityType) return res.status(400).json({ success: false, error: 'Unsupported entity type' })
    if (!code || typeof code !== 'string') return res.status(400).json({ success: false, error: 'Code is required' })

    const resolver = entityResolvers[entityType]

    if (await resolver.isAlreadyVerified(entityId)) {
      // Already verified on a prior call — the booking confirmation (if
      // this is a BOOKING entity) was already sent then, so don't send
      // it again here.
      return res.json({ success: true, alreadyVerified: true })
    }

    const result = await VerificationService.verifyCode({ entityType, entityId, purpose, code })
    if (!result.success) {
      return res.status(VERIFY_ERROR_STATUS[result.code] || 400).json({
        success: false,
        error: result.error,
        ...('attemptsRemaining' in result ? { attemptsRemaining: result.attemptsRemaining } : {}),
      })
    }

    await resolver.markVerified(entityId)

    // Booking phone verification (Enterprise-plan bookings only — every
    // other plan verifies via the email link instead) is the trigger for
    // sending the customer-facing booking confirmation SMS. The booking
    // is created UNVERIFIED and isn't a confirmed appointment until this
    // step completes.
    if (entityType === 'BOOKING') {
      try {
        const booking = await prisma.booking.findUnique({
          where: { id: entityId },
          include: {
            service: true,
            business: { include: { subscription: { include: { plan: true } } } },
          },
        })
        if (booking) {
          await sendBookingConfirmationByPlan(
            booking.businessId,
            booking.business,
            booking,
            booking.service.name
          )
        }
      } catch (notifyError) {
        // Never let a notification failure block the verification response.
        console.error('[v0] Failed to send booking confirmation after phone verification:', notifyError)
      }
    }

    res.json({ success: true, message: 'Verified successfully' })
  },
}

export default VerificationController