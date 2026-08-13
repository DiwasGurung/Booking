import { Response } from "express"

/**
 * NotificationSSEService
 * Handles Server-Sent Events (SSE) connections and real-time notifications
 * Manages client connections, heartbeats, and message broadcasting
 */
export class NotificationSSEService {
  // Store active SSE connections: userId -> Response
  private static notificationClients: Map<string, Response> = new Map()

  /**
   * Register a user for real-time notifications via SSE
   * @param userId - User ID to register
   * @param res - Express Response object for SSE
   * @returns Cleanup function to remove connection
   */
  static registerConnection(userId: string, res: Response): () => void {

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")
    res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "http://localhost:3000")

    // Store the connection
    this.notificationClients.set(userId, res)

    // Send initial connection confirmation
    this.sendToClient(userId, {
      type: "CONNECTED",
      message: "Connected to notifications",
      timestamp: new Date().toISOString(),
    })

    // Start heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      this.sendHeartbeat(userId, heartbeat)
    }, 30000) // 30 seconds

    // Return cleanup function
    return () => {
      this.unregisterConnection(userId, heartbeat)
    }
  }

  /**
   * Unregister a user from notifications
   * @param userId - User ID to unregister
   * @param heartbeatInterval - Interval ID to clear
   */
  static unregisterConnection(userId: string, heartbeatInterval?: NodeJS.Timeout): void {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
    }
    this.notificationClients.delete(userId)
  }

  /**
   * Send a heartbeat to keep connection alive
   * @param userId - User ID
   * @param heartbeatInterval - Interval to clear on error
   */
  private static sendHeartbeat(userId: string, heartbeatInterval: NodeJS.Timeout): void {
    const client = this.notificationClients.get(userId)
    if (client) {
      try {
        client.write(`: heartbeat\n\n`)
      } catch (error) {
        console.error(`[v0] SSE Service: Error sending heartbeat to user ${userId}:`, error)
        clearInterval(heartbeatInterval)
        this.notificationClients.delete(userId)
      }
    }
  }

  /**
   * Send data to a specific client
   * @param userId - User ID
   * @param data - Data to send
   */
  private static sendToClient(userId: string, data: any): void {
    const client = this.notificationClients.get(userId)
    if (client) {
      try {
        client.write(`data: ${JSON.stringify(data)}\n\n`)
      } catch (error) {
        console.error(`[v0] SSE Service: Error sending to user ${userId}:`, error)
        this.notificationClients.delete(userId)
      }
    }
  }

  /**
   * Broadcast a notification to a specific user
   * @param userId - User ID to send to
   * @param notification - Notification data
   */
  static broadcastToUser(userId: string, notification: any): boolean {
    const client = this.notificationClients.get(userId)
    if (client) {
      try {
        const message = {
          type: "NOTIFICATION",
          data: notification,
          timestamp: new Date().toISOString(),
        }
        client.write(`data: ${JSON.stringify(message)}\n\n`)
        return true
      } catch (error) {
        console.error(`[v0] SSE Service: Error broadcasting to user ${userId}:`, error)
        this.notificationClients.delete(userId)
        return false
      }
    } else {
      return false
    }
  }

  /**
   * Broadcast a notification to multiple users
   * @param userIds - Array of user IDs
   * @param notification - Notification data
   * @returns Count of successfully sent notifications
   */
  static broadcastToUsers(userIds: string[], notification: any): number {
    let sentCount = 0
    for (const userId of userIds) {
      if (this.broadcastToUser(userId, notification)) {
        sentCount++
      }
    }
    return sentCount
  }

  /**
   * Get all connected users (for debugging)
   * @returns Array of connected user IDs
   */
  static getConnectedUsers(): string[] {
    return Array.from(this.notificationClients.keys())
  }

  /**
   * Get count of connected users
   * @returns Number of connected users
   */
  static getConnectedUserCount(): number {
    return this.notificationClients.size
  }

  /**
   * Check if a user is connected
   * @param userId - User ID to check
   * @returns True if user is connected
   */
  static isUserConnected(userId: string): boolean {
    return this.notificationClients.has(userId)
  }

  /**
   * Clear all connections (for cleanup)
   */
  static clearAllConnections(): void {
    this.notificationClients.clear()
  }
}

export default NotificationSSEService
