import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { userService } from '../services/user.service'
import { generateToken, generateCookie, hashPassword, comparePassword } from '../utils/auth'
import { emailService } from '../services/email.service'
import { randomBytes } from 'crypto'

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' })
    }


    // Check if user already exists
    const existingUser = await userService.findByEmail(email)
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Create user with verification code
    const user = await userService.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: role || 'CUSTOMER',
      authProvider: 'EMAIL',
      emailVerificationCode: verificationCode,
      emailVerificationCodeExpires: codeExpires,
    })

    // Send verification email with code
    try {
      await emailService.sendVerificationEmail(email, verificationCode)
      console.log('[v0] Verification code sent to:', email)
    } catch (emailError) {
      console.error('[v0] Failed to send verification email:', emailError)
      // Don't fail registration if email send fails, but log it
    }

    // Do NOT generate auth token yet - user must verify email first
    res.status(201).json({
      success: true,
      emailVerificationSent: true,
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        name: `${user.firstName} ${user.lastName}`,
      },
    })
  } catch (error: any) {
    console.error('[Register Error]', error.message)
    res.status(500).json({ error: 'Registration failed' })
  }
}

export const loginUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

 

    const user = await userService.findByEmail(email)
    if (!user) {
    
      return res.status(401).json({ error: 'Email not found.' })
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in',
        emailNotVerified: true,
        email: user.email
      })
    }

    console.log('[Login] User found:', user.id)

    if (!user.password) {
      console.log('[Login] User has no password (Google login)')
      return res.status(401).json({ error: 'User registered with Google. Please use Google sign-in' })
    }

    console.log('[Login] Comparing password...')
    const isPasswordValid = await comparePassword(password, user.password)
 
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' })
    }

    const token = generateToken(user.id)
    console.log('[Login] Setting auth cookie with token:', token.substring(0, 20) + '...')
    res.cookie('authToken', token, generateCookie(token))
    // Also set user role in cookie for middleware to read
    res.cookie('userRole', user.role, {
      httpOnly: false, // Must be accessible to middleware
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    })
    console.log('[Login] Cookie options:', generateCookie(token))

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        business: user.business,
        name: `${user.firstName} ${user.lastName}`,
      },
    })
  } catch (error: any) {
    console.error('[Login Error]', error.message)
    res.status(500).json({ error: 'Invalid email or password.' })
  }
}
export const requestPasswordReset = async (req: AuthRequest, res: Response) => {
  const message = 'If an account exists, a reset link has been sent to the email'
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    if (!email) return res.status(400).json({ error: 'Email is required' })
    await userService.requestPasswordReset(email)
    return res.json({ success: true, message })
  } catch (error) {
    console.error('[User Auth] Password reset request failed:', error)
    return res.json({ success: true, message })
  }
}

export const resetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { resetToken, password, passwordConfirm } = req.body
    if (!resetToken || !password || password !== passwordConfirm) {
      return res.status(400).json({ error: 'Valid token and matching passwords are required' })
    }
    await userService.resetPassword(resetToken, password)
    return res.json({ success: true, message: 'Password reset successfully' })
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to reset password' })
  }
}

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId
    const { role } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' })
    }

    if (!role || !['CUSTOMER', 'BUSINESS_OWNER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    const normalizedRole = role as 'CUSTOMER' | 'BUSINESS_OWNER'

    console.log('[Update Role] Updating user:', userId, 'to role:', normalizedRole)

    const user = await userService.updateUserRole(userId, normalizedRole)

    res.json({
      success: true,
      user: {
        id: user.id,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error('[Update Role Error]', error.message)
    res.status(500).json({ error: 'Failed to update role' })
  }
}

export const logoutUser = async (req: AuthRequest, res: Response) => {
  try {
    console.log('[Logout] User logged out:', req.userId)

    res.clearCookie('authToken')
    res.json({ success: true, message: 'Logged out successfully' })
  } catch (error: any) {
    console.error('[Logout Error]', error.message)
    res.status(500).json({ error: 'Logout failed' })
  }
}

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!req.userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' })
    }

    console.log('[Change Password] User:', req.userId)

    const user = await userService.findById(req.userId)
    if (!user || !user.password) {
      return res.status(400).json({ error: 'User not found or has no password' })
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    const hashedPassword = await hashPassword(newPassword)
    const updatedUser = await userService.updatePassword(req.userId, hashedPassword)

    res.json({
      success: true,
      message: 'Password changed successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
      },
    })
  } catch (error: any) {
    console.error('[Change Password Error]', error.message)
    res.status(500).json({ error: 'Failed to change password' })
  }
}

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone } = req.body

    if (!req.userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    console.log('[Update Profile] User:', req.userId)

    const user = await userService.updateUser(req.userId, {
      firstName,
      lastName,
      phone,
    })

    res.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    })
  } catch (error: any) {
    console.error('[Update Profile Error]', error.message)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    console.log('[Get Current User] User:', req.userId)

    const user = await userService.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        googleId: user.googleId,
        authProvider: user.authProvider,
        business: user.business,
        isEmailVerified: user.isEmailVerified,
        name: `${user.firstName} ${user.lastName}`,
      },
    })
  } catch (error: any) {
    console.error('[Get Current User Error]', error.message)
    res.status(500).json({ error: 'Failed to get user' })
  }
}

