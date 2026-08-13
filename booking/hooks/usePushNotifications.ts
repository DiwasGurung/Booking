import { AnyAaaaRecord } from 'dns'
import { useEffect, useState, useCallback } from 'react'

interface PushNotificationState {
  isSupported: boolean
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: false,
    error: null,
  })

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

  // Check if push notifications are supported
  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window

    setState((prev) => ({
      ...prev,
      isSupported,
    }))

    if (isSupported) {
      checkSubscriptionStatus()
    }
  }, [])

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        const subscription = await registration.pushManager.getSubscription()
        setState((prev) => ({
          ...prev,
          isSubscribed: !!subscription,
        }))
      }
    } catch (error) {
      console.error('[usePushNotifications] Error checking subscription:', error)
    }
  }

  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Push notifications are not supported in this browser',
      }))
      return false
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }))

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js')

      // Get VAPID public key
      const keyResponse = await fetch(`${apiUrl}/api/push-subscriptions/vapid-key`)
      if (!keyResponse.ok) {
        throw new Error('Failed to get VAPID key')
      }

      const { vapidPublicKey } = await keyResponse.json()

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any,
      })


      // Send subscription to backend
      const subscribeResponse = await fetch(`${apiUrl}/api/push-subscriptions/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })

      if (!subscribeResponse.ok) {
        throw new Error('Failed to save subscription to server')
      }


      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }))

      return true
    } catch (error: any) {
      console.error('[usePushNotifications] Subscription error:', error)
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to subscribe to push notifications',
        isLoading: false,
      }))
      return false
    }
  }, [state.isSupported])

  const unsubscribe = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }))

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          // Notify backend to deactivate subscription
          // Note: You'll need to pass subscription ID if you want to track it
          await subscription.unsubscribe()
        }
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }))

      return true
    } catch (error: any) {
      console.error('[usePushNotifications] Unsubscribe error:', error)
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to unsubscribe from push notifications',
        isLoading: false,
      }))
      return false
    }
  }, [])

  return {
    ...state,
    subscribe,
    unsubscribe,
  }
}

/**
 * Convert VAPID public key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}