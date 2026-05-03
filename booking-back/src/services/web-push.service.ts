import * as webpush from 'web-push'

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@bookflow.app',
    vapidPublicKey,
    vapidPrivateKey
  )
}

export class WebPushService {
  /**
   * Send a push notification to a subscription
   */
  static async sendPushNotification(
    subscription: any,
    payload: {
      title: string
      body: string
      icon?: string
      badge?: string
      tag?: string
      data?: Record<string, any>
    }
  ): Promise<boolean> {
    try {
      if (!vapidPublicKey || !vapidPrivateKey) {
        console.warn('[WebPush] VAPID keys not configured, skipping push notification')
        return false
      }

      const options = {
        TTL: 24 * 60 * 60, // 24 hours
      }

      const notificationPayload = {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/logo.png',
          badge: payload.badge || '/badge-72x72.png',
          tag: payload.tag || 'booking-notification',
          data: payload.data || {},
        },
      }

      await webpush.sendNotification(subscription, JSON.stringify(notificationPayload), options)
      console.log('[WebPush] Notification sent successfully')
      return true
    } catch (error: any) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription is no longer valid, should be removed from database
        console.warn('[WebPush] Subscription no longer valid, status:', error.statusCode)
        return false
      }
      console.error('[WebPush] Failed to send notification:', error.message)
      return false
    }
  }

  /**
   * Send bulk push notifications
   */
  static async sendBulkPushNotifications(
    subscriptions: any[],
    payload: any
  ): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    const promises = subscriptions.map((subscription) =>
      this.sendPushNotification(subscription, payload)
        .then((result) => {
          if (result) success++
          else failed++
        })
        .catch(() => {
          failed++
        })
    )

    await Promise.all(promises)
    console.log(`[WebPush] Bulk send completed - Success: ${success}, Failed: ${failed}`)
    return { success, failed }
  }

  /**
   * Send booking confirmation push notification
   */
  static async sendBookingConfirmationPush(
    subscription: any,
    bookingData: {
      serviceName: string
      businessName: string
      appointmentDate: string
      appointmentTime: string
      bookingId: string
    }
  ): Promise<boolean> {
    return this.sendPushNotification(subscription, {
      title: 'Booking Confirmed! ✓',
      body: `Your appointment with ${bookingData.businessName} for ${bookingData.serviceName} is confirmed on ${bookingData.appointmentDate} at ${bookingData.appointmentTime}`,
      tag: `booking-${bookingData.bookingId}`,
      data: {
        action: 'open_booking',
        bookingId: bookingData.bookingId,
        url: `/bookings/${bookingData.bookingId}`,
      },
    })
  }

  /**
   * Send appointment reminder push notification
   */
  static async sendAppointmentReminderPush(
    subscription: any,
    reminderData: {
      businessName: string
      serviceName: string
      appointmentTime: string
      hoursUntil: number
      bookingId: string
    }
  ): Promise<boolean> {
    return this.sendPushNotification(subscription, {
      title: `Appointment Reminder - ${reminderData.hoursUntil}h away`,
      body: `Your appointment with ${reminderData.businessName} for ${reminderData.serviceName} is at ${reminderData.appointmentTime}`,
      tag: `reminder-${reminderData.bookingId}`,
      data: {
        action: 'open_booking',
        bookingId: reminderData.bookingId,
        url: `/bookings/${reminderData.bookingId}`,
      },
    })
  }

  /**
   * Send booking cancellation push notification
   */
  static async sendBookingCancellationPush(
    subscription: any,
    cancellationData: {
      serviceName: string
      businessName: string
      appointmentDate: string
      reason?: string
      bookingId: string
    }
  ): Promise<boolean> {
    return this.sendPushNotification(subscription, {
      title: 'Booking Cancelled',
      body: `Your appointment with ${cancellationData.businessName} for ${cancellationData.serviceName} on ${cancellationData.appointmentDate} has been cancelled${cancellationData.reason ? `. Reason: ${cancellationData.reason}` : ''}`,
      tag: `cancellation-${cancellationData.bookingId}`,
      data: {
        action: 'open_bookings',
        bookingId: cancellationData.bookingId,
        url: `/bookings`,
      },
    })
  }
}