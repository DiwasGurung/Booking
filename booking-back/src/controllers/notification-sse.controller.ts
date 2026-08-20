import { Request, Response } from "express"
import NotificationSSEService from "../services/notification-sse.service"

class NotificationSSEController {
  /**
   * Subscribe to real-time notifications via SSE
   */
  async subscribe(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || (req as any).userId || req.body.userId;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" })
      }


      // Register connection with SSE service
      const cleanup = NotificationSSEService.registerConnection(userId, res)

      // Handle client disconnect
      req.on("close", () => {
        cleanup()
        res.end()
      })

      // Handle errors
      req.on("error", (error) => {
        console.error(`[v0] SSE error for user ${userId}:`, error)
        cleanup()
      })
    } catch (error) {
      console.error(`[v0] Failed to subscribe:`, error)
      res.status(500).json({ message: "Failed to subscribe to notifications", error })
    }
  }

  /**
   * Get all connected users (for debugging)
   */
  async getConnectedUsers(req: Request, res: Response) {
    try {
      const connectedUsers = NotificationSSEService.getConnectedUsers()
      const count = NotificationSSEService.getConnectedUserCount()

      res.json({
        connectedUsers,
        count,
      })
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch connected users", error })
    }
  }

  /**
   * Broadcast a notification to a specific user
   */
  async broadcastToUser(req: Request, res: Response) {
    try {
      const { userId, notification } = req.body

      if (!userId || !notification) {
        return res.status(400).json({ message: "userId and notification are required" })
      }

      const sent = NotificationSSEService.broadcastToUser(userId, notification)

      res.json({
        message: sent ? "Notification sent via SSE" : "User not connected (will use polling fallback)",
        sent,
      })
    } catch (error) {
      res.status(500).json({ message: "Failed to broadcast notification", error })
    }
  }

  /**
   * Broadcast to multiple users
   */
  async broadcastToUsers(req: Request, res: Response) {
    try {
      const { userIds, notification } = req.body

      if (!Array.isArray(userIds) || !notification) {
        return res.status(400).json({ message: "userIds array and notification are required" })
      }

      const results = NotificationSSEService.broadcastToUsers(userIds, notification)

      res.json({
        message: "Notifications broadcasted",
        delivered: results,
        failed: userIds.length - results,
      })
    } catch (error) {
      res.status(500).json({ message: "Failed to broadcast to users", error })
    }
  }

  /**
   * Check if user is connected
   */
  async isUserConnected(req: Request, res: Response) {
    try {
      const { userId } = req.params

      if (!userId) {
        return res.status(400).json({ message: "userId is required" })
      }

      const userIdString = Array.isArray(userId) ? userId[0] : userId
      const connected = NotificationSSEService.isUserConnected(userIdString)

      res.json({
        userId,
        connected,
      })
    } catch (error) {
      res.status(500).json({ message: "Failed to check user connection", error })
    }
  }
}

export default new NotificationSSEController()
