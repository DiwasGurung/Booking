import { Request, Response } from "express";
import BookingService from "../services/booking.service";
import NotificationService from "../services/notification.service";
import NotificationSSEService from "../services/notification-sse.service";
import { emailService } from "../services/email.service";
import SubscriptionService from "../services/subscription.service";
import prisma from "../lib/prisma";
import { CreateBookingSchema, parseAndValidate } from "../validators";
import type { BookingStatus } from "@prisma/client";

class BookingController {
  /**
   * Create a new booking
   */
  async createBooking(req: Request, res: Response): Promise<void> {
    try {
      console.log('[v0] createBooking called with body:', req.body)
      
      // Get userId from authenticated user or request body
      const userId = (req as any).user?.id || req.body.userId
      
      if (!userId) {
      res.status(400).json({ 
          message: "User ID is required. Please log in to create a booking."
        })
          return
      }

      // Validate request body
      const bodyValidation = parseAndValidate(CreateBookingSchema, req.body)
      if (!bodyValidation.success) {
         res.status(400).json({ message: bodyValidation.error })
         return
      }
  
      // Check subscription and feature gating
      const { businessId } = bodyValidation.data
      const appointmentLimit = await SubscriptionService.canAddAppointment(businessId)
      
      if (!appointmentLimit.allowed) {
        console.warn('[v0] Booking limit exceeded for business:', businessId)
         res.status(429).json({
          message: appointmentLimit.reason || 'Booking limit reached. Please upgrade your subscription.',
          error: 'LIMIT_EXCEEDED',
        })
            return
      }
      
      const startTime = new Date(bodyValidation.data.appointmentDate)
      if (Number.isNaN(startTime.getTime())) {
        res.status(400).json({ message: 'Invalid appointment date format' })
        return
      }

      const service = await prisma.service.findUnique({
        where: { id: bodyValidation.data.serviceId }
      })

      if (!service) {
        res.status(404).json({ message: 'Service not found' })
        return
      }

      const { appointmentDate, ...bookingFields } = bodyValidation.data
      const bookingData = {
        ...bookingFields,
        userId,
        startTime,
        endTime: new Date(startTime.getTime() + service.duration * 60000),
      }
      
      const booking = await BookingService.createBooking(bookingData)
      console.log('[v0] Booking created successfully:', booking)

      // Send email notification to business owner
      try {
        // Get business with owner user info
        const business = await prisma.business.findUnique({
          where: { id: booking.businessId },
          include: {
            user: true,
          }
        })

        if (business?.user?.email) {
          // Get service and staff details
          const service = await prisma.service.findUnique({
            where: { id: booking.serviceId }
          })

          let staffName: string | undefined
          if (booking.staffId) {
            const staff = await prisma.staff.findUnique({
              where: { id: booking.staffId }
            })
            if (staff) {
              staffName = `${staff.firstName} ${staff.lastName}`
            }
          }

          await emailService.sendNewBookingNotification(business.user.email, {
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            customerPhone: booking.customerPhone,
            serviceName: service?.name || 'Service',
            staffName,
            startTime: booking.startTime,
            endTime: booking.endTime,
            businessName: business.name,
            notes: booking.notes || undefined,
          })

          console.log('[v0] Email notification sent to business owner:', business.user.email)
        }
      } catch (emailError) {
        // Don't fail the booking if email fails
        console.error('[v0] Failed to send email notification to owner:', emailError)
      }

      // // Send SMS notification to business owner
      // try {
      //   // Get business with owner user info
      //   const business = await prisma.business.findUnique({
      //     where: { id: booking.businessId },
      //     include: {
      //       user: true,
      //       subscription: true
      //     }
      //   })

      //   if (business?.user?.phone && business.user.phone.length > 0) {
      //     // Check SMS quota
      //     const quotaCheck = await SubscriptionSmsService.checkSmsQuota(booking.businessId)
          
      //     if (!quotaCheck.available) {
      //       console.warn('[v0] SMS quota exceeded for business:', booking.businessId)
      //       console.warn('[v0] Remaining SMS:', quotaCheck.remaining, 'Limit:', quotaCheck.limit)
      //     } else {
      //       // Get service and staff details
      //       const service = await prisma.service.findUnique({
      //         where: { id: booking.serviceId }
      //       })

      //       let staffName: string | undefined
      //       if (booking.staffId) {
      //         const staff = await prisma.staff.findUnique({
      //           where: { id: booking.staffId }
      //         })
      //         if (staff) {
      //           staffName = `${staff.firstName} ${staff.lastName}`
      //         }
      //       }

      //       const formattedDate = booking.startTime.toLocaleDateString('en-US', {
      //         month: 'short',
      //         day: 'numeric',
      //         year: 'numeric',
      //       })

      //       const formattedTime = booking.startTime.toLocaleTimeString('en-US', {
      //         hour: '2-digit',
      //         minute: '2-digit',
      //       })

      //       const smsResult = await SparrowSMSService.sendOwnerNotification(business.user.phone, {
      //         customerName: booking.customerName,
      //         customerPhone: booking.customerPhone,
      //         serviceName: service?.name || 'Service',
      //         staffName,
      //         date: formattedDate,
      //         time: formattedTime,
      //         businessName: business.name,
      //       })

      //       if (smsResult.success) {
      //         // Increment SMS usage
      //         await SubscriptionSmsService.incrementSmsUsage(booking.businessId, 1, business.subscription?.id)
      //         console.log('[v0] SMS notification sent to business owner:', business.user.phone)
              
      //         // Log SMS attempt
      //         await SubscriptionSmsService.logSmsAttempt({
      //           businessId: booking.businessId,
      //           subscriptionId: business.subscription?.id,
      //           phoneNumber: business.user.phone,
      //           message: `New booking from ${booking.customerName}`,
      //           type: 'owner_notification',
      //           status: 'SENT',
      //           messageId: smsResult.messageId,
      //         })
      //       } else {
      //         console.error('[v0] Failed to send SMS notification:', smsResult.error)
              
      //         // Log failed SMS attempt
      //         await SubscriptionSmsService.logSmsAttempt({
      //           businessId: booking.businessId,
      //           subscriptionId: business.subscription?.id,
      //           phoneNumber: business.user.phone,
      //           message: `New booking from ${booking.customerName}`,
      //           type: 'owner_notification',
      //           status: 'FAILED',
      //           errorMessage: smsResult.error,
      //         })
      //       }
      //     }
      //   }
      // } catch (smsError) {
      //   // Don't fail the booking if SMS fails
      //   console.error('[v0] Failed to send SMS notification to owner:', smsError)
      // }

      // res.status(201).json(booking)
    } catch (error) {
      console.error('[v0] Error creating booking:', error instanceof Error ? error.message : String(error))
      res.status(500).json({ 
        message: "Error creating booking", 
        error: error instanceof Error ? error.message : String(error)
      })
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
      const { id } = req.params
      const { status } = req.body

      console.log('[v0] updateBookingStatus called with id:', id, 'status:', status)

      // Fetch booking before updating to get all relations
      const booking = await BookingService.getBookingById(Array.isArray(id) ? id[0] : id)

      if (!booking) {
        res.status(404).json({
          success: false,
          message: 'Booking not found',
        })
        return
      }

      // Update the booking status
      const updatedBooking = await BookingService.updateBookingStatus(
        Array.isArray(id) ? id[0] : id,
        status
      )

      console.log('[v0] Booking status updated to:', status)

      // Send notification based on status
      try {
        console.log('[v0] Creating notification for booking status:', status, 'userId:', booking?.userId)
        
        if (!booking?.userId) {
          console.warn('[v0] Warning: booking.userId is null or undefined')
          return
        }

        // Fetch business name for notification messages
        const business = await prisma.business.findUnique({
          where: { id: booking.businessId },
          select: { name: true }
        })
        const businessName = business?.name || 'the business'
        
        if (status === 'CONFIRMED') {
          console.log('[v0] Sending confirmation notification for booking:', booking.id, 'userId:', booking.userId)
          const notification = await NotificationService.sendBookingConfirmation(booking.id, booking.userId)
          console.log('[v0] Confirmation notification created:', JSON.stringify(notification))
          
          // Broadcast real-time notification
          NotificationSSEService.broadcastToUser(booking.userId, {
            id: notification.id,
            title: 'Booking Confirmed',
            message: `Your booking has been confirmed!`,
            type: 'BOOKING_CONFIRMATION',
            createdAt: new Date(),
          })
        } else if (status === 'COMPLETED') {
          console.log('[v0] Sending completion notification for booking:', booking.id, 'userId:', booking.userId)
          const notification = await NotificationService.createNotification({
            userId: booking.userId,
            type: 'BOOKING_CONFIRMATION',
            title: 'Booking Completed',
            message: `Your booking with ${businessName} has been completed. Please leave a review!`,
            bookingId: booking.id,
          })
          console.log('[v0] Completion notification created:', JSON.stringify(notification))
          
          // Broadcast real-time notification
          NotificationSSEService.broadcastToUser(booking.userId, {
            id: notification.id,
            title: 'Booking Completed',
            message: `Your booking with ${businessName} has been completed. Please leave a review!`,
            type: 'BOOKING_CONFIRMATION',
            createdAt: new Date(),
          })
        } else if (status === 'CANCELLED') {
          console.log('[v0] Sending cancellation notification for booking:', booking.id, 'userId:', booking.userId)
          const notification = await NotificationService.createNotification({
            userId: booking.userId,
            type: 'BOOKING_CANCELLATION',
            title: 'Booking Cancelled',
            message: `Your booking with ${businessName} has been cancelled.`,
            bookingId: booking.id,
          })
          console.log('[v0] Cancellation notification created:', JSON.stringify(notification))
          
          // Broadcast real-time notification
          NotificationSSEService.broadcastToUser(booking.userId, {
            id: notification.id,
            title: 'Booking Cancelled',
            message: `Your booking with ${businessName} has been cancelled.`,
            type: 'BOOKING_CANCELLATION',
            createdAt: new Date(),
          })
        }
      } catch (notificationError) {
        console.error('[v0] Error sending notification:', notificationError instanceof Error ? notificationError.message : notificationError)
        console.error('[v0] Full error:', notificationError)
        // Don't fail the request if notification fails
      }

      res.status(200).json({
        success: true,
        message: 'Booking status updated successfully',
        data: updatedBooking,
      })
    } catch (error) {
      console.error('[v0] Error updating booking status:', error)
      res.status(500).json({
        success: false,
        message: 'Error updating booking status',
        error: error instanceof Error ? error.message : String(error),
      })
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
   * Create a public booking (no authentication required)
   * Used for guest customers to book services without creating an account
   */
  async createPublicBooking(req: Request, res: Response): Promise<void> {
    try {
      console.log('[v0] createPublicBooking called with body:', req.body)
      
      const { businessId, serviceId, startTime, endTime, customerName, customerEmail, customerPhone, notes } = req.body

      // Validate required fields
      if (!businessId || !serviceId || !customerName || !customerEmail || !customerPhone) {
       res.status(400).json({ 
          success: false,
          message: "Missing required fields: businessId, serviceId, customerName, customerEmail, customerPhone"
        })
        return
      }

      // Verify business exists
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { user: true },
      })

      if (!business) {
         res.status(404).json({
          success: false,
          message: "Business not found"
        })
        return
      }

      // Verify service exists and belongs to this business
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      })

