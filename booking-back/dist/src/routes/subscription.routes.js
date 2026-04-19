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
exports.default = subscriptionRoutes;
