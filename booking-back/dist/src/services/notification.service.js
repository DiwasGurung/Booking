"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class NotificationService {
    /**
     * Create a new notification
     */
    createNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.notification.create({
                data,
            });
        });
    }
    /**
     * Get notification by ID
     */
    getNotificationById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.notification.findUnique({
                where: { id },
            });
        });
    }
    /**
     * Get user notifications
     */
    getUserNotifications(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 20, unreadOnly = false) {
            const skip = (page - 1) * limit;
            const where = { userId };
            if (unreadOnly)
                where.isRead = false;
            const [notifications, total] = yield Promise.all([
                prisma_1.default.notification.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                }),
                prisma_1.default.notification.count({ where }),
            ]);
            return { notifications, total };
        });
    }
    /**
     * Mark notification as read
     */
    markAsRead(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.notification.update({
                where: { id },
                data: { isRead: true },
            });
        });
    }
    /**
     * Mark all notifications as read for a user
     */
    markAllAsRead(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield prisma_1.default.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true },
            });
            return result.count;
        });
    }
    /**
     * Delete notification
     */
    deleteNotification(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.notification.delete({
                where: { id },
            });
        });
    }
    /**
     * Get unread count
     */
    getUnreadCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.notification.count({
                where: { userId, isRead: false },
            });
        });
    }
    /**
     * Send booking confirmation notification
     */
    sendBookingConfirmation(bookingId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.createNotification({
                userId,
                bookingId,
                type: "BOOKING_CONFIRMATION",
                title: "Booking Confirmed",
                message: "Your booking has been confirmed. Check your email for details.",
            });
        });
    }
    /**
     * Send booking reminder
     */
    sendBookingReminder(bookingId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.createNotification({
                userId,
                bookingId,
                type: "BOOKING_REMINDER",
                title: "Appointment Reminder",
                message: "Your appointment is coming up soon!",
            });
        });
    }
    /**
     * Send payment received notification
     */
    sendPaymentReceivedNotification(userId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.createNotification({
                userId,
                type: "PAYMENT_RECEIVED",
                title: "Payment Received",
                message: `Payment of $${amount} has been received successfully.`,
            });
        });
    }
}
exports.NotificationService = NotificationService;
exports.default = new NotificationService();
