import express, { Request, Response, NextFunction } from 'express'
import { auth } from '../middleware/auth.middleware'
import  prisma  from '../lib/prisma'
import VerificationController from '../controllers/phone-verification.controller'

interface AuthRequest extends Request {
  userId?: string
  userRole?: string
}

const phoneVerificationRouter = express.Router()

phoneVerificationRouter.use(auth)

/**
 * Makes sure the logged-in user is only ever verifying THEIR OWN record:
 *  - USER      → entityId must equal the caller's own id
 *  - BUSINESS  → the business must belong to the caller
 *  - STAFF     → the staff member's business must belong to the caller
 * (ADMIN can be given a blanket bypass here if you want support staff
 * to trigger re-verification on a user's behalf.)
 */
async function authorizeEntity(req: AuthRequest, res: Response, next: NextFunction) {
  const entityTypeParam = Array.isArray(req.params.entityType) ? req.params.entityType[0] : req.params.entityType
  const entityId = Array.isArray(req.params.entityId) ? req.params.entityId[0] : req.params.entityId
  const userId = req.userId

  if (req.userRole === 'ADMIN') return next()

  try {
    switch (entityTypeParam.toUpperCase()) {
      case 'USER': {
        if (entityId !== userId) return res.status(403).json({ success: false, error: 'Forbidden' })
        return next()
      }
      case 'BUSINESS': {
        const business = await prisma.business.findUnique({ where: { id: entityId } })
        if (!business || business.userId !== userId) return res.status(403).json({ success: false, error: 'Forbidden' })
        return next()
      }
      case 'STAFF': {
        const staff = await prisma.staff.findUnique({ where: { id: entityId }, include: { business: true } })
        if (!staff) return res.status(404).json({ success: false, error: 'Not found' })
        if (staff.business.userId !== userId) return res.status(403).json({ success: false, error: 'Forbidden' })
        return next()
      }
      default:
        return res.status(400).json({ success: false, error: 'Unsupported entity type for this route' })
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Authorization check failed' })
  }
}

phoneVerificationRouter.post('/:entityType/:entityId/send-code', authorizeEntity, VerificationController.sendCode)
phoneVerificationRouter.post('/:entityType/:entityId/verify', authorizeEntity, VerificationController.verifyCode)

export default phoneVerificationRouter