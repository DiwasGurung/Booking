"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const businessHours_controller_1 = __importDefault(require("../controllers/businessHours.controller"));
const businessHoursRoutes = (0, express_1.Router)();
// Set or update hours (upsert)
businessHoursRoutes.post("/", businessHours_controller_1.default.set);
// Get all hours for a business
businessHoursRoutes.get("/business/:businessId", businessHours_controller_1.default.getAll);
// Check if business is open
businessHoursRoutes.get("/business/:businessId/is-open", businessHours_controller_1.default.isOpen);
// Get hours for specific day
businessHoursRoutes.get("/business/:businessId/day/:dayOfWeek", businessHours_controller_1.default.getByDay);
// Update hours by ID
businessHoursRoutes.put("/business/:businessId", businessHours_controller_1.default.update);
// Delete hours by ID
businessHoursRoutes.delete("/:id", businessHours_controller_1.default.delete);
exports.default = businessHoursRoutes;
