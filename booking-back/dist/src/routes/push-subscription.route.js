"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const push_notification_controller_1 = require("../controllers/push-notification.controller");
const router = (0, express_1.Router)();
/**
 * @route POST /api/push-subscriptions/subscribe
 * @desc Subscribe user to push notifications
 * @access Private
 */
router.post('/subscribe', auth_middleware_1.auth, push_notification_controller_1.subscribeToPushNotifications);
/**
 * @route POST /api/push-subscriptions/unsubscribe
 * @desc Unsubscribe user from push notifications
 * @access Private
 */
router.post('/unsubscribe', auth_middleware_1.auth, push_notification_controller_1.unsubscribeFromPushNotifications);
/**
 * @route GET /api/push-subscriptions/vapid-key
 * @desc Get VAPID public key for push subscription
 * @access Public
 */
router.get('/vapid-key', push_notification_controller_1.getVapidPublicKey);
/**
 * @route GET /api/push-subscriptions
 * @desc Get user's push subscriptions
 * @access Private
 */
router.get('/', auth_middleware_1.auth, push_notification_controller_1.getUserSubscriptions);
exports.default = router;
