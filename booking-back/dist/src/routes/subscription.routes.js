"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscription_controller_1 = __importDefault(require("../controllers/subscription.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const subscriptionRoutes = (0, express_1.Router)();
// Create subscription with free trial
subscriptionRoutes.post('/create-trial', auth_middleware_1.auth, (req, res) => subscription_controller_1.default.createWithTrial(req, res));
// Get subscription status
subscriptionRoutes.get('/status/:businessId', (req, res) => subscription_controller_1.default.getStatus(req, res));
// Check subscription validity
subscriptionRoutes.get('/check/:businessId', (req, res) => subscription_controller_1.default.checkValidity(req, res));
// Activate subscription after payment
subscriptionRoutes.post('/activate', auth_middleware_1.auth, (req, res) => subscription_controller_1.default.activate(req, res));
// Check if trial has expired
subscriptionRoutes.get('/trial-expiration/:businessId', (req, res) => subscription_controller_1.default.checkTrialExpiration(req, res));
// Feature gating checks
subscriptionRoutes.get('/limits/appointment/:businessId', (req, res) => subscription_controller_1.default.checkAppointmentLimit(req, res));
subscriptionRoutes.get('/limits/staff/:businessId', (req, res) => subscription_controller_1.default.checkStaffLimit(req, res));
subscriptionRoutes.get('/limits/service/:businessId', (req, res) => subscription_controller_1.default.checkServiceLimit(req, res));
// Get usage details
subscriptionRoutes.get('/usage/:businessId', (req, res) => subscription_controller_1.default.getUsageDetails(req, res));
// Get all plans
subscriptionRoutes.get('/plans/all', (req, res) => subscription_controller_1.default.getAllPlans(req, res));
// Upgrade subscription
subscriptionRoutes.post('/upgrade', auth_middleware_1.auth, (req, res) => subscription_controller_1.default.upgrade(req, res));
// Downgrade subscription
subscriptionRoutes.post('/downgrade', auth_middleware_1.auth, (req, res) => subscription_controller_1.default.downgrade(req, res));
// Renew subscription
subscriptionRoutes.post('/renew', auth_middleware_1.auth, (req, res) => subscription_controller_1.default.renew(req, res));
subscriptionRoutes.post('/cancel/:subscriptionId', auth_middleware_1.auth, (req, res) => subscription_controller_1.default.cancelSubscription(req, res));
// Get next renewal date
subscriptionRoutes.get('/renewal-date/:businessId', (req, res) => subscription_controller_1.default.getNextRenewal(req, res));
exports.default = subscriptionRoutes;
