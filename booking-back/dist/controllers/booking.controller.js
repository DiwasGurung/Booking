"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const booking_service_1 = __importDefault(require("../services/booking.service")); // Adjust path as needed
class BookingController {
    /**
     * Create a new booking
     */
    async createBooking(req, res) {
        try {
            const booking = await booking_service_1.default.createBooking(req.body);
            res.status(201).json(booking);
        }
        catch (error) {
            res.status(500).json({ message: "Error creating booking", error });
        }
    }
    /**
     * Get booking by ID
     */
    async getBookingById(req, res) {
        try {
            const { id } = req.params;
            const booking = await booking_service_1.default.getBookingById(Array.isArray(id) ? id[0] : id);
            if (booking) {
                res.status(200).json(booking);
            }
            else {
                res.status(404).json({ message: "Booking not found" });
            }
        }
        catch (error) {
            res.status(500).json({ message: "Error getting booking", error });
        }
    }
    /**
     * Get all bookings for a business
     */
    async getBusinessBookings(req, res) {
        try {
            const { businessId } = req.params;
            const { page, limit, status } = req.query;
            const result = await booking_service_1.default.getBusinessBookings(Array.isArray(businessId) ? businessId[0] : businessId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 10, status);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ message: "Error getting business bookings", error });
        }
    }
    /**
     * Get bookings for a customer
     */
    async getCustomerBookings(req, res) {
        try {
            const { userId } = req.params;
            const bookings = await booking_service_1.default.getCustomerBookings(Array.isArray(userId) ? userId[0] : userId);
            res.status(200).json(bookings);
        }
        catch (error) {
            res.status(500).json({ message: "Error getting customer bookings", error });
        }
    }
    /**
     * Update booking status
     */
    async updateBookingStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const booking = await booking_service_1.default.updateBookingStatus(Array.isArray(id) ? id[0] : id, status);
            res.status(200).json(booking);
        }
        catch (error) {
            res.status(500).json({ message: "Error updating booking status", error });
        }
    }
    /**
     * Update booking
     */
    async updateBooking(req, res) {
        try {
            const { id } = req.params;
            const booking = await booking_service_1.default.updateBooking(Array.isArray(id) ? id[0] : id, req.body);
            res.status(200).json(booking);
        }
        catch (error) {
            res.status(500).json({ message: "Error updating booking", error });
        }
    }
    /**
     * Cancel booking
     */
    async cancelBooking(req, res) {
        try {
            const { id } = req.params;
            const booking = await booking_service_1.default.cancelBooking(Array.isArray(id) ? id[0] : id);
            res.status(200).json(booking);
        }
        catch (error) {
            res.status(500).json({ message: "Error canceling booking", error });
        }
    }
    /**
     * Delete booking
     */
    async deleteBooking(req, res) {
        try {
            const { id } = req.params;
            await booking_service_1.default.deleteBooking(Array.isArray(id) ? id[0] : id);
            res.status(204).send(); // No Content
        }
        catch (error) {
            res.status(500).json({ message: "Error deleting booking", error });
        }
    }
    /**
     * Get available slots
     */
    async getAvailableSlots(req, res) {
        try {
            const { serviceId, businessId } = req.params;
            const { date } = req.query;
            if (!date) {
                res.status(400).json({ message: "Date query parameter is required" });
                return;
            }
            const slots = await booking_service_1.default.getAvailableSlots(Array.isArray(serviceId) ? serviceId[0] : serviceId, Array.isArray(businessId) ? businessId[0] : businessId, new Date(date));
            res.status(200).json(slots);
        }
        catch (error) {
            res.status(500).json({ message: "Error getting available slots", error });
        }
    }
    /**
     * Get booking trends
     */
    async getBookingTrends(req, res) {
        try {
            const { businessId } = req.params;
            const { days } = req.query;
            const trends = await booking_service_1.default.getBookingTrends(Array.isArray(businessId) ? businessId[0] : businessId, days ? parseInt(days) : 30);
            res.status(200).json(trends);
        }
        catch (error) {
            res.status(500).json({ message: "Error getting booking trends", error });
        }
    }
}
exports.default = new BookingController();
