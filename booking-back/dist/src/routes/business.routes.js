"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const business_controller_1 = __importDefault(require("../controllers/business.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const business_owner_middleware_1 = require("../middleware/business-owner.middleware");
const businessRoutes = (0, express_1.Router)();
// ---- Public ----
businessRoutes.get("/", business_controller_1.default.getAll);
businessRoutes.get("/search", business_controller_1.default.search);
businessRoutes.get('/public/:id', business_controller_1.default.getPublicById);
// ---- Authenticated, no business id (must come before "/:id") ----
businessRoutes.post("/", auth_middleware_1.auth, business_controller_1.default.create);
businessRoutes.post("/setup/basic", auth_middleware_1.auth, business_controller_1.default.setupBasic);
businessRoutes.get("/current", auth_middleware_1.auth, (req, res) => business_controller_1.default.getCurrentBusiness(req, res));
businessRoutes.get("/user/:userId", auth_middleware_1.auth, business_controller_1.default.getByUserId);
// ---- Owner only: :businessId routes ----
businessRoutes.get("/:businessId/stats", auth_middleware_1.auth, business_owner_middleware_1.requireBusinessOwner, business_controller_1.default.stats);
businessRoutes.get("/:businessId/analytics", auth_middleware_1.auth, business_owner_middleware_1.requireBusinessOwner, business_controller_1.default.analytics);
businessRoutes.get("/:businessId/customer-insights", auth_middleware_1.auth, business_owner_middleware_1.requireBusinessOwner, business_controller_1.default.customerInsights);
businessRoutes.get('/:businessId/settings', auth_middleware_1.auth, business_owner_middleware_1.requireBusinessOwner, business_controller_1.default.getSettings);
businessRoutes.put('/:businessId/settings', auth_middleware_1.auth, business_owner_middleware_1.requireBusinessOwner, business_controller_1.default.updateSettings);
businessRoutes.get('/:businessId/slug-available', auth_middleware_1.auth, business_owner_middleware_1.requireBusinessOwner, business_controller_1.default.checkSlug);
businessRoutes.patch('/:businessId/slug', auth_middleware_1.auth, business_owner_middleware_1.requireBusinessOwner, business_controller_1.default.updateSlug);
// ---- Owner only: :id routes (last, since "/:id" matches any single segment) ----
businessRoutes.get("/:id", auth_middleware_1.auth, business_owner_middleware_1.requireBusinessOwner, business_controller_1.default.getById);
businessRoutes.put("/:id", auth_middleware_1.auth, business_owner_middleware_1.requireBusinessOwner, business_controller_1.default.update);
businessRoutes.delete("/:id", auth_middleware_1.auth, business_owner_middleware_1.requireBusinessOwner, business_controller_1.default.delete);
exports.default = businessRoutes;
