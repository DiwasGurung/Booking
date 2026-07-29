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
const notification_service_1 = __importDefault(require("../services/notification.service"));
class NotificationController {
    /**
     * Create notification
     */
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notification = yield notification_service_1.default.createNotification(req.body);
                res.status(201).json(notification);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to create notification", error });
            }
        });
    }
    /**
     * Get notification by ID
     */
    getById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const notification = yield notification_service_1.default.getNotificationById(id);
                if (!notification) {
                    return res.status(404).json({ message: "Notification not found" });
                }
                res.json(notification);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch notification", error });
            }
        });
    }
    /**
     * Get user notifications
     */
    getUserNotifications(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 20;
                const unreadOnly = req.query.unreadOnly === "true";
                const result = yield notification_service_1.default.getUserNotifications(userId, page, limit, unreadOnly);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch notifications", error });
            }
        });
    }
    /**
     * Mark notification as read
     */
    markAsRead(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const notification = yield notification_service_1.default.markAsRead(id);
                res.json(notification);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to mark notification as read", error });
            }
        });
    }
    /**
     * Mark all notifications as read
     */
    markAllAsRead(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const count = yield notification_service_1.default.markAllAsRead(userId);
                res.json({ updated: count });
            }
            catch (error) {
                res.status(500).json({ message: "Failed to mark notifications as read", error });
            }
        });
    }
    /**
     * Delete notification
     */
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const notification = yield notification_service_1.default.deleteNotification(id);
                res.json(notification);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to delete notification", error });
            }
        });
    }
    /**
     * Get unread notifications count
     */
    unreadCount(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const count = yield notification_service_1.default.getUnreadCount(userId);
                res.json({ unreadCount: count });
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch unread count", error });
            }
        });
    }
}
exports.default = new NotificationController();
