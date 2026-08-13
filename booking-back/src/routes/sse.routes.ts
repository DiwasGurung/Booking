import { Router } from "express"
import NotificationSSEController from "../controllers/notification-sse.controller.js"
import { auth } from "../middleware/auth.middleware.js"

const sseRoutes = Router()

// Subscribe to real-time notifications (requires authentication)
sseRoutes.get("/subscribe", auth, (req, res) => NotificationSSEController.subscribe(req, res))

// Get connected users (debugging)
sseRoutes.get("/connected-users", (req, res) => NotificationSSEController.getConnectedUsers(req, res))

// Broadcast to a single user
sseRoutes.post("/broadcast", auth, (req, res) => NotificationSSEController.broadcastToUser(req, res))

// Broadcast to multiple users
sseRoutes.post("/broadcast-users", auth, (req, res) => NotificationSSEController.broadcastToUsers(req, res))

// Check if user is connected
sseRoutes.get("/connected/:userId", (req, res) => NotificationSSEController.isUserConnected(req, res))

export default sseRoutes
