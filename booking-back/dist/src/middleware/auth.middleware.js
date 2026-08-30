"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.optionalAuth = exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
// Middleware to verify JWT token (strict auth)
const auth = (req, res, next) => {
    try {
        const token = req.cookies.authToken || req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            console.warn('[Auth] No token found in cookies or headers');
            return res.status(401).json({ error: 'No authentication token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('[Auth] Token verification failed:', error.message);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.auth = auth;
// Middleware for optional auth (doesn't block if no token)
const optionalAuth = (req, res, next) => {
    try {
        const token = req.cookies.authToken || req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.userId = decoded.userId;
            req.user = decoded;
        }
        next();
    }
    catch (error) {
        console.warn('[Optional Auth] Token verification failed, proceeding without auth');
        next();
    }
};
exports.optionalAuth = optionalAuth;
// Middleware to ensure user is authenticated
const requireAuth = (req, res, next) => {
    if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};
exports.requireAuth = requireAuth;
