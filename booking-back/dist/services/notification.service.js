"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const prisma_1 = require("../lib/prisma");
class NotificationService {
    /**
     * Create a new notification
     */
    async createNotification(data) {
        return prisma_1.prisma.notification.create({
            data,
        });
    }
    /**
     * Get notification by ID
     */
    async getNotificationById(id) {
        return prisma_1.prisma.notification.findUnique({
            where: { id },
        });
    }
    /**
     * Get user notifications
     */
    async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
        const skip = (page - 1) * limit;
        const where = { userId };
        if (unreadOnly)
            where.isRead = false;
        const [notifications, total] = await Promise.all([
            prisma_1.prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma_1.prisma.notification.count({ where }),
        ]);
        return { notifications, total };
    }
    /**
     * Mark notification as read
     */
    async markAsRead(id) {
        return prisma_1.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }
    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId) {
        const result = await prisma_1.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return result.count;
    }
    /**
     * Delete notification
     */
    async deleteNotification(id) {
        return prisma_1.prisma.notification.delete({
            where: { id },
        });
    }
    /**
     * Get unread count
     */
    async getUnreadCount(userId) {
        return prisma_1.prisma.notification.count({
            where: { userId, isRead: false },
        });
    }
    /**
     * Send booking confirmation notification
     */
    async sendBookingConfirmation(bookingId, userId) {
        return this.createNotification({
            userId,
            bookingId,
            type: "BOOKING_CONFIRMATION",
            title: "Booking Confirmed",
            message: "Your booking has been confirmed. Check your email for details.",
        });
    }
    /**
     * Send booking reminder
     */
    async sendBookingReminder(bookingId, userId) {
        return this.createNotification({
            userId,
            bookingId,
            type: "BOOKING_REMINDER",
            title: "Appointment Reminder",
            message: "Your appointment is coming up soon!",
        });
    }
    /**
     * Send payment received notification
     */
    async sendPaymentReceivedNotification(userId, amount) {
        return this.createNotification({
            userId,
            type: "PAYMENT_RECEIVED",
            title: "Payment Received",
            message: `Payment of $${amount} has been received successfully.`,
        });
    }
}
exports.NotificationService = NotificationService;
exports.default = new NotificationService();