/**
 * Verify user email using code
 */
export const verifyEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { email, code } = req.body

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code required' })
    }

    console.log('[Verify Email] Processing verification code for:', email)

    // Find user by email
    const user = await userService.findByEmail(email)
    if (!user) {
      console.error('[Verify Email] User not found:', email)
      return res.status(400).json({ error: 'User not found' })
    }

    console.log('[Verify Email] User found:', user.id)

    // Check if already verified
    if (user.isEmailVerified) {
      console.log('[Verify Email] Email already verified:', email)
      return res.status(400).json({ error: 'Email is already verified' })
    }

    // Check if code matches
    if (user.emailVerificationCode !== code) {
      console.log('[Verify Email] Code mismatch for user:', user.id)
      // Increment failed attempts
      const attempts = (user.emailVerificationAttempts || 0) + 1
      try {
        await userService.updateUser(user.id, {
          emailVerificationAttempts: attempts,
        })
      } catch (updateError) {
        console.error('[Verify Email] Failed to update attempt count:', updateError)
        // Continue even if update fails
      }

      // Lock account after 5 failed attempts
      if (attempts >= 5) {
        return res.status(400).json({ 
          error: 'Too many failed attempts. Please request a new code.',
          attemptsExceeded: true
        })
      }

      return res.status(400).json({ 
        error: 'Invalid verification code',
        attemptsRemaining: 5 - attempts
      })
    }

    // Check if code has expired
    if (user.emailVerificationCodeExpires && user.emailVerificationCodeExpires < new Date()) {
      console.log('[Verify Email] Code expired for user:', user.id)
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' })
    }

    console.log('[Verify Email] Updating user as verified:', user.id)

    // Update user as verified
    const verifiedUser = await userService.updateUser(user.id, {
      isEmailVerified: true,
      emailVerificationCode: null,
      emailVerificationCodeExpires: null,
      emailVerificationAttempts: 0,
    })

    console.log('[v0] Email verified for user:', email, 'ID:', user.id)

    // Generate auth token now that email is verified
    const token = generateToken(verifiedUser.id)

    // Set auth cookies so the user is automatically logged in after verification
    res.cookie('authToken', token, generateCookie(token))
    res.cookie('userRole', verifiedUser.role, {
      httpOnly: false, // Must be accessible to middleware
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    })

    res.json({
      success: true,
      token,
      message: 'Email verified successfully.',
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        firstName: verifiedUser.firstName,
        lastName: verifiedUser.lastName,
        role: verifiedUser.role,
        isEmailVerified: verifiedUser.isEmailVerified,
      },
    })
  } catch (error: any) {
    console.error('[Verify Email Error]', error.message)
    console.error('[Verify Email Error Stack]', error.stack)
    res.status(500).json({ error: 'Failed to verify email' })
  }
}

/**
 * Resend verification code
 */
export const resendVerificationEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email required' })
    }

    console.log('[Resend Verification Code] Processing for email:', email)

    const user = await userService.findByEmail(email)
    if (!user) {
      console.error('[Resend Verification] User not found:', email)
      return res.status(404).json({ error: 'User not found' })
    }

    console.log('[Resend Verification] User found:', user.id)

    // If already verified, no need to resend
    if (user.isEmailVerified) {
      console.log('[Resend Verification] Email already verified:', email)
      return res.status(400).json({ error: 'Email is already verified' })
    }

    // Generate new 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    console.log('[Resend Verification] Generated new code for user:', user.id)

    // Update user with new code and reset attempts
    try {
      await userService.updateUser(user.id, {
        emailVerificationCode: verificationCode,
        emailVerificationCodeExpires: codeExpires,
        emailVerificationAttempts: 0,
      })
      console.log('[Resend Verification] Updated user code in database')
    } catch (dbError) {
      console.error('[Resend Verification] Failed to update code in database:', dbError)
      throw dbError
    }

    // Send verification email with code
    try {
      await emailService.sendVerificationEmail(email, verificationCode)
      console.log('[v0] Verification code resent to:', email)
    } catch (emailError) {
      console.error('[v0] Failed to send verification email:', emailError)
      return res.status(500).json({ error: 'Failed to send verification code' })
    }

    res.json({
      success: true,
      message: 'Verification code sent. Please check your inbox.',
    })
  } catch (error: any) {
    console.error('[Resend Verification Code Error]', error.message)
    console.error('[Resend Verification Code Error Stack]', error.stack)
    res.status(500).json({ error: 'Failed to resend verification code' })
  }
}
