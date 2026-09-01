'use client'

import { useAuth } from '@/context/authContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bell, Mail, MessageSquare, AlertCircle, Save } from 'lucide-react'
import { PushNotificationSettings } from '@/components/PushNotificationSettings'

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  bookingReminders: boolean
  promotionalEmails: boolean
  weeklyDigest: boolean
  reviewRequests: boolean
  systemAlerts: boolean
}

export default function NotificationPreferencesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    bookingReminders: true,
    promotionalEmails: false,
    weeklyDigest: true,
    reviewRequests: true,
    systemAlerts: true,
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    setLoading(false)
  }, [user, router])

  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      
      // Save settings to backend
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/users/${user?.id}/notification-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Failed to save notification preferences')
    
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
        <div className="mx-auto max-w-4xl flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Notification Preferences</h1>
          <p className="text-muted-foreground">Manage how you receive notifications from Appoint-Nepal</p>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="border border-green-200 bg-green-50 shadow-lg p-4 mb-6">
            <p className="text-green-900">Notification preferences saved successfully!</p>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="border border-red-200 bg-red-50 shadow-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-900">{error}</p>
            </div>
          </Card>
        )}

        {/* Notification Channels Tab */}
        <Tabs defaultValue="channels" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="frequency">Frequency</TabsTrigger>
          </TabsList>

          {/* Channels Tab */}
          <TabsContent value="channels" className="space-y-4">
            <Card className="border border-border shadow-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">How do you want to receive notifications?</h2>
              
              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-semibold text-foreground">Email Notifications</h3>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={() => toggleSetting('emailNotifications')}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>

                {/* SMS */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-semibold text-foreground">SMS Notifications</h3>
                      <p className="text-sm text-muted-foreground">Receive notifications via SMS (charges may apply)</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={() => toggleSetting('smsNotifications')}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>

                {/* Push */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-semibold text-foreground">Push Notifications</h3>
                      <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={() => toggleSetting('pushNotifications')}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>
              </div>
            </Card>

            {/* Web Push Notifications Component */}
            <PushNotificationSettings />
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <Card className="border border-border shadow-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">What notifications do you want?</h2>
              
              <div className="space-y-4">
                {/* Booking Reminders */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h3 className="font-semibold text-foreground">Booking Reminders</h3>
                    <p className="text-sm text-muted-foreground">Get reminders before your bookings</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.bookingReminders}
                    onChange={() => toggleSetting('bookingReminders')}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>

                {/* Review Requests */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h3 className="font-semibold text-foreground">Review Requests</h3>
                    <p className="text-sm text-muted-foreground">Be asked to review completed bookings</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.reviewRequests}
                    onChange={() => toggleSetting('reviewRequests')}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>

                {/* Promotional Emails */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h3 className="font-semibold text-foreground">Promotional Emails</h3>
                    <p className="text-sm text-muted-foreground">Receive special offers and promotions</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.promotionalEmails}
                    onChange={() => toggleSetting('promotionalEmails')}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>

                {/* System Alerts */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h3 className="font-semibold text-foreground">System Alerts</h3>
                    <p className="text-sm text-muted-foreground">Important updates about your account</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.systemAlerts}
                    onChange={() => toggleSetting('systemAlerts')}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Frequency Tab */}
          <TabsContent value="frequency" className="space-y-4">
            <Card className="border border-border shadow-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">How often do you want updates?</h2>
              
              <div className="space-y-4">
                {/* Weekly Digest */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h3 className="font-semibold text-foreground">Weekly Digest</h3>
                    <p className="text-sm text-muted-foreground">Receive a weekly summary of your bookings</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.weeklyDigest}
                    onChange={() => toggleSetting('weeklyDigest')}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-secondary/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Real-time notifications for booking confirmations, cancellations, and reminders cannot be disabled for safety reasons.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="mt-8 flex gap-3">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
