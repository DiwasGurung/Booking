"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSSEService = void 0;
/**
 * NotificationSSEService
 * Handles Server-Sent Events (SSE) connections and real-time notifications
 * Manages client connections, heartbeats, and message broadcasting
 */
class NotificationSSEService {
    /**
     * Register a user for real-time notifications via SSE
     * @param userId - User ID to register
     * @param res - Express Response object for SSE
     * @returns Cleanup function to remove connection
     */
    static registerConnection(userId, res) {
        console.log(`[v0] SSE Service: User ${userId} registered for notifications`);
        // Set SSE headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "http://localhost:3000");
        // Store the connection
        this.notificationClients.set(userId, res);
        // Send initial connection confirmation
        this.sendToClient(userId, {
            type: "CONNECTED",
            message: "Connected to notifications",
            timestamp: new Date().toISOString(),
        });
        // Start heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
            this.sendHeartbeat(userId, heartbeat);
        }, 30000); // 30 seconds
        // Return cleanup function
        return () => {
            this.unregisterConnection(userId, heartbeat);
        };
    }
    /**
     * Unregister a user from notifications
     * @param userId - User ID to unregister
     * @param heartbeatInterval - Interval ID to clear
     */
    static unregisterConnection(userId, heartbeatInterval) {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
        }
        this.notificationClients.delete(userId);
        console.log(`[v0] SSE Service: User ${userId} unregistered from notifications`);
    }
    /**
     * Send a heartbeat to keep connection alive
     * @param userId - User ID
     * @param heartbeatInterval - Interval to clear on error
     */
    static sendHeartbeat(userId, heartbeatInterval) {
        const client = this.notificationClients.get(userId);
        if (client) {
            try {
                client.write(`: heartbeat\n\n`);
            }
            catch (error) {
                console.error(`[v0] SSE Service: Error sending heartbeat to user ${userId}:`, error);
                clearInterval(heartbeatInterval);
                this.notificationClients.delete(userId);
            }
        }
    }
    /**
     * Send data to a specific client
     * @param userId - User ID
     * @param data - Data to send
     */
    static sendToClient(userId, data) {
        const client = this.notificationClients.get(userId);
        if (client) {
            try {
                client.write(`data: ${JSON.stringify(data)}\n\n`);
            }
            catch (error) {
                console.error(`[v0] SSE Service: Error sending to user ${userId}:`, error);
                this.notificationClients.delete(userId);
            }
        }
    }
    /**
     * Broadcast a notification to a specific user
     * @param userId - User ID to send to
     * @param notification - Notification data
     */
    static broadcastToUser(userId, notification) {
        const client = this.notificationClients.get(userId);
        if (client) {
            try {
                const message = {
                    type: "NOTIFICATION",
                    data: notification,
                    timestamp: new Date().toISOString(),
                };
                client.write(`data: ${JSON.stringify(message)}\n\n`);
                console.log(`[v0] SSE Service: Notification sent to user ${userId}`);
                return true;
            }
            catch (error) {
                console.error(`[v0] SSE Service: Error broadcasting to user ${userId}:`, error);
                this.notificationClients.delete(userId);
                return false;
            }
        }
        else {
            console.log(`[v0] SSE Service: User ${userId} not connected (will use polling fallback)`);
            return false;
        }
    }
    /**
     * Broadcast a notification to multiple users
     * @param userIds - Array of user IDs
     * @param notification - Notification data
     * @returns Count of successfully sent notifications
     */
    static broadcastToUsers(userIds, notification) {
        let sentCount = 0;
        for (const userId of userIds) {
            if (this.broadcastToUser(userId, notification)) {
                sentCount++;
            }
        }
        return sentCount;
    }
    /**
     * Get all connected users (for debugging)
     * @returns Array of connected user IDs
     */
    static getConnectedUsers() {
        return Array.from(this.notificationClients.keys());
    }
    /**
     * Get count of connected users
     * @returns Number of connected users
     */
    static getConnectedUserCount() {
        return this.notificationClients.size;
    }
    /**
     * Check if a user is connected
     * @param userId - User ID to check
     * @returns True if user is connected
     */
    static isUserConnected(userId) {
        return this.notificationClients.has(userId);
    }
    /**
     * Clear all connections (for cleanup)
     */
    static clearAllConnections() {
        console.log(`[v0] SSE Service: Clearing all ${this.notificationClients.size} connections`);
        this.notificationClients.clear();
    }
}
exports.NotificationSSEService = NotificationSSEService;
// Store active SSE connections: userId -> Response
NotificationSSEService.notificationClients = new Map();
exports.default = NotificationSSEService;
