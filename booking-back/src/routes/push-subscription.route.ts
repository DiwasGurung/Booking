import { Router } from 'express'
import { auth } from '../middleware/auth.middleware.js'
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getVapidPublicKey,
  getUserSubscriptions,
} from '../controllers/push-notification.controller.js'

const router = Router()

/**
 * @route POST /api/push-subscriptions/subscribe
 * @desc Subscribe user to push notifications
 * @access Private
 */
router.post('/subscribe', auth, subscribeToPushNotifications)

/**
 * @route POST /api/push-subscriptions/unsubscribe
 * @desc Unsubscribe user from push notifications
 * @access Private
 */
router.post('/unsubscribe', auth, unsubscribeFromPushNotifications)

/**
 * @route GET /api/push-subscriptions/vapid-key
 * @desc Get VAPID public key for push subscription
 * @access Public
 */
router.get('/vapid-key', getVapidPublicKey)

/**
 * @route GET /api/push-subscriptions
 * @desc Get user's push subscriptions
 * @access Private
 */
router.get('/', auth, getUserSubscriptions)

export default router
