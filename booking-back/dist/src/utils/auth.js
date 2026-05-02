"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.generateCookie = generateCookie;
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
function generateToken(userId) {
    return jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}
function generateCookie(token) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
    };
}
async function hashPassword(password) {
    console.log('[hashPassword] Hashing password...');
    const salt = await bcrypt_1.default.genSalt(10);
    const hashedPassword = await bcrypt_1.default.hash(password, salt);
    console.log('[hashPassword] Password hashed successfully');
    return hashedPassword;
}
async function comparePassword(plainPassword, hashedPassword) {
    try {
        console.log('[comparePassword] Comparing passwords...');
        console.log('[comparePassword] Hashed password length:', hashedPassword.length);
        const isMatch = await bcrypt_1.default.compare(plainPassword, hashedPassword);
        console.log('[comparePassword] Match result:', isMatch);
        return isMatch;
    }
    catch (error) {
        console.error('[comparePassword] Error comparing passwords:', error.message);
        return false;
    }
}
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
