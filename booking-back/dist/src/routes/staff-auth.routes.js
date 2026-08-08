"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const staff_auth_service_1 = require("../services/staff-auth.service");
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = (0, express_1.Router)();
/**
 * @route POST /api/staff-auth/login
 * @desc Login staff with email and password
 * @access Public
 */
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const result = yield staff_auth_service_1.staffAuthService.login(email, password);
        // Set JWT token in httpOnly cookie
        res.cookie('staffAuthToken', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.json({
            success: true,
            token: result.token,
            staff: result.staff,
        });
    }
    catch (error) {
        console.error('[Staff Auth] Login error:', error.message);
        res.status(401).json({ error: error.message || 'Login failed' });
    }
}));
/**
 * @route POST /api/staff-auth/set-password
 * @desc Set password after email verification
 * @access Public (requires valid verification)
 */
router.post('/set-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { staffId, verificationToken, password, passwordConfirm } = req.body;
        if (!staffId || !verificationToken || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        if (password !== passwordConfirm) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }
        // Verify the token is valid
        const staff = yield prisma_1.default.staff.findUnique({
            where: { id: staffId },
            select: {
                verificationToken: true,
                verificationTokenExpiresAt: true,
                emailVerified: true,
            },
        });
        if (!staff) {
            return res.status(404).json({ error: 'Staff member not found' });
        }
        if (staff.verificationToken !== verificationToken) {
            return res.status(400).json({ error: 'Invalid verification token' });
        }
        if (!staff.verificationTokenExpiresAt || staff.verificationTokenExpiresAt <= new Date()) {
            return res.status(400).json({ error: 'Verification token expired. Please request a new email.' });
        }
        // Email verification and password setup are two steps. The verification
        // page marks the email verified; this endpoint consumes the still-valid
        // token to authorize the initial password creation.
        // Set password
        const updatedStaff = yield staff_auth_service_1.staffAuthService.setPassword(staffId, password);
        // Clear verification token
        yield prisma_1.default.staff.update({
            where: { id: staffId },
            data: {
                verificationToken: null,
                verificationTokenExpiresAt: null,
            },
        });
        // Generate login token
        const loginToken = staff_auth_service_1.staffAuthService.generateToken({
            staffId: updatedStaff.id,
            email: updatedStaff.email,
            businessId: updatedStaff.businessId,
        });
        // Set JWT token in httpOnly cookie
        res.cookie('staffAuthToken', loginToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.json({
            success: true,
            token: loginToken,
            message: 'Password set successfully. You are now logged in.',
            staff: {
                id: updatedStaff.id,
                email: updatedStaff.email,
                firstName: updatedStaff.firstName,
            },
        });
    }
    catch (error) {
        console.error('[Staff Auth] Set password error:', error.message);
        res.status(400).json({ error: error.message || 'Failed to set password' });
    }
}));
/**
 * @route POST /api/staff-auth/logout
 * @desc Logout staff
 * @access Private
 */
router.post('/logout', (req, res) => {
    res.clearCookie('staffAuthToken');
    res.json({ success: true, message: 'Logged out successfully' });
});
/**
 * @route POST /api/staff-auth/request-password-reset
 * @desc Request password reset email
 * @access Public
 */
router.post('/request-password-reset', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        yield staff_auth_service_1.staffAuthService.requestPasswordReset(email);
        res.json({
            success: true,
            message: 'If an account exists, a reset link has been sent to the email',
        });
    }
    catch (error) {
        console.error('[Staff Auth] Password reset request error:', error.message);
        res.status(400).json({ error: error.message || 'Failed to request password reset' });
    }
}));
/**
 * @route POST /api/staff-auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { resetToken, password, passwordConfirm } = req.body;
        if (!resetToken || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        if (password !== passwordConfirm) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }
        const staff = yield staff_auth_service_1.staffAuthService.resetPassword(resetToken, password);
        res.json({
            success: true,
            message: 'Password reset successfully. You can now login with your new password.',
            staff: {
                id: staff.id,
                email: staff.email,
            },
        });
    }
    catch (error) {
        console.error('[Staff Auth] Password reset error:', error.message);
        res.status(400).json({ error: error.message || 'Failed to reset password' });
    }
}));
/**
 * @route GET /api/staff-auth/verify
 * @desc Verify staff token
 * @access Private
 */
router.get('/verify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = req.cookies.staffAuthToken || ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', ''));
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = staff_auth_service_1.staffAuthService.verifyToken(token);
        // Get latest staff info
        const staff = yield prisma_1.default.staff.findUnique({
            where: { id: decoded.staffId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
                businessId: true,
                staffCode: true,
            },
        });
        if (!staff) {
            return res.status(404).json({ error: 'Staff member not found' });
        }
        res.json({
            success: true,
            staff,
        });
    }
    catch (error) {
        console.error('[Staff Auth] Verification error:', error.message);
        res.status(401).json({ error: error.message || 'Token verification failed' });
    }
}));
exports.default = router;
