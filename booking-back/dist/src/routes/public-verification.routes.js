"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const phone_verification_controller_1 = __importDefault(require("../controllers/phone-verification.controller"));
// import { publicRateLimit } from '../middleware/rate-limit.middleware' // recommended, see note below
const publicRouter = express_1.default.Router();
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
function forceBookingEntityType(req, _res, next) {
    req.params.entityType = 'BOOKING';
    next();
}
publicRouter.post('/bookings/:entityId/send-phone-verification', forceBookingEntityType, phone_verification_controller_1.default.sendCode);
publicRouter.post('/bookings/:entityId/verify-phone', forceBookingEntityType, phone_verification_controller_1.default.verifyCode);
exports.default = publicRouter;
