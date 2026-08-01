import { Router } from "express";
import BookingController from "../controllers/booking.controller";

const bookingRoutes = Router();


bookingRoutes.post("/public", BookingController.createPublicBooking);
// Create a new booking - handle both /bookings and direct POST
bookingRoutes.post("/", BookingController.createBooking);


// Get a single booking by its ID
bookingRoutes.get("/bookings/:id", BookingController.getBookingById);

// Update a booking's information
bookingRoutes.put("/bookings/:id", BookingController.updateBooking);

// Update a booking's status
bookingRoutes.patch("/bookings/:id/status", BookingController.updateBookingStatus);

// Cancel a booking
bookingRoutes.patch("/bookings/:id/cancel", BookingController.cancelBooking);

// Delete a booking
bookingRoutes.delete("/bookings/:id", BookingController.deleteBooking);

// Get all bookings for a specific business
bookingRoutes.get("/businesses/:businessId/bookings", BookingController.getBusinessBookings);

// Get booking trends for a business
bookingRoutes.get("/businesses/:businessId/booking-trends", BookingController.getBookingTrends);

// Get available slots for a service at a business
bookingRoutes.get(
  "/businesses/:businessId/services/:serviceId/available-slots",
  BookingController.getAvailableSlots
);

// Get all bookings for a specific user/customer
bookingRoutes.get("/users/:userId/bookings", BookingController.getCustomerBookings);

export default bookingRoutes;
