"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = __importDefault(require("../controllers/notification.controller"));
const notificationRoutes = (0, express_1.Router)();
// Create notification (internal / admin use)
notificationRoutes.post("/", notification_controller_1.default.create);
// Get user notifications
notificationRoutes.get("/user/:userId", notification_controller_1.default.getUserNotifications);
// Get unread notifications count
notificationRoutes.get("/user/:userId/unread-count", notification_controller_1.default.unreadCount);
// Mark all notifications as read
notificationRoutes.put("/user/:userId/read-all", notification_controller_1.default.markAllAsRead);
// Get notification by ID
notificationRoutes.get("/:id", notification_controller_1.default.getById);
// Mark notification as read
notificationRoutes.put("/:id/read", notification_controller_1.default.markAsRead);
// Delete notification
notificationRoutes.delete("/:id", notification_controller_1.default.delete);
exports.default = notificationRoutes;
