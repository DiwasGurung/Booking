import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { emailService } from '../services/email.service'

export const submitFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { type, message, name, email, businessName, page } = req.body

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide a bit more detail.' })
    }
    if (!['bug', 'feature', 'other'].includes(type)) {
      return res.status(400).json({ error: 'Invalid feedback type.' })
    }

    const decoded = req.user // raw JWT payload, set by optionalAuth if a valid token was present

    // ASSUMPTION: staff tokens carry `staffId` (and no `userId`), while
    // business owner / customer tokens carry `userId` + `role`.
    // Adjust this branch if your staff login controller signs the token differently.
    let role: 'business_owner' | 'customer' | 'staff' | 'visitor' = 'visitor'
    let resolvedName: string | undefined
    let resolvedEmail: string | undefined
    let businessId: string | undefined

    if (decoded?.staffId) {
      role = 'staff'
      resolvedName = decoded.name
      resolvedEmail = decoded.email
      businessId = decoded.businessId
    } else if (decoded?.userId) {
      role = decoded.role === 'BUSINESS_OWNER' ? 'business_owner' : 'customer'
      resolvedName = decoded.name
      resolvedEmail = decoded.email
      businessId = decoded.businessId
    }

    // Fall back to client-supplied name/email for anonymous visitors,
    // or in case the token payload doesn't include name/email at all.
    resolvedName = resolvedName || name || undefined
    resolvedEmail = resolvedEmail || email || undefined

    // Optional: persist to DB
    // await Feedback.create({
    //   userId: decoded?.userId,
    //   staffId: decoded?.staffId,
    //   businessId,
    //   name: resolvedName,
    //   email: resolvedEmail,
    //   type,
    //   message: message.trim(),
    //   page,
    //   businessName,
    //   role,
    // })

    await emailService.sendFeedbackEmail({
      name: resolvedName,
      email: resolvedEmail,
      type,
      message: message.trim(),
      page,
      businessName,
      role: role as any,
    })

    return res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('[Feedback Controller] Failed:', error.message)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}