import { Request, Response } from "express";
import { randomBytes } from "crypto";
import BookingService from "../services/booking.service.js";
import NotificationService from "../services/notification.service.js";
import NotificationSSEService from "../services/notification-sse.service.js";
import { emailService } from "../services/email.service.js";
import SubscriptionService from "../services/subscription.service.js";
import prisma from "../lib/prisma.js";
import { CreateBookingSchema, parseAndValidate } from "../validators/index.js";
import type { BookingStatus } from "@prisma/client";

class BookingController {

  /**
   * Create a booking for BUSINESS - Authenticated User
   * Separate from staff individual bookings to keep flows independent
   */
  async createBusinessBooking(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = (req as any).userId
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: "User ID is required. Please log in to create a booking."
        })
      }

      const { businessId, staffId, serviceId, startTime: bodyStartTime, endTime: bodyEndTime, notes } = req.body
      const startTime = bodyStartTime ? new Date(bodyStartTime) : null
      const endTime = bodyEndTime ? new Date(bodyEndTime) : null

      if (!businessId || !serviceId || !startTime) {
        return res.status(400).json({ 
          success: false,
          message: "Missing required fields: businessId, serviceId, startTime"
        })
      }

      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" })
      }

      // Get service for duration
      const service = await prisma.service.findUnique({ where: { id: serviceId } })
      if (!service) {
        return res.status(404).json({ success: false, message: "Service not found" })
      }

      const finalEndTime = endTime || new Date(startTime.getTime() + (service.duration || 60) * 60000)

      // Auto-assign staff if not provided
      let assignedStaffId = staffId
      if (!assignedStaffId) {
        const availableStaff = await prisma.staff.findFirst({
          where: {
            businessId,
            services: { some: { serviceId } }
          }
        })
        if (!availableStaff) {
          return res.status(400).json({
            success: false,
            message: "No staff members are assigned to this service."
          })
        }
        assignedStaffId = availableStaff.id
      }

      const booking = await prisma.booking.create({
        data: {
          startTime,
          endTime: finalEndTime,
          customerName: `${user.firstName} ${user.lastName}`.trim() || 'Guest',
          customerEmail: user.email,
          customerPhone: user.phone || '',
          notes: notes || '',
          status: 'CONFIRMED',
          isEmailVerified: true,
          user: { connect: { id: userId } },
          service: { connect: { id: serviceId } },
          business: { connect: { id: businessId } },
          staff: { connect: { id: assignedStaffId } }
        }
      })

      return res.status(201).json({
        success: true,
        message: "Booking created successfully!",
        booking: { id: booking.id }
      })
    } catch (error: any) {
      console.error('[v0] Business booking error:', error)
      res.status(500).json({ success: false, error: error?.message || "Failed to create booking" })
    }
  }

  /**
   * Create a BUSINESS PUBLIC booking for guests
   * Separate from staff individual bookings to keep flows independent
   */
  async createBusinessPublicBooking(req: Request, res: Response): Promise<Response | void> {
    try {
      const { businessId, staffId, serviceId, startTime: bodyStartTime, endTime: bodyEndTime, customerName, customerEmail, customerPhone, notes } = req.body
      const startTime = bodyStartTime ? new Date(bodyStartTime) : null

      if (!businessId || !serviceId || !startTime || !customerEmail) {
        return res.status(400).json({ 
          success: false,
          message: "Missing required fields"
        })
      }

      const service = await prisma.service.findUnique({ where: { id: serviceId } })
      if (!service) {
        return res.status(404).json({ success: false, message: "Service not found" })
      }

      const finalEndTime = bodyEndTime ? new Date(bodyEndTime) : new Date(startTime.getTime() + (service.duration || 60) * 60000)

      // Check/create customer
      let customer = await prisma.customer.findUnique({
        where: { businessId_email: { businessId, email: customerEmail } }
      })

      if (!customer) {
        customer = await prisma.customer.create({
          data: { businessId, name: customerName, email: customerEmail, phone: customerPhone || '' }
        })
      }

      // Auto-assign staff if not provided
      let assignedStaffId = staffId
      if (!assignedStaffId) {
        const availableStaff = await prisma.staff.findFirst({
          where: { businessId, services: { some: { serviceId } } }
        })
        if (!availableStaff) {
          return res.status(400).json({
            success: false,
            message: "No staff members are assigned to this service."
          })
        }
        assignedStaffId = availableStaff.id
      }

      // Generate verification token
      const verificationToken = randomBytes(32).toString('hex')
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const booking = await prisma.booking.create({
        data: {
          startTime,
          endTime: finalEndTime,
          customerName,
          customerEmail,
          customerPhone: customerPhone || '',
          notes: notes || '',
          status: 'UNVERIFIED',
          isEmailVerified: false,
          verificationToken,
          verificationTokenExpires,
          customer: { connect: { id: customer.id } },
          service: { connect: { id: serviceId } },
          business: { connect: { id: businessId } },
          staff: { connect: { id: assignedStaffId } }
          
        }
        ,
        include: { staff: true }
      })

      // Send verification email with booking details
      try {
        const bookingDate = startTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        const bookingTime = startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        
        await emailService.sendVerificationCustomerEmail(customerEmail, verificationToken, {
          customerName,
          serviceName: service.name,
          date: bookingDate,
          time: bookingTime,
          staffName: booking.staff?.firstName ? `${booking.staff.firstName} ${booking.staff.lastName}`.trim() : undefined,
        })
      } catch (emailError) {
        console.error('[v0] Failed to send verification email:', emailError)
      }

      return res.status(201).json({
        success: true,
        message: "Booking created! Check your email to verify.",
        booking: { id: booking.id }
      })
    } catch (error: any) {
      console.error('[v0] Business public booking error:', error)
      res.status(500).json({ success: false, error: error?.message || "Failed to create booking" })
    }
  }

  /**
   * Get available slots for BUSINESS BOOKINGS
   * Separate from staff individual bookings to keep flows independent
   */
  async getBusinessAvailableSlots(req: Request, res: Response): Promise<Response |void> {
    try {
      const { serviceId, businessId } = req.params
      const { date, staffId } = req.query

      if (!date) {
        return res.status(400).json({ success: false, error: "Date query parameter is required" })
      }

      const dateStr = (Array.isArray(date) ? date[0] : date) as string
      const [year, month, day] = dateStr.split('-').map(Number)
      const parsedDate = new Date(year, month - 1, day)
      // Ensure staffIdStr is a string or undefined (req.query can contain ParsedQs)
      const staffIdStr = typeof staffId === 'string' ? staffId : undefined

      const slots = await BookingService.getBusinessAvailableSlots(
        Array.isArray(serviceId) ? serviceId[0] : serviceId,
        Array.isArray(businessId) ? businessId[0] : businessId,
        parsedDate,
        staffIdStr
      )

      res.status(200).json({ success: true, data: slots })
    } catch (error: any) {
      console.error('[v0] Error getting business available slots:', error)
      res.status(500).json({ success: false, error: error?.message || "Error getting available slots" })
    }
  }

  /**
   * Create a new booking for authenticated users
   */
  async createBooking(req: Request, res: Response): Promise<Response | void> {
    try {
      console.log('[v0] createBooking called with body:', req.body)
      
      // Get userId from authenticated user (set by auth middleware)
      const userId = (req as any).userId
      
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: "User ID is required. Please log in to create a booking."
        })
      }

      const { businessId, staffId, serviceId, startTime: bodyStartTime, endTime: bodyEndTime, notes } = req.body

      // Parse dates
      const startTime = bodyStartTime ? new Date(bodyStartTime) : null
      const endTime = bodyEndTime ? new Date(bodyEndTime) : null

      // Validate required fields
      if (!businessId || !serviceId || !startTime) {
        return res.status(400).json({ 
          success: false,
          message: "Missing required fields: businessId, serviceId, startTime"
        })
      }

      // Check subscription and feature gating
      const appointmentLimit = await SubscriptionService.canAddAppointment(businessId)
      
      if (!appointmentLimit.allowed) {
        console.warn('[v0] Booking limit exceeded for business:', businessId)
        return res.status(429).json({
          success: false,
          message: appointmentLimit.reason || 'Booking limit reached. Please upgrade your subscription.',
          error: 'LIMIT_EXCEEDED',
        })
      }

      // Verify business exists
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { user: true },
      })

      if (!business) {
        return res.status(404).json({
          success: false,
          message: "Business not found"
        })
      }

      // Validate business owner's email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(business.user.email)) {
        return res.status(400).json({
          success: false,
          message: `The business owner's email has an invalid format. Please contact the business.`,
          reason: 'invalid_email_format'
        })
      }

      // Verify service exists and belongs to this business
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      })

      if (!service || service.businessId !== businessId) {
        return res.status(404).json({
          success: false,
          message: "Service not found"
        })
      }

      // Verify staff exists if provided
      if (staffId) {
        const staff = await prisma.staff.findUnique({
          where: { id: staffId },
        })

        if (!staff || staff.businessId !== businessId) {
          return res.status(404).json({
            success: false,
            message: "Staff member not found"
          })
        }
      }

      // Get authenticated user details for booking
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        })
      }

      // Calculate end time if not provided
      const finalEndTime = endTime || new Date(startTime.getTime() + (service.duration || 60) * 60000)


      // Create booking for authenticated user with CONFIRMED status (no email verification needed)
      const bookingData: any = {
        startTime,
        endTime: finalEndTime,
        customerName: `${(user.firstName || '') + ' ' + (user.lastName || '')}`.trim() || 'Guest',
        customerEmail: user.email,
        customerPhone: user.phone || '',
        notes: notes || '',
        status: 'CONFIRMED', // Authenticated users are immediately confirmed
        isEmailVerified: true, // Already verified since user is authenticated
        user: { connect: { id: userId } }, // Link to authenticated user using relation
        service: { connect: { id: serviceId } },
        business: { connect: { id: businessId } },
      }

      // Add staffId if provided
      if (staffId) {
        bookingData.staff = { connect: { id: staffId } }
      }

      const booking = await prisma.booking.create({
        data: bookingData,
        include: {
          service: true,
          business: true,
          staff: true,
          user: true,
        },
      })

      console.log('[v0] Authenticated booking created (CONFIRMED):', booking.id)

      const emailWarnings: string[] = []

      // Send email notification to business owner
      try {
        if (business.user?.email) {
          const staffName = booking.staff ? `${booking.staff.firstName} ${booking.staff.lastName}`.trim() : undefined

          await emailService.sendNewBookingNotification(business.user.email, {
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            customerPhone: booking.customerPhone,
            serviceName: service.name,
            staffName,
            startTime: booking.startTime,
            endTime: booking.endTime,
            businessName: business.name,
            notes: booking.notes || undefined,
          })
          console.log('[v0] Owner notification email sent to:', business.user.email)
        }
      } catch (emailError: any) {
        console.error('[v0] Failed to send email to owner:', emailError)
        emailWarnings.push('Unable to notify business owner due to email delivery issue')
      }

      // Send confirmation email to authenticated user
      try {
        await emailService.sendBookingConfirmationToCustomer(booking.customerEmail, {
          customerName: booking.customerName,
          serviceName: service.name,
          startTime: booking.startTime,
          endTime: booking.endTime,
          businessName: business.name,
          businessPhone: business.phone || '',
          businessAddress: business.address || '',
        })
        console.log('[v0] Customer confirmation email sent to:', booking.customerEmail)
      } catch (emailError: any) {
        console.error('[v0] Failed to send confirmation email to customer:', emailError)
        emailWarnings.push('Confirmation email could not be sent to ' + booking.customerEmail)
      }

      res.status(201).json({
        success: true,
        message: emailWarnings.length > 0 
          ? 'Booking created successfully, but there were issues sending emails. Please contact the business directly.'
          : 'Booking created successfully. Check your email for confirmation.',
        warnings: emailWarnings.length > 0 ? emailWarnings : undefined,
        booking: {
          id: booking.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
        }
      })
    } catch (error) {
      console.error('[v0] Error creating authenticated booking:', error instanceof Error ? error.message : String(error))
      res.status(500).json({ 
        success: false,
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
  async getCustomerBookings(req: Request, res: Response): Promise<Response | void> {
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
  async updateBookingStatus(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params
      const { status } = req.body

      console.log('[v0] updateBookingStatus called with id:', id, 'status:', status)

      // Fetch booking before updating to get all relations
      const booking = await BookingService.getBookingById(Array.isArray(id) ? id[0] : id)

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        })
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
      const { date, staffId } = req.query;

      if (!date) {
        res.status(400).json({ 
          success: false,
          error: "Date query parameter is required" 
        });
        return;
      }

      // Parse date string "YYYY-MM-DD" properly to avoid timezone issues
      const dateStr = (Array.isArray(date) ? date[0] : date) as string
      const [year, month, day] = dateStr.split('-').map(Number)
      const parsedDate = new Date(year, month - 1, day)

      // Optional staffId - if provided, filter slots for that specific staff
      const staffIdStr = typeof staffId === 'string' ? staffId : undefined

      const slots = await BookingService.getAvailableSlots(
        Array.isArray(serviceId) ? serviceId[0] : serviceId,
        Array.isArray(businessId) ? businessId[0] : businessId,
        parsedDate,
        staffIdStr
      );
      
      res.status(200).json({ 
        success: true,
        data: slots 
      });
    } catch (error: any) {
      console.error('[v0] Error getting available slots:', error);
      res.status(500).json({ 
        success: false,
        error: error?.message || "Error getting available slots" 
      });
    }
  }

  /**
   * Create a public booking (no authentication required)
   * Used for guest customers to book services without creating an account
   */
  async createPublicBooking(req: Request, res: Response): Promise<Response | void> {
    try {
      const { businessId, staffId, serviceId, startTime, endTime, customerName, customerEmail, customerPhone, notes } = req.body

      // Validate required fields
      if (!businessId || !serviceId || !customerName || !customerEmail || !customerPhone) {
       res.status(400).json({ 
          success: false,
          message: "Missing required fields: businessId, serviceId, customerName, customerEmail, customerPhone"
        })
        return
      }

      // Validate customer email format (basic check only)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(customerEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
          reason: 'invalid_email_format'
        })
      }
      // Note: Full email validation will happen after customer verifies email

      // Verify business exists
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { user: true },
      })

      if (!business) {
        return res.status(404).json({
          success: false,
          message: "Business not found"
        })
      }

      // Validate business owner's email exists and is valid format
      if (!business.user?.email) {
        return res.status(400).json({
          success: false,
          message: "Business owner email is not configured. Please contact the business to update their contact information."
        })
      }

      // Validate business owner's email format (basic validation only)
      if (!emailRegex.test(business.user.email)) {
        return res.status(400).json({
          success: false,
          message: `The business owner's email (${business.user.email}) has an invalid format. The business owner needs to update their email address. Please contact the business to complete this setup.`,
          reason: 'invalid_email_format'
        })
      }

      // Verify service exists and belongs to this business
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      })

      if (!service || service.businessId !== businessId) {
        return res.status(404).json({
          success: false,
          message: "Service not found"
        })
      }

      // Verify staff exists if provided
      if (staffId) {
        const staff = await prisma.staff.findUnique({
          where: { id: staffId },
        })

        if (!staff || staff.businessId !== businessId) {
          return res.status(404).json({
            success: false,
            message: "Staff member not found"
          })
        }
      }

      // Check if customer already exists
      let customer
      let isNewCustomer = false
      
      const existingCustomer = await prisma.customer.findUnique({
        where: {
          businessId_email: {
            businessId,
            email: customerEmail,
          },
        },
      })

      if (existingCustomer) {
        // Existing customer - use the existing record
        customer = existingCustomer
        isNewCustomer = false
        console.log('[v0] Existing customer found:', customer.id)
      } else {
        // New customer - create a new record
        try {
          customer = await prisma.customer.create({
            data: {
              businessId,
              name: customerName,
              email: customerEmail,
              phone: customerPhone,
              notes: notes || '',
            },
          })
          isNewCustomer = true
          console.log('[v0] New guest customer created:', customer.id)
        } catch (err: any) {
          console.error('[v0] Error creating customer:', err)
          return res.status(500).json({
            success: false,
            message: "Failed to create customer",
            error: err.message,
          })
        }
      }

      // Generate verification token only for new customers (24 hours validity)
      let verificationToken = null
      let verificationTokenExpires = null
      
      if (isNewCustomer) {
        verificationToken = randomBytes(32).toString('hex')
        verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      }

      // Determine booking status: CONFIRMED for existing customers, UNVERIFIED for new customers
      const bookingStatus = isNewCustomer ? 'UNVERIFIED' : 'CONFIRMED'
      const isEmailVerified = isNewCustomer ? false : true

      // Create a guest booking
      const bookingData: any = {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        customerName,
        customerEmail,
        customerPhone,
        notes: notes || '',
        status: bookingStatus,
        isEmailVerified,
        ...(isNewCustomer && { verificationToken, verificationTokenExpires }),
        service: { connect: { id: serviceId } },
        business: { connect: { id: businessId } },
        customer: { connect: { id: customer.id } }, // Associate with guest customer
      }

      // Add staffId if provided
      if (staffId) {
        bookingData.staff = { connect: { id: staffId } }
      }

      const booking = await prisma.booking.create({
        data: bookingData,
        include: {
          service: true,
          business: true,
          staff: true,
          customer: true,
        },
      })

      console.log(`[v0] Public booking created (${bookingStatus}):`, booking.id)

      const emailWarnings: string[] = []

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
      } catch (emailError: any) {
        console.error('[v0] Failed to send email to owner:', emailError)
        emailWarnings.push('Unable to notify business owner due to email delivery issue')
      }

      // Send verification email only for NEW customers (existing customers are auto-confirmed)
      if (isNewCustomer && verificationToken) {
        try {
          const staffName = booking.staff ? `${booking.staff.firstName} ${booking.staff.lastName}`.trim() : undefined
          const verificationSent = await emailService.sendVerificationCustomerEmail(customerEmail, verificationToken, {
            customerName,
            serviceName: service.name,
            date: booking.startTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            time: booking.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            staffName,
          })
          
          if (!verificationSent) {
            emailWarnings.push('Verification email could not be sent. Please check your email spam folder or contact the business.')
          } else {
            console.log('[v0] Customer verification email sent to:', customerEmail)
          }
        } catch (emailError: any) {
          console.error('[v0] Failed to send verification email to customer:', emailError)
          emailWarnings.push('Verification email could not be sent to ' + customerEmail)
        }
      } else {
        console.log('[v0] Existing customer - booking auto-confirmed without verification')
      }

      res.status(201).json({
        success: true,
        message: isNewCustomer 
          ? (emailWarnings.length > 0 
              ? 'Booking created! Please verify your email to confirm your appointment.'
              : 'Booking created! Check your email to verify and confirm your appointment.')
          : 'Booking confirmed! Your appointment is scheduled.',
        warnings: emailWarnings.length > 0 ? emailWarnings : undefined,
        booking: {
          id: booking.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          isNewCustomer,
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
   * Verify booking email and confirm the booking
   * Called when customer clicks verification link in email
   */
  async verifyBookingEmail(req: Request, res: Response): Promise<Response | void> {
    try {
      const tokenParam = req.params.token
      const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Verification token is required"
        })
      }

      // Find booking by verification token
      const booking = await prisma.booking.findUnique({
        where: { verificationToken: token },
        include: { service: true, business: true }
      })

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found. The verification link may be invalid or expired."
        })
      }

      // Check if token has expired
      if (booking.verificationTokenExpires && booking.verificationTokenExpires < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Verification link has expired. Please create a new booking."
        })
      }

      // Check if already verified
      if (booking.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: "This booking has already been verified."
        })
      }

      // Update booking to CONFIRMED status and mark email as verified
      const confirmedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CONFIRMED',
          isEmailVerified: true,
          verificationToken: null, // Clear token after verification
          verificationTokenExpires: null,
        },
        include: { service: true, business: true, customer: true }
      })

      console.log('[v0] Booking verified and confirmed:', booking.id)

      // Send confirmation email to customer
      try {
        await emailService.sendBookingConfirmationToCustomer(booking.customerEmail, {
          customerName: booking.customerName,
          serviceName: confirmedBooking.service.name,
          startTime: confirmedBooking.startTime,
          endTime: confirmedBooking.endTime,
          businessName: confirmedBooking.business.name,
          businessPhone: confirmedBooking.business.phone || '',
          businessAddress: confirmedBooking.business.address || '',
        })
        console.log('[v0] Confirmation email sent to:', booking.customerEmail)
      } catch (emailError: any) {
        console.error('[v0] Failed to send confirmation email:', emailError)
        // Don't fail the verification if email send fails - booking is already confirmed
      }

      return res.status(200).json({
        success: true,
        message: 'Email verified! Your booking is now confirmed. Check your email for booking details.',
        booking: {
          id: confirmedBooking.id,
          startTime: confirmedBooking.startTime,
          endTime: confirmedBooking.endTime,
          status: confirmedBooking.status,
        }
      })
    } catch (error) {
      console.error('[v0] Error verifying booking email:', error instanceof Error ? error.message : String(error))
      res.status(500).json({
        success: false,
        message: "Error verifying booking",
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Get booking trends
   */
  async getBookingTrends(req: Request, res: Response): Promise<Response | void> {
    try {
      const { businessId } = req.params;
      const { days } = req.query;

      const trends = await BookingService.getBookingTrends(
        Array.isArray(businessId) ? businessId[0] : businessId,
        days ? parseInt(days as string) : 30
      );
      return res.status(200).json(trends);
    } catch (error) {
      res.status(500).json({ message: "Error getting booking trends", error });
    }
  }
}

export default new BookingController();
