'use client'

import {useEffect, useState} from 'react'
import { Bell, BellOff, Loader } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function PushNotificationSettings() {
  const { isSupported, isSubscribed, isLoading, error, subscribe, unsubscribe } =
    usePushNotifications()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  if (!isSupported) return null

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <Bell className="h-5 w-5 text-green-600" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <h3 className="font-semibold">Push Notifications</h3>
            <p className="text-sm text-muted-foreground">
              {isSubscribed
                ? 'You will receive notifications on this device'
                : 'Enable notifications for booking confirmations and reminders'}
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={isLoading}
          variant={isSubscribed ? 'outline' : 'default'}
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              {isSubscribed ? 'Disabling...' : 'Enabling...'}
            </>
          ) : isSubscribed ? (
            <>
              <BellOff className="mr-2 h-4 w-4" />
              Disable
            </>
          ) : (
            <>
              <Bell className="mr-2 h-4 w-4" />
              Enable
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

