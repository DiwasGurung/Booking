"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_js_1 = __importDefault(require("../controllers/customer.controller.js"));
const customerRoutes = (0, express_1.Router)();
// Create customer
customerRoutes.post("/", customer_controller_js_1.default.create);
// Get or create customer
customerRoutes.post("/get-or-create", customer_controller_js_1.default.getOrCreate);
// Get customers of a business
customerRoutes.get("/business/:businessId", customer_controller_js_1.default.getBusinessCustomers);
// Search customers
customerRoutes.get("/business/:businessId/search", customer_controller_js_1.default.search);
// Get customer by ID
customerRoutes.get("/:id", customer_controller_js_1.default.getById);
// Update customer
customerRoutes.put("/:id", customer_controller_js_1.default.update);
// Delete customer
customerRoutes.delete("/:id", customer_controller_js_1.default.delete);
// Customer statistics
customerRoutes.get("/:customerId/stats", customer_controller_js_1.default.stats);
exports.default = customerRoutes;
