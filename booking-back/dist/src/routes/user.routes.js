"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Public routes
router.post('/register', user_controller_1.createUser);
router.post('/login', user_controller_1.loginUser);
// Protected routes
router.get('/me', auth_middleware_1.auth, user_controller_1.getCurrentUser);
router.post('/logout', auth_middleware_1.auth, user_controller_1.logoutUser);
router.put('/role/:userId', auth_middleware_1.auth, user_controller_1.updateUserRole);
router.put('/password', auth_middleware_1.auth, user_controller_1.changePassword);
router.put('/profile', auth_middleware_1.auth, user_controller_1.updateProfile);
router.post('/verify-email', user_controller_1.verifyEmail);
router.post('/resend-verification', user_controller_1.resendVerificationEmail);
exports.default = router;