      if (!service || service.businessId !== businessId) {
         res.status(404).json({
          success: false,
          message: "Service not found"
        })
        return
      }

      // Create a guest booking without user authentication
      const booking = await prisma.booking.create({
        data: {
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          customerName,
          customerEmail,
          customerPhone,
          notes: notes || '',
          status: 'PENDING',
          service: { connect: { id: serviceId } },
          business: { connect: { id: businessId } },
          user: { connect: { id: business.userId } }, // Associate with business owner
        },
        include: {
          service: true,
          business: true,
        },
      })

      console.log('[v0] Public booking created:', booking.id)

      // Send email notification to business owner
      try {
        if (business.user?.email) {
          await emailService.sendNewBookingNotification(business.user.email, {
            customerName,
            customerEmail,
            customerPhone,
            serviceName: service.name,
            startTime: booking.startTime,
            endTime: booking.endTime,
            businessName: business.name,
            notes,
          })
          console.log('[v0] Owner notification email sent to:', business.user.email)
        }
      } catch (emailError) {
        console.error('[v0] Failed to send email to owner:', emailError)
        // Don't fail the booking if email fails
      }

      // Send confirmation email to customer
      try {
        await emailService.sendBookingConfirmationToCustomer(customerEmail, {
          customerName,
          serviceName: service.name,
          startTime: booking.startTime,
          endTime: booking.endTime,
          businessName: business.name,
          businessPhone: business.phone || '',
          businessAddress: business.address || '',
        })
        console.log('[v0] Customer confirmation email sent to:', customerEmail)
      } catch (emailError) {
        console.error('[v0] Failed to send confirmation email to customer:', emailError)
        // Don't fail the booking if email fails
      }

      res.status(201).json({
        success: true,
        message: 'Booking created successfully. Check your email for confirmation.',
        booking: {
          id: booking.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
        }
      })
    } catch (error) {
      console.error('[v0] Error creating public booking:', error instanceof Error ? error.message : String(error))
      res.status(500).json({
        success: false,
        message: "Error creating booking",
        error: error instanceof Error ? error.message : String(error)
      })
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
