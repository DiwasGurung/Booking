"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_1 = __importDefault(require("../controllers/booking.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const bookingRoutes = (0, express_1.Router)();
bookingRoutes.post("/public", booking_controller_1.default.createPublicBooking);
// Create a new booking - handle both /bookings and direct POST
bookingRoutes.post("/", auth_middleware_1.auth, booking_controller_1.default.createBooking);
// Get a single booking by its ID
bookingRoutes.get("/bookings/:id", auth_middleware_1.auth, booking_controller_1.default.getBookingById);
// Update a booking's information
bookingRoutes.put("/bookings/:id", auth_middleware_1.auth, booking_controller_1.default.updateBooking);
// Update a booking's status
bookingRoutes.patch("/bookings/:id/status", auth_middleware_1.auth, booking_controller_1.default.updateBookingStatus);
// Verify email and confirm public booking - no authentication required
bookingRoutes.post("/verify-email/:token", booking_controller_1.default.verifyBookingEmail);
// Cancel a booking
bookingRoutes.patch("/bookings/:id/cancel", auth_middleware_1.auth, booking_controller_1.default.cancelBooking);
// Delete a booking
bookingRoutes.delete("/bookings/:id", auth_middleware_1.auth, booking_controller_1.default.deleteBooking);
// Get all bookings for a specific business
bookingRoutes.get("/businesses/:businessId/bookings", auth_middleware_1.auth, booking_controller_1.default.getBusinessBookings);
// Get booking trends for a business
bookingRoutes.get("/businesses/:businessId/booking-trends", auth_middleware_1.auth, booking_controller_1.default.getBookingTrends);
// Get available slots for STAFF individual bookings
bookingRoutes.get("/businesses/:businessId/services/:serviceId/available-slots", booking_controller_1.default.getAvailableSlots);
// ==================== BUSINESS BOOKING ROUTES ====================
// BUSINESS PUBLIC booking - no authentication required
bookingRoutes.post("/business/public", booking_controller_1.default.createBusinessPublicBooking);
// BUSINESS booking for authenticated users - requires auth
bookingRoutes.post("/business", auth_middleware_1.auth, booking_controller_1.default.createBusinessBooking);
// Get available slots for BUSINESS bookings (with staff/timeoff checking)
bookingRoutes.get("/business/businesses/:businessId/services/:serviceId/available-slots", booking_controller_1.default.getBusinessAvailableSlots);
// Get all bookings for a specific user/customer
bookingRoutes.get("/users/:userId/bookings", auth_middleware_1.auth, booking_controller_1.default.getCustomerBookings);
exports.default = bookingRoutes;
