"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_sse_controller_1 = __importDefault(require("../controllers/notification-sse.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const sseRoutes = (0, express_1.Router)();
// Subscribe to real-time notifications (requires authentication)
sseRoutes.get("/subscribe", auth_middleware_1.auth, (req, res) => notification_sse_controller_1.default.subscribe(req, res));
// Get connected users (debugging)
sseRoutes.get("/connected-users", (req, res) => notification_sse_controller_1.default.getConnectedUsers(req, res));
// Broadcast to a single user
sseRoutes.post("/broadcast", auth_middleware_1.auth, (req, res) => notification_sse_controller_1.default.broadcastToUser(req, res));
// Broadcast to multiple users
sseRoutes.post("/broadcast-users", auth_middleware_1.auth, (req, res) => notification_sse_controller_1.default.broadcastToUsers(req, res));
// Check if user is connected
sseRoutes.get("/connected/:userId", (req, res) => notification_sse_controller_1.default.isUserConnected(req, res));
exports.default = sseRoutes;
