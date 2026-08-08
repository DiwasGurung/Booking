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
const express_1 = __importDefault(require("express"));
const staff_verification_service_1 = require("../services/staff-verification.service");
const validators_1 = require("../validators");
const zod_1 = __importDefault(require("zod"));
const staffVerificationRoutes = express_1.default.Router();
// Validation schemas
const VerifyEmailSchema = zod_1.default.object({
    token: zod_1.default.string().min(1, 'Verification token is required'),
    staffId: zod_1.default.string().min(1).optional(),
});
const ResendVerificationSchema = zod_1.default.object({
    staffId: zod_1.default.string().min(1).optional(),
    token: zod_1.default.string().min(1).optional(),
}).refine((value) => value.staffId || value.token, {
    message: 'Staff ID or verification token is required',
});
const VerificationStatusSchema = zod_1.default.object({
    staffId: zod_1.default.string().min(1, 'Staff ID is required'),
});
const RequestVerificationSchema = zod_1.default.object({
    email: zod_1.default.string().email('A valid email is required'),
});
/**
 * Request a first-login verification email
 */
staffVerificationRoutes.post('/request', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = (0, validators_1.parseAndValidate)(RequestVerificationSchema, req.body);
        if ((0, validators_1.isValidationError)(validation)) {
            return res.status(400).json({ message: validation.error });
        }
        const result = yield staff_verification_service_1.staffVerificationService.requestVerificationEmail(validation.data.email);
        return res.status(result.status === 'not_found' ? 404 : 200).json(result);
    }
    catch (error) {
        console.error('[v0] Error requesting verification email:', error);
        return res.status(500).json({
            success: false,
            status: 'error',
            message: 'Unable to send the verification email right now. Please try again.',
        });
    }
}));
/**
 * Verify staff email with token
 */
staffVerificationRoutes.post('/verify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = (0, validators_1.parseAndValidate)(VerifyEmailSchema, req.body);
        if ((0, validators_1.isValidationError)(validation)) {
            return res.status(400).json({ message: validation.error });
        }
        const { token, staffId } = validation.data;
        const result = yield staff_verification_service_1.staffVerificationService.verifyEmail(token, staffId);
        res.json(result);
    }
    catch (error) {
        console.error('[v0] Error verifying email:', error);
        res.status(400).json({ message: error.message || 'Failed to verify email' });
    }
}));
/**
 * Resend verification email
 */
staffVerificationRoutes.post('/resend', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = (0, validators_1.parseAndValidate)(ResendVerificationSchema, req.body);
        if ((0, validators_1.isValidationError)(validation)) {
            return res.status(400).json({ message: validation.error });
        }
        const { staffId, token } = validation.data;
        const result = yield staff_verification_service_1.staffVerificationService.resendVerificationEmail(staffId, token);
        res.json(result);
    }
    catch (error) {
        console.error('[v0] Error resending verification email:', error);
        res.status(400).json({ message: error.message || 'Failed to resend verification email' });
    }
}));
/**
 * Get verification status
 */
staffVerificationRoutes.get('/status/:staffId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = (0, validators_1.parseAndValidate)(VerificationStatusSchema, req.params);
        if ((0, validators_1.isValidationError)(validation)) {
            return res.status(400).json({ message: validation.error });
        }
        const { staffId } = validation.data;
        const result = yield staff_verification_service_1.staffVerificationService.getVerificationStatus(staffId);
        res.json(result);
    }
    catch (error) {
        console.error('[v0] Error getting verification status:', error);
        res.status(400).json({ message: error.message || 'Failed to get verification status' });
    }
}));
exports.default = staffVerificationRoutes;
