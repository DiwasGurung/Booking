"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_1 = __importDefault(require("../controllers/booking.controller"));
const bookingRoutes = (0, express_1.Router)();
bookingRoutes.post("/public", booking_controller_1.default.createPublicBooking);
// Create a new booking - handle both /bookings and direct POST
bookingRoutes.post("/create", booking_controller_1.default.createBooking);
// Get a single booking by its ID
bookingRoutes.get("/bookings/:id", booking_controller_1.default.getBookingById);
// Update a booking's information
bookingRoutes.put("/bookings/:id", booking_controller_1.default.updateBooking);
// Update a booking's status
bookingRoutes.patch("/bookings/:id/status", booking_controller_1.default.updateBookingStatus);
// Cancel a booking
bookingRoutes.patch("/bookings/:id/cancel", booking_controller_1.default.cancelBooking);
// Delete a booking
bookingRoutes.delete("/bookings/:id", booking_controller_1.default.deleteBooking);
// Get all bookings for a specific business
bookingRoutes.get("/businesses/:businessId/bookings", booking_controller_1.default.getBusinessBookings);
// Get booking trends for a business
bookingRoutes.get("/businesses/:businessId/booking-trends", booking_controller_1.default.getBookingTrends);
// Get available slots for a service at a business
bookingRoutes.get("/businesses/:businessId/services/:serviceId/available-slots", booking_controller_1.default.getAvailableSlots);
// Get all bookings for a specific user/customer
bookingRoutes.get("/users/:userId/bookings", booking_controller_1.default.getCustomerBookings);
exports.default = bookingRoutes;
