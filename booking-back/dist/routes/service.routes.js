"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const service_controller_1 = __importDefault(require("../controllers/service.controller"));
const serviceRoutes = (0, express_1.Router)();
// Create service
serviceRoutes.post("/", service_controller_1.default.create);
// Get services for a business
serviceRoutes.get("/business/:businessId", service_controller_1.default.getBusinessServices);
// Get active services for a business
serviceRoutes.get("/business/:businessId/active", service_controller_1.default.getActiveServices);
// Get services with booking stats
serviceRoutes.get("/business/:businessId/stats", service_controller_1.default.withStats);
// Get service by ID
serviceRoutes.get("/:id", service_controller_1.default.getById);
// Update service
serviceRoutes.put("/:id", service_controller_1.default.update);
// Delete service
serviceRoutes.delete("/:id", service_controller_1.default.delete);
exports.default = serviceRoutes;
