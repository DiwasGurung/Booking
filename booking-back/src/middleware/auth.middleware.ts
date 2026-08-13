import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: string
  user?: any
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Middleware to verify JWT token (strict auth)
export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    
    const token = req.cookies.authToken || req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      console.warn('[Auth] No token found in cookies or headers')
      return res.status(401).json({ error: 'No authentication token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    req.userId = decoded.userId
    req.user = decoded
    next()
  } catch (error: any) {
    console.error('[Auth] Token verification failed:', error.message)
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Middleware for optional auth (doesn't block if no token)
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.authToken || req.headers.authorization?.replace('Bearer ', '')

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      req.userId = decoded.userId
      req.user = decoded
    }
    next()
  } catch (error: any) {
    console.warn('[Optional Auth] Token verification failed, proceeding without auth')
    next()
  }
}

// Middleware to ensure user is authenticated
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  next()
}


