"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const notification_sse_service_1 = __importDefault(require("../services/notification-sse.service"));
class NotificationSSEController {
    /**
     * Subscribe to real-time notifications via SSE
     */
    async subscribe(req, res) {
        try {
            const userId = req.user?.userId || req.userId || req.body.userId;
            if (!userId) {
                return res.status(401).json({ message: "Not authenticated" });
            }
            console.log(`[v0] User ${userId} subscribing to notifications`);
            // Register connection with SSE service
            const cleanup = notification_sse_service_1.default.registerConnection(userId, res);
            // Handle client disconnect
            req.on("close", () => {
                console.log(`[v0] User ${userId} disconnected from notifications`);
                cleanup();
                res.end();
            });
            // Handle errors
            req.on("error", (error) => {
                console.error(`[v0] SSE error for user ${userId}:`, error);
                cleanup();
            });
        }
        catch (error) {
            console.error(`[v0] Failed to subscribe:`, error);
            res.status(500).json({ message: "Failed to subscribe to notifications", error });
        }
    }
    /**
     * Get all connected users (for debugging)
     */
    async getConnectedUsers(req, res) {
        try {
            const connectedUsers = notification_sse_service_1.default.getConnectedUsers();
            const count = notification_sse_service_1.default.getConnectedUserCount();
            res.json({
                connectedUsers,
                count,
            });
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch connected users", error });
        }
    }
    /**
     * Broadcast a notification to a specific user
     */
    async broadcastToUser(req, res) {
        try {
            const { userId, notification } = req.body;
            if (!userId || !notification) {
                return res.status(400).json({ message: "userId and notification are required" });
            }
            const sent = notification_sse_service_1.default.broadcastToUser(userId, notification);
            res.json({
                message: sent ? "Notification sent via SSE" : "User not connected (will use polling fallback)",
                sent,
            });
        }
        catch (error) {
            res.status(500).json({ message: "Failed to broadcast notification", error });
        }
    }
    /**
     * Broadcast to multiple users
     */
    async broadcastToUsers(req, res) {
        try {
            const { userIds, notification } = req.body;
            if (!Array.isArray(userIds) || !notification) {
                return res.status(400).json({ message: "userIds array and notification are required" });
            }
            const results = notification_sse_service_1.default.broadcastToUsers(userIds, notification);
            res.json({
                message: "Notifications broadcasted",
                delivered: results,
                failed: userIds.length - results,
            });
        }
        catch (error) {
            res.status(500).json({ message: "Failed to broadcast to users", error });
        }
    }
    /**
     * Check if user is connected
     */
    async isUserConnected(req, res) {
        try {
            const { userId } = req.params;
            if (!userId) {
                return res.status(400).json({ message: "userId is required" });
            }
            const userIdString = Array.isArray(userId) ? userId[0] : userId;
            const connected = notification_sse_service_1.default.isUserConnected(userIdString);
            res.json({
                userId,
                connected,
            });
        }
        catch (error) {
            res.status(500).json({ message: "Failed to check user connection", error });
        }
    }
}
exports.default = new NotificationSSEController();
