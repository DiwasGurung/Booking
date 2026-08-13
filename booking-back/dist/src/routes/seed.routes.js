"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const seed_controller_js_1 = __importDefault(require("../controllers/seed.controller.js"));
const seedRoutes = (0, express_1.Router)();
// Seed subscription plans
seedRoutes.post('/plans', (req, res) => seed_controller_js_1.default.seedPlans(req, res));
// Get all plans
seedRoutes.get('/plans', (req, res) => seed_controller_js_1.default.getPlans(req, res));
exports.default = seedRoutes;
