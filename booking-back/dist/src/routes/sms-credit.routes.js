"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sms_credit_controller_1 = __importDefault(require("../controllers/sms-credit.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const sms_credit_payment_controller_1 = require("../controllers/sms-credit-payment.controller");
const SmsCreditRoutes = express_1.default.Router();
SmsCreditRoutes.get('/sms/packages', sms_credit_controller_1.default.getPackages);
SmsCreditRoutes.get('/business/:businessId/sms/balance', auth_middleware_1.auth, sms_credit_controller_1.default.getBalance);
SmsCreditRoutes.get('/business/:businessId/sms/transactions', auth_middleware_1.auth, sms_credit_controller_1.default.getTransactions);
SmsCreditRoutes.post('/business/:businessId/sms/purchase', auth_middleware_1.auth, sms_credit_controller_1.default.initiatePurchase);
SmsCreditRoutes.post('/sms-payment/esewa/initiate', auth_middleware_1.auth, sms_credit_payment_controller_1.initiateSmsCreditPayment);
// eSewa redirects the browser here, so these two must NOT have auth middleware:
SmsCreditRoutes.get('/sms-payment/esewa/success', sms_credit_payment_controller_1.handleSmsEsewaSuccess);
SmsCreditRoutes.get('/sms-payment/esewa/failure', sms_credit_payment_controller_1.handleSmsEsewaFailure);
exports.default = SmsCreditRoutes;
