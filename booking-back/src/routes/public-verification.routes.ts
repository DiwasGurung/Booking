import express, { Request, Response, NextFunction } from 'express'
import VerificationController from '../controllers/phone-verification.controller'
// import { publicRateLimit } from '../middleware/rate-limit.middleware' // recommended, see note below

const publicRouter = express.Router()

// PUBLIC — a customer fills these out mid-booking, before any session exists.
// Do NOT add the `auth` middleware here the way verification.routes.ts does.
//
// entityType is hardcoded to BOOKING so this router can never be used to
// probe/verify USER, STAFF, or BUSINESS records without authentication.
//
// Strongly recommended: add an IP-based rate limiter in front of both routes
// (e.g. 5 requests / 10 min per IP) — the cooldown + attempt cap in the
// service stop one phone number from being spammed, but nothing here yet
// stops someone hitting many different bookingIds from the same IP.

function forceBookingEntityType(req: Request, _res: Response, next: NextFunction) {
  req.params.entityType = 'BOOKING'
  next()
}

publicRouter.post('/bookings/:entityId/send-phone-verification', forceBookingEntityType, VerificationController.sendCode)
publicRouter.post('/bookings/:entityId/verify-phone', forceBookingEntityType, VerificationController.verifyCode)

export default publicRouter