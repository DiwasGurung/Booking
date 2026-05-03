import { Request, Response } from 'express'
import { PushSubscriptionService } from '../services/push-subscription.service'

interface AuthRequest extends Request {
  user?: { id: string }
  userId?: string
}

/**
 * Subscribe user to push notifications
 */
export const subscribeToPushNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || req.userId
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { subscription } = req.body

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid subscription object' })
    }

    console.log('[PushSubscription] Subscribing user:', userId)

    await PushSubscriptionService.createOrUpdateSubscription(userId, subscription)

    res.json({
      success: true,
      message: 'Successfully subscribed to push notifications',
    })
  } catch (error: any) {
    console.error('[PushSubscription] Subscription error:', error.message)
    res.status(500).json({ error: 'Failed to subscribe to push notifications' })
  }
}

/**
 * Unsubscribe user from push notifications
 */
export const unsubscribeFromPushNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || req.userId
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { subscriptionId } = req.body

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID required' })
    }

    console.log('[PushSubscription] Unsubscribing user:', userId)

    await PushSubscriptionService.deactivateSubscription(subscriptionId)

    res.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications',
    })
  } catch (error: any) {
    console.error('[PushSubscription] Unsubscribe error:', error.message)
    res.status(500).json({ error: 'Failed to unsubscribe from push notifications' })
  }
}

/**
 * Get VAPID public key for push subscription
 */
export const getVapidPublicKey = (req: Request, res: Response) => {
  try {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY

    if (!vapidPublicKey) {
      return res.status(500).json({ error: 'Push notifications not configured' })
    }

    res.json({ vapidPublicKey })
  } catch (error: any) {
    console.error('[PushSubscription] VAPID key error:', error.message)
    res.status(500).json({ error: 'Failed to retrieve VAPID key' })
  }
}

/**
 * Get user's subscriptions
 */
export const getUserSubscriptions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || req.userId
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const subscriptions = await PushSubscriptionService.getUserSubscriptions(userId)

    res.json({
      success: true,
      subscriptions,
    })
  } catch (error: any) {
    console.error('[PushSubscription] Get subscriptions error:', error.message)
    res.status(500).json({ error: 'Failed to retrieve subscriptions' })
  }
}