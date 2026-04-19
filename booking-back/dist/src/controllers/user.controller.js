"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.updateProfile = exports.changePassword = exports.logoutUser = exports.updateUserRole = exports.loginUser = exports.createUser = void 0;
const user_service_1 = require("../services/user.service");
const auth_1 = require("../utils/auth");
const createUser = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, role } = req.body;
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        console.log('[Register] Creating user:', email);
        // Check if user already exists
        const existingUser = await user_service_1.userService.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        // Hash password
        const hashedPassword = await (0, auth_1.hashPassword)(password);
        // Create user
        const user = await user_service_1.userService.createUser({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone,
            role: role || 'CUSTOMER',
            authProvider: 'EMAIL',
        });
        const token = (0, auth_1.generateToken)(user.id);
        res.cookie('authToken', token, (0, auth_1.generateCookie)(token));
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
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
        console.log('[Login] Authenticating user:', email);
        const user = await user_service_1.userService.findByEmail(email);
        if (!user) {
            console.log('[Login] User not found:', email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        console.log('[Login] User found:', user.id);
        if (!user.password) {
            console.log('[Login] User has no password (Google login)');
            return res.status(401).json({ error: 'User registered with Google. Please use Google sign-in' });
        }
        console.log('[Login] Comparing password...');
        const isPasswordValid = await (0, auth_1.comparePassword)(password, user.password);
        console.log('[Login] Password valid:', isPasswordValid);
        if (!isPasswordValid) {
            console.log('[Login] Invalid password for user:', email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = (0, auth_1.generateToken)(user.id);
        res.cookie('authToken', token, (0, auth_1.generateCookie)(token));
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
        res.status(500).json({ error: 'Login failed' });
    }
};
exports.loginUser = loginUser;
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
        console.log('[Update Role] Updating user:', userId, 'to role:', normalizedRole);
        const user = await user_service_1.userService.updateUserRole(userId, normalizedRole);
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
        console.log('[Logout] User logged out:', req.userId);
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
        console.log('[Change Password] User:', req.userId);
        const user = await user_service_1.userService.findById(req.userId);
        if (!user || !user.password) {
            return res.status(400).json({ error: 'User not found or has no password' });
        }
        const isPasswordValid = await (0, auth_1.comparePassword)(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        const hashedPassword = await (0, auth_1.hashPassword)(newPassword);
        const updatedUser = await user_service_1.userService.updatePassword(req.userId, hashedPassword);
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
        console.log('[Update Profile] User:', req.userId);
        const user = await user_service_1.userService.updateUser(req.userId, {
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
        console.log('[Get Current User] User:', req.userId);
        const user = await user_service_1.userService.findById(req.userId);
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
                name: `${user.firstName} ${user.lastName}`,
            },
        });
    }
    catch (error) {
        console.error('[Get Current User Error]', error.message);
        res.status(500).json({ error: 'Failed to get user' });
    }
};
exports.getCurrentUser = getCurrentUser;
