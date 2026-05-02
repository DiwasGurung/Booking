import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/firebase-auth.middleware'
import { userService } from '../services/user.service'
import { syncFirebaseUserToDatabase } from '../services/firebase-admin.service'
import { sendVerificationCodeSMS } from '../services/sms-notifications.service'
import { randomBytes } from 'crypto'

export const registerWithFirebase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { firstName, lastName, phone } = req.body
    const firebaseUid = req.user?.uid
    const email = req.user?.email

    if (!firebaseUid || !email || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    console.log('[v0] Firebase registration for:', email)

    // Check if user already exists
    const existingUser = await userService.findByEmail(email)
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Sync Firebase user to database
    const firebaseData = await syncFirebaseUserToDatabase(firebaseUid, email, phone)

    // Create user in database
    const user = await userService.createUser({
      email,
      firstName,
      lastName,
      phone,
      role: 'CUSTOMER',
      authProvider: 'FIREBASE',
      firebaseUid,
      isEmailVerified: firebaseData.isEmailVerified,
    })

    console.log('[v0] Firebase user created in database:', user.id)

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your phone number.',
      user: {
        id: user.id,
        firebaseUid,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
      },
    })
  } catch (error: any) {
    console.error('[Firebase Register Error]', error.message)
    res.status(500).json({ error: 'Registration failed' })
  }
}

export const sendPhoneVerificationCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phone } = req.body
    const firebaseUid = req.user?.uid

    if (!phone || !firebaseUid) {
      return res.status(400).json({ error: 'Phone number and authentication required' })
    }

    // Find user by Firebase UID
    const user = await userService.findByFirebaseUid(firebaseUid)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Update user with verification code
    await userService.updateUser(user.id, {
      phoneVerificationCode: verificationCode,
      phoneVerificationCodeExpires: codeExpires,
      phone,
    })

    // Send verification code via SMS
    try {
      await sendVerificationCodeSMS(phone, verificationCode)
      console.log('[v0] Verification code sent to:', phone)
    } catch (smsError) {
      console.error('[v0] Failed to send verification SMS:', smsError)
      return res.status(500).json({ error: 'Failed to send verification code' })
    }

    res.json({
      success: true,
      message: 'Verification code sent to your phone',
    })
  } catch (error: any) {
    console.error('[Phone Verification Error]', error.message)
    res.status(500).json({ error: 'Failed to send verification code' })
  }
}

export const verifyPhoneNumber = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { verificationCode } = req.body
    const firebaseUid = req.user?.uid

    if (!verificationCode || !firebaseUid) {
      return res.status(400).json({ error: 'Verification code and authentication required' })
    }

    // Find user by Firebase UID
    const user = await userService.findByFirebaseUid(firebaseUid)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if code is expired
    if (!user.phoneVerificationCodeExpires || new Date() > user.phoneVerificationCodeExpires) {
      return res.status(400).json({
        error: 'Verification code has expired',
        codeExpired: true,
      })
    }

    // Check if code matches
    if (user.phoneVerificationCode !== verificationCode) {
      // Increment attempts
      const newAttempts = (user.phoneVerificationAttempts || 0) + 1
      await userService.updateUser(user.id, {
        phoneVerificationAttempts: newAttempts,
      })

      if (newAttempts >= 5) {
        return res.status(400).json({
          error: 'Too many failed attempts. Please request a new code.',
          attemptsExceeded: true,
        })
      }

      return res.status(400).json({
        error: 'Invalid verification code',
        attemptsRemaining: 5 - newAttempts,
      })
    }

    // Mark phone as verified
    const verifiedUser = await userService.updateUser(user.id, {
      isPhoneVerified: true,
      phoneVerificationCode: null,
      phoneVerificationCodeExpires: null,
      phoneVerificationAttempts: 0,
    })

    console.log('[v0] Phone verified for user:', user.id)

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        phone: verifiedUser.phone,
        isPhoneVerified: verifiedUser.isPhoneVerified,
      },
    })
  } catch (error: any) {
    console.error('[Phone Verification Error]', error.message)
    res.status(500).json({ error: 'Phone verification failed' })
  }
}

export const resendPhoneVerificationCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const firebaseUid = req.user?.uid

    if (!firebaseUid) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Find user
    const user = await userService.findByFirebaseUid(firebaseUid)
    if (!user || !user.phone) {
      return res.status(404).json({ error: 'User or phone not found' })
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000)

    // Update user
    await userService.updateUser(user.id, {
      phoneVerificationCode: verificationCode,
      phoneVerificationCodeExpires: codeExpires,
      phoneVerificationAttempts: 0,
    })

    // Send SMS
    try {
      await sendVerificationCodeSMS(user.phone, verificationCode)
      console.log('[v0] New verification code sent to:', user.phone)
    } catch (smsError) {
      console.error('[v0] Failed to send verification SMS:', smsError)
      return res.status(500).json({ error: 'Failed to send verification code' })
    }

    res.json({
      success: true,
      message: 'Verification code resent',
    })
  } catch (error: any) {
    console.error('[Resend Verification Error]', error.message)
    res.status(500).json({ error: 'Failed to resend verification code' })
  }
}
