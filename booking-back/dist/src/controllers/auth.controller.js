"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const google_auth_library_1 = require("google-auth-library");
const user_service_1 = require("../services/user.service");
const auth_1 = require("../utils/auth");
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
exports.authController = {
    // Google OAuth login/signup
    async googleOAuth(req, res) {
        try {
            const { access_token } = req.body;
            if (!access_token) {
                return res.status(400).json({ error: 'Access token is required' });
            }
            console.log('[Google OAuth] Verifying access token...');
            // Verify the Google access token
            const tokenInfo = await googleClient.getTokenInfo(access_token);
            if (!tokenInfo.email) {
                return res.status(400).json({ error: 'Invalid Google token or email not found' });
            }
            const { email, email_verified } = tokenInfo;
            // Note: getTokenInfo doesn't return googleId (sub), so we use email as identifier
            const googleId = tokenInfo.sub || email;
            console.log('[Google OAuth] Token verified for:', email);
            // Check if user exists by Google ID
            let user = await user_service_1.userService.findByGoogleId(googleId);
            if (!user) {
                // Check if user exists by email
                const existingUser = await user_service_1.userService.findByEmail(email);
                if (existingUser) {
                    // Link Google to existing user
                    user = await user_service_1.userService.linkGoogleToUser(existingUser.id, googleId);
                    console.log('[Google OAuth] Linked Google to existing user:', email);
                }
                else {
                    // Create new user - extract name from email if not available
                    const nameParts = email.split('@')[0].split('.');
                    user = await user_service_1.userService.createUser({
                        firstName: nameParts[0] || 'User',
                        lastName: nameParts[1] || '',
                        email,
                        googleId,
                        role: 'CUSTOMER',
                        authProvider: 'GOOGLE',
                    });
                    console.log('[Google OAuth] Created new user:', email);
                }
            }
            else {
                console.log('[Google OAuth] User already exists:', email);
            }
            // Generate JWT token
            const token = (0, auth_1.generateToken)(user.id);
            // Set cookie
            res.cookie('authToken', token, (0, auth_1.generateCookie)(token));
            // Return user data and token
            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    googleId: user.googleId,
                    authProvider: user.authProvider,
                    businessId: user.business?.id,
                },
            });
        }
        catch (error) {
            console.error('[Google OAuth Error]', error.message);
            res.status(400).json({ error: error.message || 'Google authentication failed' });
        }
    },
    // Get current authenticated user
    async getCurrentUser(req, res) {
        try {
            if (!req.userId) {
                console.warn('[Auth] Attempt to get current user without authentication');
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const user = await user_service_1.userService.findById(req.userId);
            if (!user) {
                console.warn('[Auth] User not found:', req.userId);
                return res.status(404).json({ error: 'User not found' });
            }
            console.log('[Auth] Retrieved current user:', req.userId);
            res.json({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                googleId: user.googleId,
                authProvider: user.authProvider,
                businessId: user.business?.id,
            });
        }
        catch (error) {
            console.error('[Get Current User Error]', error.message);
            res.status(500).json({ error: 'Failed to get user' });
        }
    },
    // Logout
    async logout(req, res) {
        try {
            res.clearCookie('authToken');
            res.json({ success: true, message: 'Logged out successfully' });
        }
        catch (error) {
            console.error('[Logout Error]', error.message);
            res.status(500).json({ error: 'Failed to logout' });
        }
    },
};
