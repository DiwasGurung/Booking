"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const notification_service_js_1 = __importDefault(require("../services/notification.service.js"));
class NotificationController {
    /**
     * Create notification
     */
    async create(req, res) {
        try {
            const notification = await notification_service_js_1.default.createNotification(req.body);
            res.status(201).json(notification);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to create notification", error });
        }
    }
    /**
     * Get notification by ID
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const notification = await notification_service_js_1.default.getNotificationById(id);
            if (!notification) {
                return res.status(404).json({ message: "Notification not found" });
            }
            res.json(notification);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch notification", error });
        }
    }
    /**
     * Get user notifications
     */
    async getUserNotifications(req, res) {
        try {
            const { userId } = req.params;
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            const unreadOnly = req.query.unreadOnly === "true";
            const result = await notification_service_js_1.default.getUserNotifications(userId, page, limit, unreadOnly);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch notifications", error });
        }
    }
    /**
     * Mark notification as read
     */
    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const notification = await notification_service_js_1.default.markAsRead(id);
            res.json(notification);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to mark notification as read", error });
        }
    }
    /**
     * Mark all notifications as read
     */
    async markAllAsRead(req, res) {
        try {
            const { userId } = req.params;
            const count = await notification_service_js_1.default.markAllAsRead(userId);
            res.json({ updated: count });
        }
        catch (error) {
            res.status(500).json({ message: "Failed to mark notifications as read", error });
        }
    }
    /**
     * Delete notification
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const notification = await notification_service_js_1.default.deleteNotification(id);
            res.json(notification);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to delete notification", error });
        }
    }
    /**
     * Get unread notifications count
     */
    async unreadCount(req, res) {
        try {
            const { userId } = req.params;
            const count = await notification_service_js_1.default.getUnreadCount(userId);
            res.json({ unreadCount: count });
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch unread count", error });
        }
    }
}
exports.default = new NotificationController();
