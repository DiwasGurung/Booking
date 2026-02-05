"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const business_controller_1 = __importDefault(require("../controllers/business.controller"));
const businessRoutes = (0, express_1.Router)();
// Create business
businessRoutes.post("/", business_controller_1.default.create);
// Get all businesses
businessRoutes.get("/", business_controller_1.default.getAll);
// Search businesses
businessRoutes.get("/search", business_controller_1.default.search);
// Get business by ID
businessRoutes.get("/:id", business_controller_1.default.getById);
// Get business by user ID
businessRoutes.get("/user/:userId", business_controller_1.default.getByUserId);
// Update business
businessRoutes.put("/:id", business_controller_1.default.update);
// Delete business
businessRoutes.delete("/:id", business_controller_1.default.delete);
// Business statistics
businessRoutes.get("/:businessId/stats", business_controller_1.default.stats);
// Monthly revenue
businessRoutes.get("/:businessId/revenue", business_controller_1.default.monthlyRevenue);
exports.default = businessRoutes;
