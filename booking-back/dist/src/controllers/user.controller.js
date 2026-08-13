"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendVerificationEmail = exports.verifyEmail = exports.getCurrentUser = exports.updateProfile = exports.changePassword = exports.logoutUser = exports.updateUserRole = exports.resetPassword = exports.requestPasswordReset = exports.loginUser = exports.createUser = void 0;
const user_service_js_1 = require("../services/user.service.js");
const auth_js_1 = require("../utils/auth.js");
const email_service_js_1 = require("../services/email.service.js");
const createUser = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, role } = req.body;
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Check if user already exists
        const existingUser = await user_service_js_1.userService.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        // Hash password
        const hashedPassword = await (0, auth_js_1.hashPassword)(password);
        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const codeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        // Create user with verification code
        const user = await user_service_js_1.userService.createUser({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone,
            role: role || 'CUSTOMER',
            authProvider: 'EMAIL',
            emailVerificationCode: verificationCode,
            emailVerificationCodeExpires: codeExpires,
        });
        // Send verification email with code
        try {
            await email_service_js_1.emailService.sendVerificationEmail(email, verificationCode);
        }
        catch (emailError) {
            console.error('[v0] Failed to send verification email:', emailError);
            // Don't fail registration if email send fails, but log it
        }
        // Do NOT generate auth token yet - user must verify email first
        res.status(201).json({
            success: true,
            emailVerificationSent: true,
            message: 'Registration successful. Please check your email to verify your account.',
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                name: `${user.firstName} ${user.lastName}`,
            },
        });
    }
    catch (error) {
        console.error('[Register Error]', error.message);
        res.status(500).json({ error: 'Registration failed' });
    }
};
exports.createUser = createUser;
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        const user = await user_service_js_1.userService.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Email not found.' });
        }
        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(403).json({
                error: 'Please verify your email before logging in',
                emailNotVerified: true,
                email: user.email
            });
        }
        if (!user.password) {
            return res.status(401).json({ error: 'User registered with Google. Please use Google sign-in' });
        }
        const isPasswordValid = await (0, auth_js_1.comparePassword)(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        const token = (0, auth_js_1.generateToken)(user.id);
        res.cookie('authToken', token, (0, auth_js_1.generateCookie)(token));
        // Also set user role in cookie for middleware to read
        res.cookie('userRole', user.role, {
            httpOnly: false, // Must be accessible to middleware
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                business: user.business,
                name: `${user.firstName} ${user.lastName}`,
            },
        });
    }
    catch (error) {
        console.error('[Login Error]', error.message);
        res.status(500).json({ error: 'Invalid email or password.' });
    }
};
exports.loginUser = loginUser;
const requestPasswordReset = async (req, res) => {
    const message = 'If an account exists, a reset link has been sent to the email';
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        if (!email)
            return res.status(400).json({ error: 'Email is required' });
        await user_service_js_1.userService.requestPasswordReset(email);
        return res.json({ success: true, message });
    }
    catch (error) {
        console.error('[User Auth] Password reset request failed:', error);
        return res.json({ success: true, message });
    }
};
exports.requestPasswordReset = requestPasswordReset;
const resetPassword = async (req, res) => {
    try {
        const { resetToken, password, passwordConfirm } = req.body;
        if (!resetToken || !password || password !== passwordConfirm) {
            return res.status(400).json({ error: 'Valid token and matching passwords are required' });
        }
        await user_service_js_1.userService.resetPassword(resetToken, password);
        return res.json({ success: true, message: 'Password reset successfully' });
    }
    catch (error) {
        return res.status(400).json({ error: error.message || 'Failed to reset password' });
    }
};
exports.resetPassword = resetPassword;
const updateUserRole = async (req, res) => {
    try {
        const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
        const { role } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }
        if (!role || !['CUSTOMER', 'BUSINESS_OWNER'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        const normalizedRole = role;
        const user = await user_service_js_1.userService.updateUserRole(userId, normalizedRole);
        res.json({
            success: true,
            user: {
                id: user.id,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('[Update Role Error]', error.message);
        res.status(500).json({ error: 'Failed to update role' });
    }
};
exports.updateUserRole = updateUserRole;
const logoutUser = async (req, res) => {
    try {
        res.clearCookie('authToken');
        res.json({ success: true, message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('[Logout Error]', error.message);
        res.status(500).json({ error: 'Logout failed' });
    }
};
exports.logoutUser = logoutUser;
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!req.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password required' });
        }
        const user = await user_service_js_1.userService.findById(req.userId);
        if (!user || !user.password) {
            return res.status(400).json({ error: 'User not found or has no password' });
        }
        const isPasswordValid = await (0, auth_js_1.comparePassword)(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        const hashedPassword = await (0, auth_js_1.hashPassword)(newPassword);
        const updatedUser = await user_service_js_1.userService.updatePassword(req.userId, hashedPassword);
        res.json({
            success: true,
            message: 'Password changed successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
            },
        });
    }
    catch (error) {
        console.error('[Change Password Error]', error.message);
        res.status(500).json({ error: 'Failed to change password' });
    }
};
exports.changePassword = changePassword;
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;
        if (!req.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const user = await user_service_js_1.userService.updateUser(req.userId, {
            firstName,
            lastName,
            phone,
        });
        res.json({
            success: true,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        console.error('[Update Profile Error]', error.message);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
exports.updateProfile = updateProfile;
const getCurrentUser = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const user = await user_service_js_1.userService.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                googleId: user.googleId,
                authProvider: user.authProvider,
                business: user.business,
                isEmailVerified: user.isEmailVerified,
                name: `${user.firstName} ${user.lastName}`,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        console.error('[Get Current User Error]', error.message);
        res.status(500).json({ error: 'Failed to get user' });
    }
};
exports.getCurrentUser = getCurrentUser;
/**
 * Verify user email using code
 */
const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ error: 'Email and verification code required' });
        }
        // Find user by email
        const user = await user_service_js_1.userService.findByEmail(email);
        if (!user) {
            console.error('[Verify Email] User not found:', email);
            return res.status(400).json({ error: 'User not found' });
        }
        // Check if already verified
        if (user.isEmailVerified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }
        // Check if code matches
        if (user.emailVerificationCode !== code) {
            // Increment failed attempts
            const attempts = (user.emailVerificationAttempts || 0) + 1;
            try {
                await user_service_js_1.userService.updateUser(user.id, {
                    emailVerificationAttempts: attempts,
                });
            }
            catch (updateError) {
                console.error('[Verify Email] Failed to update attempt count:', updateError);
                // Continue even if update fails
            }
            // Lock account after 5 failed attempts
            if (attempts >= 5) {
                return res.status(400).json({
                    error: 'Too many failed attempts. Please request a new code.',
                    attemptsExceeded: true
                });
            }
            return res.status(400).json({
                error: 'Invalid verification code',
                attemptsRemaining: 5 - attempts
            });
        }
        // Check if code has expired
        if (user.emailVerificationCodeExpires && user.emailVerificationCodeExpires < new Date()) {
            return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
        }
        // Update user as verified
        const verifiedUser = await user_service_js_1.userService.updateUser(user.id, {
            isEmailVerified: true,
            emailVerificationCode: null,
            emailVerificationCodeExpires: null,
            emailVerificationAttempts: 0,
        });
        // Generate auth token now that email is verified
        const token = (0, auth_js_1.generateToken)(verifiedUser.id);
        // Set auth cookies so the user is automatically logged in after verification
        res.cookie('authToken', token, (0, auth_js_1.generateCookie)(token));
        res.cookie('userRole', verifiedUser.role, {
            httpOnly: false, // Must be accessible to middleware
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
        res.json({
            success: true,
            token,
            message: 'Email verified successfully.',
            user: {
                id: verifiedUser.id,
                email: verifiedUser.email,
                firstName: verifiedUser.firstName,
                lastName: verifiedUser.lastName,
                role: verifiedUser.role,
                isEmailVerified: verifiedUser.isEmailVerified,
            },
        });
    }
    catch (error) {
        console.error('[Verify Email Error]', error.message);
        console.error('[Verify Email Error Stack]', error.stack);
        res.status(500).json({ error: 'Failed to verify email' });
    }
};
exports.verifyEmail = verifyEmail;
/**
 * Resend verification code
 */
const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }
        const user = await user_service_js_1.userService.findByEmail(email);
        if (!user) {
            console.error('[Resend Verification] User not found:', email);
            return res.status(404).json({ error: 'User not found' });
        }
        // If already verified, no need to resend
        if (user.isEmailVerified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }
        // Generate new 6-digit code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const codeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        // Update user with new code and reset attempts
        try {
            await user_service_js_1.userService.updateUser(user.id, {
                emailVerificationCode: verificationCode,
                emailVerificationCodeExpires: codeExpires,
                emailVerificationAttempts: 0,
            });
        }
        catch (dbError) {
            console.error('[Resend Verification] Failed to update code in database:', dbError);
            throw dbError;
        }
        // Send verification email with code
        try {
            await email_service_js_1.emailService.sendVerificationEmail(email, verificationCode);
        }
        catch (emailError) {
            console.error('[v0] Failed to send verification email:', emailError);
            return res.status(500).json({ error: 'Failed to send verification code' });
        }
        res.json({
            success: true,
            message: 'Verification code sent. Please check your inbox.',
        });
    }
    catch (error) {
        console.error('[Resend Verification Code Error]', error.message);
        console.error('[Resend Verification Code Error Stack]', error.stack);
        res.status(500).json({ error: 'Failed to resend verification code' });
    }
};
exports.resendVerificationEmail = resendVerificationEmail;
