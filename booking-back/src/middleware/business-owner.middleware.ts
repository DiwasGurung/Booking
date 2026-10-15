import { Request, Response, NextFunction } from 'express'
import prisma from '../lib/prisma'

/** Allows the request only if the logged-in user owns the business in :businessId or :id. */
export async function requireBusinessOwner(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.userId
    const businessId = (req.params.businessId ?? req.params.id) as string | undefined
    if (!userId) return res.status(401).json({ message: 'Not authenticated' })
    if (!businessId) return res.status(400).json({ message: 'Business id is required' })

    const owned = await prisma.business.findFirst({
      where: { id: businessId, userId },
      select: { id: true },
    })
    if (!owned) return res.status(403).json({ message: 'Forbidden' })
    next()
  } catch (error) {
    console.error('[requireBusinessOwner] error:', error)
    res.status(500).json({ message: 'Authorization check failed' })
  }
}