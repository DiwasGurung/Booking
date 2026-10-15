"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireBusinessOwner = requireBusinessOwner;
const prisma_1 = __importDefault(require("../lib/prisma"));
/** Allows the request only if the logged-in user owns the business in :businessId or :id. */
async function requireBusinessOwner(req, res, next) {
    try {
        const userId = req.userId;
        const businessId = (req.params.businessId ?? req.params.id);
        if (!userId)
            return res.status(401).json({ message: 'Not authenticated' });
        if (!businessId)
            return res.status(400).json({ message: 'Business id is required' });
        const owned = await prisma_1.default.business.findFirst({
            where: { id: businessId, userId },
            select: { id: true },
        });
        if (!owned)
            return res.status(403).json({ message: 'Forbidden' });
        next();
    }
    catch (error) {
        console.error('[requireBusinessOwner] error:', error);
        res.status(500).json({ message: 'Authorization check failed' });
    }
}
