import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface StaffAuthRequest extends Request {
  staffId?: string
  staff?: any
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

/**
 * Middleware to verify staff JWT token (strict auth)
 */
export const staffAuth = (req: StaffAuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.staffAuthToken || req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      console.warn('[Staff Auth Middleware] No token found in cookies or headers')
      return res.status(401).json({ error: 'No authentication token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    req.staffId = decoded.staffId
    req.staff = decoded
    next()
  } catch (error: any) {
    console.error('[Staff Auth Middleware] Token verification failed:', error.message)
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

/**
 * Middleware for optional staff auth (doesn't block if no token)
 */
export const optionalStaffAuth = (req: StaffAuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.staffAuthToken || req.headers.authorization?.replace('Bearer ', '')

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      req.staffId = decoded.staffId
      req.staff = decoded
    }
    next()
  } catch (error: any) {
    console.warn('[Optional Staff Auth Middleware] Token verification failed, proceeding without auth')
    next()
  }
}
