"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalStaffAuth = exports.staffAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
/**
 * Middleware to verify staff JWT token (strict auth)
 */
const staffAuth = (req, res, next) => {
    try {
        const token = req.cookies.staffAuthToken || req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            console.warn('[Staff Auth Middleware] No token found in cookies or headers');
            return res.status(401).json({ error: 'No authentication token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.staffId = decoded.staffId;
        req.staff = decoded;
        console.log('[Staff Auth Middleware] Token verified for staff:', req.staffId);
        next();
    }
    catch (error) {
        console.error('[Staff Auth Middleware] Token verification failed:', error.message);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.staffAuth = staffAuth;
/**
 * Middleware for optional staff auth (doesn't block if no token)
 */
const optionalStaffAuth = (req, res, next) => {
    try {
        const token = req.cookies.staffAuthToken || req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.staffId = decoded.staffId;
            req.staff = decoded;
            console.log('[Optional Staff Auth Middleware] Token verified for staff:', req.staffId);
        }
        next();
    }
    catch (error) {
        console.warn('[Optional Staff Auth Middleware] Token verification failed, proceeding without auth');
        next();
    }
};
exports.optionalStaffAuth = optionalStaffAuth;
