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
const notification_sse_service_1 = __importDefault(require("../services/notification-sse.service"));
class NotificationSSEController {
    /**
     * Subscribe to real-time notifications via SSE
     */
    subscribe(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || req.userId || req.body.userId;
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
        });
    }
    /**
     * Get all connected users (for debugging)
     */
    getConnectedUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    /**
     * Broadcast a notification to a specific user
     */
    broadcastToUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    /**
     * Broadcast to multiple users
     */
    broadcastToUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    /**
     * Check if user is connected
     */
    isUserConnected(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
}
exports.default = new NotificationSSEController();
