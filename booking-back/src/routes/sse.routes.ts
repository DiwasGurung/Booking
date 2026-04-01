import { Router } from "express"
import NotificationSSEController from "../controllers/notification-sse.controller"
import { auth } from "../middleware/auth.middleware"

const sseRoutes = Router()

// Subscribe to real-time notifications (requires authentication)
sseRoutes.get("/subscribe", auth, NotificationSSEController.subscribe)

// Get connected users (debugging)
sseRoutes.get("/connected-users", NotificationSSEController.getConnectedUsers)

export default sseRoutes
