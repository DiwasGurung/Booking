import  prisma  from "../lib/prisma.js"
import type { Notification, NotificationType, Prisma } from"@prisma/client"




export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(data: {
    userId: string
    type: NotificationType
    title: string
    message: string
    bookingId?: string
  }): Promise<Notification> {
    return prisma.notification.create({
      data,
    })
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({
      where: { id },
    })
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20,
    unreadOnly = false,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const skip = (page - 1) * limit

    const where: Prisma.NotificationWhereInput = { userId }
    if (unreadOnly) where.isRead = false

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
    ])

    return { notifications, total }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })

    return result.count
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: string): Promise<Notification> {
    return prisma.notification.delete({
      where: { id },
    })
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    })
  }

  /**
   * Send booking confirmation notification
   */
  async sendBookingConfirmation(bookingId: string, userId: string) {
    return this.createNotification({
      userId,
      bookingId,
      type: "BOOKING_CONFIRMATION",
      title: "Booking Confirmed",
      message: "Your booking has been confirmed. Check your email for details.",
    })
  }

  /**
   * Send booking reminder
   */
  async sendBookingReminder(bookingId: string, userId: string) {
    return this.createNotification({
      userId,
      bookingId,
      type: "BOOKING_REMINDER",
      title: "Appointment Reminder",
      message: "Your appointment is coming up soon!",
    })
  }

  /**
   * Send payment received notification
   */
  async sendPaymentReceivedNotification(userId: string, amount: number) {
    return this.createNotification({
      userId,
      type: "PAYMENT_RECEIVED",
      title: "Payment Received",
      message: `Payment of $${amount} has been received successfully.`,
    })
  }
}

export default new NotificationService()
