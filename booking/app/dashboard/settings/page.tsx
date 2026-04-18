'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useBusinessId } from '@/hooks/useBusinessId'
import { businessApi } from '@/lib/api'
import { Loader, AlertCircle, Save, Settings, Bell, Lock, Trash2, Copy, Check } from 'lucide-react'

interface BusinessSettings {
  businessName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  description: string
  website: string
  category: string
  logo?: string
  coverImage?: string
  socialMedia?: {
    facebook?: string
    instagram?: string
    twitter?: string
  }
  notificationSettings?: {
    emailNotifications: boolean
    smsNotifications: boolean
    bookingReminders: boolean
    paymentAlerts: boolean
    marketingEmails: boolean
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const { businessId, loading: fetchingBusinessId, error: businessIdError } = useBusinessId()
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [formData, setFormData] = useState<BusinessSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('business')

  // Default settings template
  const defaultSettings: BusinessSettings = {
    businessName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    description: '',
    website: '',
    category: '',
    logo: '',
    coverImage: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
    },
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: false,
      bookingReminders: true,
      paymentAlerts: true,
      marketingEmails: false,
    },
  }

  useEffect(() => {
    if (businessId) {
      loadSettings()
    }
  }, [businessId])

  // Redirect to login if business ID error or not found
  useEffect(() => {
    if (!fetchingBusinessId && (businessIdError || !businessId)) {
      router.push('/login')
    }
  }, [fetchingBusinessId, businessIdError, businessId, router])

  const loadSettings = async () => {
    if (!businessId) {
      return
    }
    try {
      setLoading(true)
      const response = await businessApi.getSettings(businessId)
      if (response.data) {
        setSettings(response.data)
        setFormData(response.data)
      } else {
        setSettings(defaultSettings)
        setFormData(defaultSettings)
      }
      setError(null)
    } catch (err) {
      setSettings(defaultSettings)
      setFormData(defaultSettings)
      setError('Using default settings. Some data may not have loaded.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async (tab: string) => {
    if (!businessId || !formData) return
    try {
      setSaving(true)
      await businessApi.updateSettings(businessId, formData)
      setSettings(formData)
      setSuccess(`${tab === 'business' ? 'Business' : tab === 'notifications' ? 'Notification' : 'Security'} settings updated successfully`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to save settings')
      console.error('[v0] Error saving settings:', err)
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    if (!formData) return
    setFormData({
      ...formData,
      notificationSettings: {
        emailNotifications: formData.notificationSettings?.emailNotifications ?? true,
        smsNotifications: formData.notificationSettings?.smsNotifications ?? false,
        bookingReminders: formData.notificationSettings?.bookingReminders ?? true,
        paymentAlerts: formData.notificationSettings?.paymentAlerts ?? true,
        marketingEmails: formData.notificationSettings?.marketingEmails ?? false,
        [key]: value,
      },
    })
  }

  // Only render if we have valid businessId
  if (fetchingBusinessId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // If businessId error or not found, return minimal UI while redirect happens
  if (businessIdError || !businessId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (loading || !settings || !formData) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar userRole="BUSINESS_OWNER" />
        <main className="md:ml-64 pt-6 px-4 md:px-8 py-8 flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole="BUSINESS_OWNER" />

      <main className="md:ml-64 pt-6 px-4 md:px-8 py-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Settings' },
          ]}
        />

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your business profile and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Business</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Business Settings Tab */}
          <TabsContent value="business" className="space-y-6">
            {/* Basic Information */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Update your business profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) =>
                        setFormData({ ...formData, businessName: e.target.value })
                      }
                      placeholder="Your business name"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="business@example.com"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Salon, Restaurant, Fitness"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell customers about your business..."
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <Button
                  onClick={() => handleSaveSettings('business')}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Address</CardTitle>
                <CardDescription>Your business location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main St"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="San Francisco"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="CA"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">Zip/Postal Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      placeholder="94107"
                      className="mt-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="United States"
                      className="mt-2"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSaveSettings('business')}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Address
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch
                      checked={formData?.notificationSettings?.emailNotifications || false}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('emailNotifications', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive text message updates</p>
                    </div>
                    <Switch
                      checked={formData?.notificationSettings?.smsNotifications || false}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('smsNotifications', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Booking Reminders</p>
                      <p className="text-sm text-muted-foreground">Get reminders before upcoming bookings</p>
                    </div>
                    <Switch
                      checked={formData?.notificationSettings?.bookingReminders || false}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('bookingReminders', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Payment Alerts</p>
                      <p className="text-sm text-muted-foreground">Notifications for new payments</p>
                    </div>
                    <Switch
                      checked={formData?.notificationSettings?.paymentAlerts || false}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('paymentAlerts', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Marketing Emails</p>
                      <p className="text-sm text-muted-foreground">Receive tips and promotional offers</p>
                    </div>
                    <Switch
                      checked={formData?.notificationSettings?.marketingEmails || false}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('marketingEmails', checked)
                      }
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSaveSettings('notifications')}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Media Tab */}
          <TabsContent value="business" className="space-y-6">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Social Media</CardTitle>
                <CardDescription>Connect your social media profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={formData?.socialMedia?.facebook || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData!,
                          socialMedia: {
                            ...formData?.socialMedia,
                            facebook: e.target.value,
                          },
                        })
                      }
                      placeholder="facebook.com/yourpage"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={formData?.socialMedia?.instagram || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData!,
                          socialMedia: {
                            ...formData?.socialMedia,
                            instagram: e.target.value,
                          },
                        })
                      }
                      placeholder="@yourprofile"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      value={formData?.socialMedia?.twitter || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData!,
                          socialMedia: {
                            ...formData?.socialMedia,
                            twitter: e.target.value,
                          },
                        })
                      }
                      placeholder="@yourhandle"
                      className="mt-2"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSaveSettings('business')}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Social Media
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            {/* API Key */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>API Key</CardTitle>
                <CardDescription>Use this key to integrate with our API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Your API Key</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 p-3 bg-muted text-muted-foreground rounded border border-border text-sm overflow-auto font-mono">
                      {businessId}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(businessId || '')}
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Keep this key private. Never share it publicly.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">Delete Business Account</p>
                    <p className="text-sm text-muted-foreground">
                      This will permanently delete your business and all associated data
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business Account</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your business account and all associated data including bookings, payments, and settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Permanently
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
