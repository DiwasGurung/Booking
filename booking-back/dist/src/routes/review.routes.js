"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_controller_js_1 = __importDefault(require("../controllers/review.controller.js"));
const reviewRoutes = (0, express_1.Router)();
// Create review
reviewRoutes.post("/", review_controller_js_1.default.create);
// Get reviews for a business
reviewRoutes.get("/business/:businessId", review_controller_js_1.default.getBusinessReviews);
// Review statistics
reviewRoutes.get("/business/:businessId/stats", review_controller_js_1.default.stats);
// Get review by ID
reviewRoutes.get("/:id", review_controller_js_1.default.getById);
// Update review
reviewRoutes.put("/:id", review_controller_js_1.default.update);
// Delete review
reviewRoutes.delete("/:id", review_controller_js_1.default.delete);
exports.default = reviewRoutes;
