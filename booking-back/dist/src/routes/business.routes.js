"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const business_controller_1 = __importDefault(require("../controllers/business.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const businessRoutes = (0, express_1.Router)();
// Create business
businessRoutes.post("/", business_controller_1.default.create);
// Get all businesses
businessRoutes.get("/", business_controller_1.default.getAll);
businessRoutes.post("/setup/basic", auth_middleware_1.auth, business_controller_1.default.setupBasic);
// Search businesses (specific route before /:id)
businessRoutes.get("/search", business_controller_1.default.search);
// Get business by user ID (specific route before /:id)
businessRoutes.get("/user/:userId", auth_middleware_1.auth, business_controller_1.default.getByUserId);
// Business statistics (specific route before /:id)
businessRoutes.get("/:businessId/stats", auth_middleware_1.auth, business_controller_1.default.stats);
// Get business settings (specific route before /:id)
businessRoutes.get('/:businessId/settings', auth_middleware_1.auth, business_controller_1.default.getSettings);
// Update business settings (specific route before /:id)
businessRoutes.put('/:businessId/settings', auth_middleware_1.auth, business_controller_1.default.updateSettings);
businessRoutes.get("/current", auth_middleware_1.auth, (req, res) => business_controller_1.default.getCurrentBusiness(req, res));
businessRoutes.get("/:id", auth_middleware_1.auth, business_controller_1.default.getById);
// Update business
businessRoutes.put("/:id", auth_middleware_1.auth, business_controller_1.default.update);
// Delete business
businessRoutes.delete("/:id", auth_middleware_1.auth, business_controller_1.default.delete);
businessRoutes.get('/public/:id', business_controller_1.default.getPublicById); // already exists
businessRoutes.get('/:businessId/slug-available', auth_middleware_1.auth, business_controller_1.default.checkSlug);
businessRoutes.patch('/:businessId/slug', auth_middleware_1.auth, business_controller_1.default.updateSlug);
// Analytics and statistics routes (specific routes before /:id)
businessRoutes.get("/:businessId/analytics", auth_middleware_1.auth, business_controller_1.default.analytics);
businessRoutes.get("/:businessId/customer-insights", auth_middleware_1.auth, business_controller_1.default.customerInsights);
exports.default = businessRoutes;
