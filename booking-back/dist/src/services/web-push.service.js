"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebPushService = void 0;
const webpush = __importStar(require("web-push"));
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:support@Appoint-Nepal.app', vapidPublicKey, vapidPrivateKey);
}
class WebPushService {
    /**
     * Send a push notification to a subscription
     */
    static sendPushNotification(subscription, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!vapidPublicKey || !vapidPrivateKey) {
                    console.warn('[WebPush] VAPID keys not configured, skipping push notification');
                    return false;
                }
                const options = {
                    TTL: 24 * 60 * 60, // 24 hours
                };
                const notificationPayload = {
                    notification: {
                        title: payload.title,
                        body: payload.body,
                        icon: payload.icon || '/logo.png',
                        badge: payload.badge || '/badge-72x72.png',
                        tag: payload.tag || 'booking-notification',
                        data: payload.data || {},
                    },
                };
                yield webpush.sendNotification(subscription, JSON.stringify(notificationPayload), options);
                console.log('[WebPush] Notification sent successfully');
                return true;
            }
            catch (error) {
                if (error.statusCode === 410 || error.statusCode === 404) {
                    // Subscription is no longer valid, should be removed from database
                    console.warn('[WebPush] Subscription no longer valid, status:', error.statusCode);
                    return false;
                }
                console.error('[WebPush] Failed to send notification:', error.message);
                return false;
            }
        });
    }
    /**
     * Send bulk push notifications
     */
    static sendBulkPushNotifications(subscriptions, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            let success = 0;
            let failed = 0;
            const promises = subscriptions.map((subscription) => this.sendPushNotification(subscription, payload)
                .then((result) => {
                if (result)
                    success++;
                else
                    failed++;
            })
                .catch(() => {
                failed++;
            }));
            yield Promise.all(promises);
            console.log(`[WebPush] Bulk send completed - Success: ${success}, Failed: ${failed}`);
            return { success, failed };
        });
    }
    /**
     * Send booking confirmation push notification
     */
    static sendBookingConfirmationPush(subscription, bookingData) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendPushNotification(subscription, {
                title: 'Booking Confirmed! ✓',
                body: `Your appointment with ${bookingData.businessName} for ${bookingData.serviceName} is confirmed on ${bookingData.appointmentDate} at ${bookingData.appointmentTime}`,
                tag: `booking-${bookingData.bookingId}`,
                data: {
                    action: 'open_booking',
                    bookingId: bookingData.bookingId,
                    url: `/bookings/${bookingData.bookingId}`,
                },
            });
        });
    }
    /**
     * Send appointment reminder push notification
     */
    static sendAppointmentReminderPush(subscription, reminderData) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendPushNotification(subscription, {
                title: `Appointment Reminder - ${reminderData.hoursUntil}h away`,
                body: `Your appointment with ${reminderData.businessName} for ${reminderData.serviceName} is at ${reminderData.appointmentTime}`,
                tag: `reminder-${reminderData.bookingId}`,
                data: {
                    action: 'open_booking',
                    bookingId: reminderData.bookingId,
                    url: `/bookings/${reminderData.bookingId}`,
                },
            });
        });
    }
    /**
     * Send booking cancellation push notification
     */
    static sendBookingCancellationPush(subscription, cancellationData) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendPushNotification(subscription, {
                title: 'Booking Cancelled',
                body: `Your appointment with ${cancellationData.businessName} for ${cancellationData.serviceName} on ${cancellationData.appointmentDate} has been cancelled${cancellationData.reason ? `. Reason: ${cancellationData.reason}` : ''}`,
                tag: `cancellation-${cancellationData.bookingId}`,
                data: {
                    action: 'open_bookings',
                    bookingId: cancellationData.bookingId,
                    url: `/bookings`,
                },
            });
        });
    }
}
exports.WebPushService = WebPushService;
