"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const prisma_1 = __importDefault(require("../lib/prisma"));
const phone_verification_controller_1 = __importDefault(require("../controllers/phone-verification.controller"));
const phoneVerificationRouter = express_1.default.Router();
phoneVerificationRouter.use(auth_middleware_1.auth);
/**
 * Makes sure the logged-in user is only ever verifying THEIR OWN record:
 *  - USER      → entityId must equal the caller's own id
 *  - BUSINESS  → the business must belong to the caller
 *  - STAFF     → the staff member's business must belong to the caller
 * (ADMIN can be given a blanket bypass here if you want support staff
 * to trigger re-verification on a user's behalf.)
 */
async function authorizeEntity(req, res, next) {
    const entityTypeParam = Array.isArray(req.params.entityType) ? req.params.entityType[0] : req.params.entityType;
    const entityId = Array.isArray(req.params.entityId) ? req.params.entityId[0] : req.params.entityId;
    const userId = req.userId;
    if (req.userRole === 'ADMIN')
        return next();
    try {
        switch (entityTypeParam.toUpperCase()) {
            case 'USER': {
                if (entityId !== userId)
                    return res.status(403).json({ success: false, error: 'Forbidden' });
                return next();
            }
            case 'BUSINESS': {
                const business = await prisma_1.default.business.findUnique({ where: { id: entityId } });
                if (!business || business.userId !== userId)
                    return res.status(403).json({ success: false, error: 'Forbidden' });
                return next();
            }
            case 'STAFF': {
                const staff = await prisma_1.default.staff.findUnique({ where: { id: entityId }, include: { business: true } });
                if (!staff)
                    return res.status(404).json({ success: false, error: 'Not found' });
                if (staff.business.userId !== userId)
                    return res.status(403).json({ success: false, error: 'Forbidden' });
                return next();
            }
            default:
                return res.status(400).json({ success: false, error: 'Unsupported entity type for this route' });
        }
    }
    catch (err) {
        return res.status(500).json({ success: false, error: 'Authorization check failed' });
    }
}
phoneVerificationRouter.post('/:entityType/:entityId/send-code', authorizeEntity, phone_verification_controller_1.default.sendCode);
phoneVerificationRouter.post('/:entityType/:entityId/verify', authorizeEntity, phone_verification_controller_1.default.verifyCode);
exports.default = phoneVerificationRouter;
