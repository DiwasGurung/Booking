'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Bell, Trash2, CheckCircle2, AlertCircle, Info } from 'lucide-react'

interface Notification {
  id: string
  type: 'booking' | 'payment' | 'system' | 'alert'
  title: string
  message: string
  timestamp: string
  read: boolean
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'booking',
      title: 'New Booking Request',
      message: 'John Doe has requested a booking for Haircut on February 16 at 10:00 AM',
      timestamp: '2026-02-16T14:30:00',
      read: false,
    },
    {
      id: '2',
      type: 'payment',
      title: 'Payment Received',
      message: 'Payment of $25.00 received from Jane Smith for Hair Coloring service',
      timestamp: '2026-02-16T12:00:00',
      read: true,
    },
    {
      id: '3',
      type: 'system',
      title: 'Account Verification',
      message: 'Please verify your email address to fully activate your business account',
      timestamp: '2026-02-15T08:00:00',
      read: false,
    },
    {
      id: '4',
      type: 'booking',
      title: 'Booking Cancelled',
      message: 'Bob Johnson has cancelled his booking scheduled for February 17',
      timestamp: '2026-02-14T16:45:00',
      read: true,
    },
    {
      id: '5',
      type: 'alert',
      title: 'Service Expiring Soon',
      message: 'Your premium plan subscription expires in 7 days',
      timestamp: '2026-02-13T10:00:00',
      read: true,
    },
  ])

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <CheckCircle2 className="w-5 h-5 text-blue-500" />
      case 'payment':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'system':
        return <Info className="w-5 h-5 text-cyan-500" />
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getNotificationBg = (read: boolean) => {
    return read ? 'bg-background' : 'bg-primary/5 border-primary/20'
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated with your bookings and payments</p>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-5 border-2 ${getNotificationBg(notification.read)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground">
                        {notification.title}
                        {!notification.read && (
                          <span className="ml-2 inline-block w-2 h-2 bg-primary rounded-full"></span>
                        )}
                      </h3>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!notification.read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsRead(notification.id)}
                      className="text-xs"
                    >
                      Read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteNotification(notification.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {notifications.length === 0 && (
          <Card className="p-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No notifications yet</p>
          </Card>
        )}
      </div>
    </div>
  )
}
