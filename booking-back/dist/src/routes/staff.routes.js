"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const staff_controller_1 = require("../controllers/staff.controller");
const router = (0, express_1.Router)();
/**
 * @route POST /api/staff
 * @desc Create a new staff member
 * @access Private (Business Owner)
 */
router.post("/", auth_middleware_1.auth, staff_controller_1.createStaff);
/**
 * @route GET /api/staff/:id
 * @desc Get staff by ID
 * @access Public
 */
router.get("/:id", staff_controller_1.getStaffById);
/**
 * @route GET /api/staff/business/:businessId
 * @desc Get all staff for a business
 * @access Public
 */
router.get("/business/:businessId", staff_controller_1.getBusinessStaff);
/**
 * @route GET /api/staff/service/:serviceId
 * @desc Get staff who can perform a specific service
 * @access Public
 */
router.get("/service/:serviceId", staff_controller_1.getStaffForService);
/**
 * @route PUT /api/staff/:id
 * @desc Update staff member
 * @access Private (Business Owner)
 */
router.put("/:id", auth_middleware_1.auth, staff_controller_1.updateStaff);
/**
 * @route DELETE /api/staff/:id
 * @desc Delete staff member
 * @access Private (Business Owner)
 */
router.delete("/:id", auth_middleware_1.auth, staff_controller_1.deleteStaff);
/**
 * @route PATCH /api/staff/:id/toggle-status
 * @desc Toggle staff active status
 * @access Private (Business Owner)
 */
router.patch("/:id/toggle-status", auth_middleware_1.auth, staff_controller_1.toggleStaffStatus);
/**
 * @route GET /api/staff/:staffId/availability
 * @desc Get staff availability for a specific date
 * @access Public
 */
router.get("/:staffId/availability", staff_controller_1.getStaffAvailability);
/**
 * @route GET /api/staff/:staffId/stats
 * @desc Get staff statistics
 * @access Private (Business Owner)
 */
router.get("/:staffId/stats", auth_middleware_1.auth, staff_controller_1.getStaffStats);
/**
 * @route GET /api/staff/code/:staffCode
 * @desc Get staff info by staffCode (public)
 * @access Public
 */
router.get("/code/:staffCode", staff_controller_1.getStaffByCode);
/**
 * @route GET /api/staff/code/:staffCode/bookings
 * @desc Get staff bookings by staffCode (public)
 * @access Public
 */
router.get("/code/:staffCode/bookings", staff_controller_1.getStaffBookings);
exports.default = router;
