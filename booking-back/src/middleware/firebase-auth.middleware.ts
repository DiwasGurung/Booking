import { Request, Response, NextFunction } from 'express'
import { getAuth } from 'firebase-admin/auth'
import { initializeAdmin } from '../services/firebase-admin.service'

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string
    email: string
    phoneNumber?: string
  }
}

export async function verifyFirebaseToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1]

    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' })
    }

    // Initialize Firebase Admin
    const firebaseAdmin = initializeAdmin()
    const auth = getAuth(firebaseAdmin)

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token)
    
    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      phoneNumber: decodedToken.phone_number,
    }

    console.log('[v0] Firebase token verified for user:', decodedToken.uid)
    next()
  } catch (error) {
    console.error('[v0] Firebase token verification failed:', error)
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}