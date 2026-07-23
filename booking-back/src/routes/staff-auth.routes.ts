import { Router, Request, Response } from 'express'
import { staffAuthService } from '../services/staff-auth.service'
import { staffVerificationService } from '../services/staff-verification.service'
import  prisma  from '../lib/prisma'

const router = Router()

interface AuthRequest extends Request {
  staffId?: string
  user?: any
}

/**
 * @route POST /api/staff-auth/login
 * @desc Login staff with email and password
 * @access Public
 */
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const result = await staffAuthService.login(email, password)

    // Set JWT token in httpOnly cookie
    res.cookie('staffAuthToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    res.json({
      success: true,
      token: result.token,
      staff: result.staff,
    })
  } catch (error: any) {
    console.error('[Staff Auth] Login error:', error.message)
    res.status(401).json({ error: error.message || 'Login failed' })
  }
})

/**
 * @route POST /api/staff-auth/set-password
 * @desc Set password after email verification
 * @access Public (requires valid verification)
 */
router.post('/set-password', async (req: AuthRequest, res: Response) => {
  try {
    const { staffId, verificationToken, password, passwordConfirm } = req.body

    if (!staffId || !verificationToken || !password) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ error: 'Passwords do not match' })
    }

    // Verify the token is valid
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { verificationToken: true, emailVerified: true },
    })

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' })
    }

    if (staff.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' })
    }

    if (staff.verificationToken !== verificationToken) {
      return res.status(400).json({ error: 'Invalid verification token' })
    }

    // Set password
    const updatedStaff = await staffAuthService.setPassword(staffId, password)

    // Clear verification token
    await prisma.staff.update({
      where: { id: staffId },
      data: {
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    })

    // Generate login token
    const loginToken = staffAuthService.generateToken({
      staffId: updatedStaff.id,
      email: updatedStaff.email,
      businessId: updatedStaff.businessId,
    })

    // Set JWT token in httpOnly cookie
    res.cookie('staffAuthToken', loginToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    res.json({
      success: true,
      token: loginToken,
      message: 'Password set successfully. You are now logged in.',
      staff: {
        id: updatedStaff.id,
        email: updatedStaff.email,
        firstName: updatedStaff.firstName,
      },
    })
  } catch (error: any) {
    console.error('[Staff Auth] Set password error:', error.message)
    res.status(400).json({ error: error.message || 'Failed to set password' })
  }
})

/**
 * @route POST /api/staff-auth/logout
 * @desc Logout staff
 * @access Private
 */
router.post('/logout', (req: AuthRequest, res: Response) => {
  res.clearCookie('staffAuthToken')
  res.json({ success: true, message: 'Logged out successfully' })
})

/**
 * @route POST /api/staff-auth/request-password-reset
 * @desc Request password reset email
 * @access Public
 */
router.post('/request-password-reset', async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    await staffAuthService.requestPasswordReset(email)

    res.json({
      success: true,
      message: 'If an account exists, a reset link has been sent to the email',
    })
  } catch (error: any) {
    console.error('[Staff Auth] Password reset request error:', error.message)
    res.status(400).json({ error: error.message || 'Failed to request password reset' })
  }
})

/**
 * @route POST /api/staff-auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', async (req: AuthRequest, res: Response) => {
  try {
    const { resetToken, password, passwordConfirm } = req.body

    if (!resetToken || !password) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ error: 'Passwords do not match' })
    }

    const staff = await staffAuthService.resetPassword(resetToken, password)

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
      staff: {
        id: staff.id,
        email: staff.email,
      },
    })
  } catch (error: any) {
    console.error('[Staff Auth] Password reset error:', error.message)
    res.status(400).json({ error: error.message || 'Failed to reset password' })
  }
})

/**
 * @route GET /api/staff-auth/verify
 * @desc Verify staff token
 * @access Private
 */
router.get('/verify', async (req: AuthRequest, res: Response) => {
  try {
    const token = req.cookies.staffAuthToken || req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = staffAuthService.verifyToken(token)

    // Get latest staff info
    const staff = await prisma.staff.findUnique({
      where: { id: decoded.staffId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        businessId: true,
      },
    })

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' })
    }

    res.json({
      success: true,
      staff,
    })
  } catch (error: any) {
    console.error('[Staff Auth] Verification error:', error.message)
    res.status(401).json({ error: error.message || 'Token verification failed' })
  }
})

export default router
