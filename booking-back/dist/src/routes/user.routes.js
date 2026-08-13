"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_js_1 = require("../controllers/user.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = express_1.default.Router();
// Public routes
router.post('/register', user_controller_js_1.createUser);
router.post('/login', user_controller_js_1.loginUser);
// Protected routes
router.get('/me', auth_middleware_js_1.auth, user_controller_js_1.getCurrentUser);
router.post('/logout', auth_middleware_js_1.auth, user_controller_js_1.logoutUser);
router.put('/role/:userId', auth_middleware_js_1.auth, user_controller_js_1.updateUserRole);
router.put('/password', auth_middleware_js_1.auth, user_controller_js_1.changePassword);
router.put('/:id/profile', auth_middleware_js_1.auth, user_controller_js_1.updateProfile);
router.post('/verify-email', user_controller_js_1.verifyEmail);
router.post('/resend-verification', user_controller_js_1.resendVerificationEmail);
router.post('/request-password-reset', user_controller_js_1.requestPasswordReset);
router.post('/reset-password', user_controller_js_1.resetPassword);
exports.default = router;
