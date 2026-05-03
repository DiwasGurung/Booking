import { Request, Response } from 'express'
import { userService } from '../services/user.service'
import { TwilioService } from '../services/twilio.service'

interface AuthRequest extends Request {
  user?: { id: string }
  userId?: string
}

/**
 * Send phone verification code
 */
export const sendPhoneVerificationCode = async (req: AuthRequest, res: Response) => {
  try {
    const { phoneNumber } = req.body

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number required' })
    }

    const userId = req.user?.id || req.userId
    if (!userId) {
      console.error('[Phone Verification] userId not found on request')
      return res.status(401).json({ error: 'Not authenticated' })
    }

    console.log('[Phone Verification] Sending code to phone:', phoneNumber)

    // Validate Nepali phone number format (10 digits starting with 9)
    const phoneRegex = /^98[0-9]{8}$/
    if (!phoneRegex.test(phoneNumber.replace(/[^\d]/g, ''))) {
      return res.status(400).json({ error: 'Invalid Nepali phone number format' })
    }

    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    console.log('[Phone Verification] Generated code for user:', userId)

    // Update user with verification code
    await userService.updateUser(userId, {
      phone: phoneNumber,
      phoneVerificationCode: verificationCode,
      phoneVerificationCodeExpires: codeExpires,
      phoneVerificationAttempts: 0,
    })

    // Send SMS
    const smsSent = await TwilioService.sendVerificationSMS(phoneNumber, verificationCode)

    if (!smsSent) {
      console.warn('[v0] SMS failed to send, but code was generated and stored')
    }

    res.json({
      success: true,
      message: 'Verification code sent to your phone',
      codeSent: smsSent,
    })
  } catch (error: any) {
    console.error('[Phone Verification Error]', error.message)
    res.status(500).json({ error: 'Failed to send verification code' })
  }
}

/**
 * Verify phone number with code
 */
export const verifyPhoneNumber = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({ error: 'Verification code required' })
    }

    const userId = req.user?.id || req.userId
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    console.log('[Phone Verification] Verifying code for user:', userId)

    const user = await userService.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if phone is already verified
    if (user.isPhoneVerified) {
      return res.status(400).json({ error: 'Phone is already verified' })
    }

    // Check if code matches
    if (user.phoneVerificationCode !== code) {
      console.log('[Phone Verification] Code mismatch for user:', userId)
      
      // Increment failed attempts
      const attempts = (user.phoneVerificationAttempts || 0) + 1
      try {
        await userService.updateUser(userId, {
          phoneVerificationAttempts: attempts,
        })
      } catch (updateError) {
        console.error('[Phone Verification] Failed to update attempt count:', updateError)
      }

      // Lock after 5 failed attempts
      if (attempts >= 5) {
        return res.status(400).json({
          error: 'Too many failed attempts. Please request a new code.',
          attemptsExceeded: true,
        })
      }

      return res.status(400).json({
        error: 'Invalid verification code',
        attemptsRemaining: 5 - attempts,
      })
    }

    // Check if code has expired
    if (user.phoneVerificationCodeExpires && user.phoneVerificationCodeExpires < new Date()) {
      console.log('[Phone Verification] Code expired for user:', userId)
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' })
    }

    // Mark phone as verified
    const verifiedUser = await userService.updateUser(userId, {
      isPhoneVerified: true,
      phoneVerificationCode: null,
      phoneVerificationCodeExpires: null,
      phoneVerificationAttempts: 0,
    })

    console.log('[v0] Phone verified for user:', userId, 'Phone:', verifiedUser.phone)

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      user: {
        id: verifiedUser.id,
        phone: verifiedUser.phone,
        isPhoneVerified: verifiedUser.isPhoneVerified,
      },
    })
  } catch (error: any) {
    console.error('[Phone Verification Error]', error.message)
    res.status(500).json({ error: 'Failed to verify phone number' })
  }
}

/**
 * Resend phone verification code
 */
export const resendPhoneVerificationCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || req.userId
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    console.log('[Phone Verification] Resending code for user:', userId)

    const user = await userService.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (!user.phone) {
      return res.status(400).json({ error: 'No phone number on file' })
    }

    if (user.isPhoneVerified) {
      return res.status(400).json({ error: 'Phone is already verified' })
    }

    // Generate new code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000)

    console.log('[Phone Verification] Generated new code for user:', userId)

    // Update with new code
    await userService.updateUser(userId, {
      phoneVerificationCode: verificationCode,
      phoneVerificationCodeExpires: codeExpires,
      phoneVerificationAttempts: 0,
    })

    // Send SMS
    const smsSent = await TwilioService.sendVerificationSMS(user.phone, verificationCode)

    res.json({
      success: true,
      message: 'Verification code resent',
      codeSent: smsSent,
    })
  } catch (error: any) {
    console.error('[Phone Verification Error]', error.message)
    res.status(500).json({ error: 'Failed to resend verification code' })
  }
}
