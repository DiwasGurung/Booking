"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const google_auth_library_1 = require("google-auth-library");
const user_service_1 = require("../services/user.service");
const auth_1 = require("../utils/auth");
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
/**
 * One serializer for every endpoint that returns a user, so login and
 * /auth/me can never drift apart. Returns BOTH shapes the frontend may read:
 *   user.businessId      (flat)
 *   user.business.id     (nested)
 */
const toUserDto = (u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    role: u.role,
    googleId: u.googleId,
    authProvider: u.authProvider,
    businessId: u.business?.id ?? null,
    business: u.business ? { id: u.business.id } : null,
});
// getTokenInfo() often has no `sub` and no name, so read the profile from Google directly
async function fetchGoogleProfile(accessToken) {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok)
        throw new Error('Could not read Google profile');
    return res.json();
}
exports.authController = {
    // Google OAuth login/signup
    async googleOAuth(req, res) {
        try {
            const { access_token } = req.body;
            if (!access_token) {
                return res.status(400).json({ error: 'Access token is required' });
            }
            // 1. Make sure the token was issued for THIS app (not another Google client)
            const tokenInfo = await googleClient.getTokenInfo(access_token);
            if (process.env.GOOGLE_CLIENT_ID && tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
                return res.status(401).json({ error: 'Google token was not issued for this application' });
            }
            // 2. Read the real profile (gives a stable `sub` and the real name)
            const profile = await fetchGoogleProfile(access_token);
            if (!profile.email || !profile.sub) {
                return res.status(400).json({ error: 'Invalid Google token or email not found' });
            }
            // 3. Never link or create accounts from an unverified Google email
            if (!profile.email_verified) {
                return res.status(403).json({ error: 'Google email is not verified' });
            }
            const email = profile.email.toLowerCase();
            const googleId = profile.sub;
            let user = await user_service_1.userService.findByGoogleId(googleId);
            if (!user) {
                const existingUser = await user_service_1.userService.findByEmail(email);
                if (existingUser) {
                    // Link Google to existing user (also replaces an old email-as-googleId value with the real sub)
                    user = await user_service_1.userService.linkGoogleToUser(existingUser.id, googleId);
                }
                else {
                    const nameFromEmail = email.split('@')[0].split('.');
                    user = await user_service_1.userService.createUser({
                        firstName: profile.given_name || nameFromEmail[0] || 'User',
                        lastName: profile.family_name || nameFromEmail[1] || '',
                        email,
                        googleId,
                        role: 'CUSTOMER',
                        authProvider: 'GOOGLE',
                        isEmailVerified: true,
                    });
                }
            }
            const token = (0, auth_1.generateToken)(user.id);
            res.cookie('authToken', token, (0, auth_1.generateCookie)(token));
            res.json({
                success: true,
                token,
                user: toUserDto(user),
            });
        }
        catch (error) {
            console.error('[Google OAuth Error]', error.message);
            res.status(400).json({ error: 'Google authentication failed' });
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
            res.json(toUserDto(user));
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
