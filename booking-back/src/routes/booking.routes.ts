import { Router } from "express";
import BookingController from "../controllers/booking.controller";
import { auth } from "../middleware/auth.middleware";

const bookingRoutes = Router();


bookingRoutes.post("/public", BookingController.createPublicBooking);
// Create a new booking - handle both /bookings and direct POST
bookingRoutes.post("/", auth, BookingController.createBooking);


// Get a single booking by its ID
bookingRoutes.get("/bookings/:id", auth, BookingController.getBookingById);

// Update a booking's information
bookingRoutes.put("/bookings/:id", auth, BookingController.updateBooking);

// Update a booking's status
bookingRoutes.patch("/bookings/:id/status", auth, BookingController.updateBookingStatus);

// Verify email and confirm public booking - no authentication required
bookingRoutes.post("/verify-email/:token", BookingController.verifyBookingEmail);

// Cancel a booking
bookingRoutes.patch("/bookings/:id/cancel", auth, BookingController.cancelBooking);

// Delete a booking
bookingRoutes.delete("/bookings/:id", auth, BookingController.deleteBooking);

// Get all bookings for a specific business
bookingRoutes.get("/businesses/:businessId/bookings", auth, BookingController.getBusinessBookings);

// Get booking trends for a business
bookingRoutes.get("/businesses/:businessId/booking-trends", auth, BookingController.getBookingTrends);

// Get available slots for STAFF individual bookings
bookingRoutes.get(
  "/businesses/:businessId/services/:serviceId/available-slots",
  BookingController.getAvailableSlots
);

// ==================== BUSINESS BOOKING ROUTES ====================
// BUSINESS PUBLIC booking - no authentication required
bookingRoutes.post("/business/public", BookingController.createBusinessPublicBooking);

// BUSINESS booking for authenticated users - requires auth
bookingRoutes.post("/business", auth, BookingController.createBusinessBooking);

// Get available slots for BUSINESS bookings (with staff/timeoff checking)
bookingRoutes.get(
  "/business/businesses/:businessId/services/:serviceId/available-slots",
  BookingController.getBusinessAvailableSlots
);


// Get all bookings for a specific user/customer
bookingRoutes.get("/users/:userId/bookings", auth, BookingController.getCustomerBookings);

export default bookingRoutes;
