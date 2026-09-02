import  prisma  from '../lib/prisma'
import SparrowSMSService from './sparrow-sms.service'

export type VerifyEntityType = 'USER' | 'STAFF' | 'BUSINESS' | 'BOOKING'
export type VerifyPurpose = 'PHONE_VERIFICATION' | 'LOGIN_OTP' | 'PASSWORD_RESET_OTP'

const CODE_EXPIRY_MINUTES = 10
const RESEND_COOLDOWN_SECONDS = 60
const MAX_VERIFY_ATTEMPTS = 5
// Abuse guard for ungated (non-business-quota) sends — account verification,
// login OTPs, password resets. A business-scoped Booking send is instead
// bounded by that business's SMS quota, so this cap doesn't apply to it.
const MAX_CODES_PER_DESTINATION_PER_DAY = 10

type SendResult =
  | { success: true }
  | {
      success: false
      error: string
      code: 'COOLDOWN' | 'RATE_LIMITED' | 'SEND_FAILED'
      retryAfterSeconds?: number
    }

type VerifyResult =
  | { success: true }
  | {
      success: false
      error: string
      code: 'NO_CODE' | 'EXPIRED' | 'TOO_MANY_ATTEMPTS' | 'INVALID_CODE'
      attemptsRemaining?: number
    }

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

class VerificationService {
  /**
   * Generate and send an OTP for any entity/purpose pair.
   *
   * businessId: pass this when the entity being verified is tied to a
   * specific business's paid SMS quota (currently: BOOKING). Omit it for
   * account-level verification (USER, STAFF, BUSINESS) — those are core
   * auth flows and shouldn't be blocked by, or drain, a business's plan.
   */
  async sendCode(params: {
    entityType: VerifyEntityType
    entityId: string
    destination: string
    purpose: VerifyPurpose
    businessId?: string
  }): Promise<SendResult> {
    const { entityType, entityId, destination, purpose, businessId } = params

    const latest = await prisma.verificationCode.findFirst({
      where: { entityType, entityId, purpose, consumedAt: null },
      orderBy: { sentAt: 'desc' },
    })

    if (latest) {
      const elapsedSeconds = (Date.now() - latest.sentAt.getTime()) / 1000
      if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
        const retryAfterSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsedSeconds)
        return { success: false, error: `Please wait ${retryAfterSeconds}s before requesting another code`, code: 'COOLDOWN', retryAfterSeconds }
      }
    }

    if (!businessId) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const countToday = await prisma.verificationCode.count({
        where: { destination, purpose, sentAt: { gte: since } },
      })
      if (countToday >= MAX_CODES_PER_DESTINATION_PER_DAY) {
        return { success: false, error: 'Too many verification codes requested for this number today', code: 'RATE_LIMITED' }
      }
    }

    const otp = generateCode()

    try {
  const smsResult = businessId
    ? await SparrowSMSService.sendVerificationCode(businessId, destination, otp)
    : await SparrowSMSService.sendAccountVerificationCode(destination, otp);
  
  if (!smsResult.success) {
    return { success: false, error: smsResult.error || 'Failed to send SMS', code: 'SEND_FAILED' };
  }
} catch (error) {
  console.error('SMS sending error:', error);
  return { success: false, error: 'Failed to send SMS due to internal error', code: 'SEND_FAILED' };
}

    await prisma.verificationCode.create({
      data: {
        entityType,
        entityId,
        channel: 'SMS',
        purpose,
        destination,
        code: otp,
        expiresAt: new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000),
      },
    })

    return { success: true }
  }

  /**
   * Check a submitted code against the latest unconsumed code for this
   * entity/purpose. Does NOT flip any "isVerified" flag — the caller
   * (via the resolver map) owns that, since only the caller knows which
   * model and field represents "verified" for this entity type.
   */
  async verifyCode(params: {
    entityType: VerifyEntityType
    entityId: string
    purpose: VerifyPurpose
    code: string
  }): Promise<VerifyResult> {
    const { entityType, entityId, purpose, code } = params

    const record = await prisma.verificationCode.findFirst({
      where: { entityType, entityId, purpose, consumedAt: null },
      orderBy: { sentAt: 'desc' },
    })

    if (!record) return { success: false, error: 'No verification code was requested', code: 'NO_CODE' }
    if (record.expiresAt < new Date()) return { success: false, error: 'Code expired — please request a new one', code: 'EXPIRED' }
    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      return { success: false, error: 'Too many incorrect attempts — please request a new code', code: 'TOO_MANY_ATTEMPTS' }
    }

    if (record.code !== code.trim()) {
      const updated = await prisma.verificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      })
      return {
        success: false,
        error: 'Incorrect code',
        code: 'INVALID_CODE',
        attemptsRemaining: Math.max(0, MAX_VERIFY_ATTEMPTS - updated.attempts),
      }
    }

    await prisma.verificationCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } })
    return { success: true }
  }
}

export default new VerificationService()