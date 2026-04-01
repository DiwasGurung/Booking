import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

const prisma = new PrismaClient()

// Store active SSE connections
const notificationClients: Map<string, Response> = new Map()

export const NotificationSSEController = {
  /**
   * Subscribe to real-time notifications
   */
  subscribe: (req: Request, res: Response) => {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" })
    }

    console.log(`[v0] User ${userId} subscribed to notifications`)

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")
    res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "http://localhost:3000")

    // Store the connection
    notificationClients.set(userId, res)

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: "CONNECTED", message: "Connected to notifications" })}\n\n`)

    // Keep connection alive with heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`)
      } catch (error) {
        clearInterval(heartbeat)
        notificationClients.delete(userId)
      }
    }, 30000)

    // Handle client disconnect
    req.on("close", () => {
      clearInterval(heartbeat)
      notificationClients.delete(userId)
      console.log(`[v0] User ${userId} disconnected from notifications`)
      res.end()
    })

    // Handle errors
    req.on("error", (error) => {
      clearInterval(heartbeat)
      notificationClients.delete(userId)
      console.error(`[v0] SSE error for user ${userId}:`, error)
    })
  },

  /**
   * Broadcast notification to specific user
   */
  broadcastToUser: (userId: string, notification: any) => {
    const client = notificationClients.get(userId)
    if (client) {
      try {
        client.write(`data: ${JSON.stringify({ type: "NOTIFICATION", data: notification })}\n\n`)
        console.log(`[v0] Notification sent to user ${userId}:`, notification)
      } catch (error) {
        console.error(`[v0] Error sending notification to user ${userId}:`, error)
        notificationClients.delete(userId)
      }
    } else {
      console.log(`[v0] User ${userId} not connected, notification queued`)
    }
  },

  /**
   * Get all connected users (for debugging)
   */
  getConnectedUsers: (req: Request, res: Response) => {
    res.json({
      success: true,
      connectedUsers: Array.from(notificationClients.keys()),
      count: notificationClients.size,
    })
  },
}

export default NotificationSSEController
