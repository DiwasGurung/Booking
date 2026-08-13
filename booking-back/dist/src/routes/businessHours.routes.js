"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const businessHours_controller_js_1 = __importDefault(require("../controllers/businessHours.controller.js"));
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const businessHoursRoutes = (0, express_1.Router)();
// Business Hours Routes
businessHoursRoutes.post("/", businessHours_controller_js_1.default.set);
businessHoursRoutes.get("/business/:businessId", businessHours_controller_js_1.default.getAll);
businessHoursRoutes.get("/business/:businessId/is-open", businessHours_controller_js_1.default.isOpen);
businessHoursRoutes.get("/business/:businessId/day/:dayOfWeek", businessHours_controller_js_1.default.getByDay);
businessHoursRoutes.put("/business/:businessId", businessHours_controller_js_1.default.update);
businessHoursRoutes.delete("/:id", businessHours_controller_js_1.default.delete);
businessHoursRoutes.post("/:businessId/closed-dates", auth_middleware_js_1.auth, businessHours_controller_js_1.default.addClosedDate);
businessHoursRoutes.get("/:businessId/closed-dates", businessHours_controller_js_1.default.getClosedDates);
businessHoursRoutes.delete("/:businessId/closed-dates/:dateId", auth_middleware_js_1.auth, businessHours_controller_js_1.default.removeClosedDate);
// Time Off Routes
businessHoursRoutes.post("/:businessId/time-off", auth_middleware_js_1.auth, businessHours_controller_js_1.default.addTimeOff);
businessHoursRoutes.get("/:businessId/time-off", businessHours_controller_js_1.default.getTimeOffs);
businessHoursRoutes.delete("/time-off/:timeOffId", auth_middleware_js_1.auth, businessHours_controller_js_1.default.removeTimeOff);
exports.default = businessHoursRoutes;
