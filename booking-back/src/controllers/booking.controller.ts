import { Request, Response } from "express";
import BookingService from "../services/booking.service"; // Adjust path as needed
import type { BookingStatus } from "../../prisma/src/generated/prisma/client";

class BookingController {
  /**
   * Create a new booking
   */
  async createBooking(req: Request, res: Response): Promise<void> {
    try {
      const booking = await BookingService.createBooking(req.body);
      res.status(201).json(booking);
    } catch (error) {
      res.status(500).json({ message: "Error creating booking", error });
    }
  }

  /**
   * Get booking by ID
   */
  async getBookingById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const booking = await BookingService.getBookingById(Array.isArray(id) ? id[0] : id);
      if (booking) {
        res.status(200).json(booking);
      } else {
        res.status(404).json({ message: "Booking not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error getting booking", error });
    }
  }

  /**
   * Get all bookings for a business
   */
  async getBusinessBookings(req: Request, res: Response): Promise<void> {
    try {
      const { businessId } = req.params;
      const { page, limit, status } = req.query;

      const result = await BookingService.getBusinessBookings(
        Array.isArray(businessId) ? businessId[0] : businessId,
        page ? parseInt(page as string) : 1,
        limit ? parseInt(limit as string) : 10,
        status as BookingStatus | undefined
      );

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Error getting business bookings", error });
    }
  }

  /**
   * Get bookings for a customer
   */
  async getCustomerBookings(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const bookings = await BookingService.getCustomerBookings(Array.isArray(userId) ? userId[0] : userId);
      res.status(200).json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Error getting customer bookings", error });
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const booking = await BookingService.updateBookingStatus(Array.isArray(id) ? id[0] : id, status);
      res.status(200).json(booking);
    } catch (error) {
      res.status(500).json({ message: "Error updating booking status", error });
    }
  }

  /**
   * Update booking
   */
  async updateBooking(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const booking = await BookingService.updateBooking(Array.isArray(id) ? id[0] : id, req.body);
      res.status(200).json(booking);
    } catch (error) {
      res.status(500).json({ message: "Error updating booking", error });
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const booking = await BookingService.cancelBooking(Array.isArray(id) ? id[0] : id);
      res.status(200).json(booking);
    } catch (error) {
      res.status(500).json({ message: "Error canceling booking", error });
    }
  }

  /**
   * Delete booking
   */
  async deleteBooking(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await BookingService.deleteBooking(Array.isArray(id) ? id[0] : id);
      res.status(204).send(); // No Content
    } catch (error) {
      res.status(500).json({ message: "Error deleting booking", error });
    }
  }

  /**
   * Get available slots
   */
  async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId, businessId } = req.params;
      const { date } = req.query;

      if (!date) {
        res.status(400).json({ message: "Date query parameter is required" });
        return;
      }

      const slots = await BookingService.getAvailableSlots(
        Array.isArray(serviceId) ? serviceId[0] : serviceId,
        Array.isArray(businessId) ? businessId[0] : businessId,
        new Date(date as string)
      );
      res.status(200).json(slots);
    } catch (error) {
      res.status(500).json({ message: "Error getting available slots", error });
    }
  }

  /**
   * Get booking trends
   */
  async getBookingTrends(req: Request, res: Response): Promise<void> {
    try {
      const { businessId } = req.params;
      const { days } = req.query;

      const trends = await BookingService.getBookingTrends(
        Array.isArray(businessId) ? businessId[0] : businessId,
        days ? parseInt(days as string) : 30
      );
      res.status(200).json(trends);
    } catch (error) {
      res.status(500).json({ message: "Error getting booking trends", error });
    }
  }
}

export default new BookingController();
