import { Router } from "express"
import NotificationController from "../controllers/notification.controller.js"

const notificationRoutes = Router()

// Create notification (internal / admin use)
notificationRoutes.post("/", NotificationController.create)

// Get user notifications
notificationRoutes.get("/user/:userId", NotificationController.getUserNotifications)

// Get unread notifications count
notificationRoutes.get("/user/:userId/unread-count", NotificationController.unreadCount)

// Mark all notifications as read
notificationRoutes.put("/user/:userId/read-all", NotificationController.markAllAsRead)

// Get notification by ID
notificationRoutes.get("/:id", NotificationController.getById)

// Mark notification as read
notificationRoutes.put("/:id/read", NotificationController.markAsRead)

// Delete notification
notificationRoutes.delete("/:id", NotificationController.delete)

export default notificationRoutes

