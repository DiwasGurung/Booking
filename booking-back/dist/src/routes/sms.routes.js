"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sms_controller_1 = __importDefault(require("../controllers/sms.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// All routes require authentication — the controller derives businessId
// from req.userId internally, so no businessId is ever accepted from the
// client (prevents one owner acting on/reading another business's SMS).
router.use(auth_middleware_1.auth);
// Send test SMS
router.post('/test', sms_controller_1.default.sendTest);
// Send bulk SMS
router.post('/send-bulk', sms_controller_1.default.sendBulk);
// Resend SMS
router.post('/resend', sms_controller_1.default.resendSMS);
// Get SMS logs
router.get('/logs', sms_controller_1.default.getLogs);
// Get logs by phone number
router.get('/logs/:phoneNumber', sms_controller_1.default.getLogsByPhone);
// Get SMS statistics
router.get('/statistics', sms_controller_1.default.getStatistics);
// Get plan quota / usage summary
router.get('/usage', sms_controller_1.default.getUsage);
exports.default = router;
