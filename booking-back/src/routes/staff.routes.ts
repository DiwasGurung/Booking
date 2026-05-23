import { Router } from "express"
import { auth } from "../middleware/auth.middleware"
import {
  createStaff,
  getStaffById,
  getBusinessStaff,
  getStaffForService,
  updateStaff,
  deleteStaff,
  toggleStaffStatus,
  getStaffAvailability,
  getStaffStats,
} from "../controllers/staff.controller"

const router = Router()

/**
 * @route POST /api/staff
 * @desc Create a new staff member
 * @access Private (Business Owner)
 */
router.post("/", auth, createStaff)

/**
 * @route GET /api/staff/:id
 * @desc Get staff by ID
 * @access Public
 */
router.get("/:id", getStaffById)

/**
 * @route GET /api/staff/business/:businessId
 * @desc Get all staff for a business
 * @access Public
 */
router.get("/business/:businessId", getBusinessStaff)

/**
 * @route GET /api/staff/service/:serviceId
 * @desc Get staff who can perform a specific service
 * @access Public
 */
router.get("/service/:serviceId", getStaffForService)

/**
 * @route PUT /api/staff/:id
 * @desc Update staff member
 * @access Private (Business Owner)
 */
router.put("/:id", auth, updateStaff)

/**
 * @route DELETE /api/staff/:id
 * @desc Delete staff member
 * @access Private (Business Owner)
 */
router.delete("/:id", auth, deleteStaff)

/**
 * @route PATCH /api/staff/:id/toggle-status
 * @desc Toggle staff active status
 * @access Private (Business Owner)
 */
router.patch("/:id/toggle-status", auth, toggleStaffStatus)

/**
 * @route GET /api/staff/:staffId/availability
 * @desc Get staff availability for a specific date
 * @access Public
 */
router.get("/:staffId/availability", getStaffAvailability)

/**
 * @route GET /api/staff/:staffId/stats
 * @desc Get staff statistics
 * @access Private (Business Owner)
 */
router.get("/:staffId/stats", auth, getStaffStats)

export default router
