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
import { businessApi, businessHoursApi } from '@/lib/api'
import { Loader, AlertCircle, Save, Settings, Bell, Lock, Trash2, Copy, Check, Upload, X } from 'lucide-react'

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
    emailNotifications?: boolean
    smsNotifications?: boolean
    bookingReminders?: boolean
    paymentAlerts?: boolean
    marketingEmails?: boolean
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const { businessId, loading: fetchingBusinessId, error: businessIdError } = useBusinessId()
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [formData, setFormData] = useState<BusinessSettings | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isLoadingLogo, setIsLoadingLogo] = useState(false)
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('business')
  const [hasBusinessHours, setHasBusinessHours] = useState(false)

  // Calculate profile completion percentage
  const calculateProfileCompletion = (data: BusinessSettings) => {
    const requiredFields = [
      data.businessName,
      data.email,
      data.phone,
      data.address,
      data.city,
      data.description,
      data.logo
    ]
    const completedFields = requiredFields.filter(field => field && field.length > 0).length
    return Math.round((completedFields / requiredFields.length) * 100)
  }

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Compress an image file to a small PNG data URL. Storing the logo directly on
  // the business record avoids ephemeral disk storage and localhost/mixed-content
  // URL problems that made the previous upload endpoint fail.
  const compressToDataUrl = (file: File, maxSize = 400): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error('Could not read the selected image'))
      reader.onload = () => {
        const img = new Image()
        img.onerror = () => reject(new Error('Could not load the selected image'))
        img.onload = () => {
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
          const w = Math.max(1, Math.round(img.width * scale))
          const h = Math.max(1, Math.round(img.height * scale))
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (!ctx) return reject(new Error('Your browser does not support image processing'))
          ctx.drawImage(img, 0, 0, w, h)
          resolve(canvas.toDataURL('image/png'))
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
    })

  // Handle logo upload — persist directly to the business via the settings API.
  const handleLogoUpload = async () => {
    if (!logoFile || !businessId || !formData) return

    setIsLoadingLogo(true)
    try {
      const dataUrl = await compressToDataUrl(logoFile)
      const updated = { ...formData, logo: dataUrl }
      const response = await businessApi.updateSettings(businessId, updated)

      if (!response.success && !response.data) {
        throw new Error(response.error || 'Failed to save logo')
      }

      setFormData(updated)
      setSettings(updated)
      setLogoFile(null)
      setLogoPreview(dataUrl)
      setProfileCompletion(calculateProfileCompletion(updated))
      setSuccess('Logo uploaded successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('[v0] Logo upload error:', error)
      setError(error?.message || 'Failed to upload logo')
      setTimeout(() => setError(null), 4000)
    } finally {
      setIsLoadingLogo(false)
    }
  }

  // Remove logo — persist the removal so it does not reappear after refresh.
  const handleRemoveLogo = async () => {
    if (!formData || !businessId) return

    try {
      const updated = { ...formData, logo: '' }
      const response = await businessApi.updateSettings(businessId, updated)

      if (!response.success && !response.data) {
        throw new Error(response.error || 'Failed to remove logo')
      }

      setFormData(updated)
      setSettings(updated)
      setLogoFile(null)
      setLogoPreview(null)
      setProfileCompletion(calculateProfileCompletion(updated))
      setSuccess('Logo removed successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('[v0] Logo removal error:', error)
      setError(error?.message || 'Failed to remove logo')
      setTimeout(() => setError(null), 4000)
    }
  }

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
      checkBusinessHours()
    }
  }, [businessId])

  // Redirect to login if business ID error or not found
  useEffect(() => {
    if (!fetchingBusinessId && (businessIdError || !businessId)) {
      router.push('/login')
    }
  }, [fetchingBusinessId, businessIdError, businessId, router])

  const checkBusinessHours = async () => {
    if (!businessId) {
      return
    }
    try {
      const response = await businessHoursApi.getBusinessHours(businessId)
      // Check if business hours exist
      const hours = response.data || response
      setHasBusinessHours(
        hours && 
        (Array.isArray(hours) ? hours.length > 0 : Object.keys(hours).length > 0)
      )
    } catch (err) {
      console.error('[v0] Error checking business hours:', err)
      setHasBusinessHours(false)
    }
  }

  const loadSettings = async () => {
    if (!businessId) {
      return
    }
    try {
      setLoading(true)
      const response = await businessApi.getSettings(businessId)
      setFormData((response.data ?? response) as BusinessSettings)
      setProfileCompletion(
        calculateProfileCompletion((response.data ?? response) as BusinessSettings)
      )
      if (response.logo) {
        setLogoPreview(response.logo)
      }
      if (response.success && response.data) {
        setSettings(response.data)
        setFormData(response.data)
      } else if (response.data) {
        // Handle case where response.data directly contains settings
        setSettings(response.data)
        setFormData(response.data)
      } else {
        setSettings(defaultSettings)
        setFormData(defaultSettings)
        setError('No settings found, using defaults')
      }
      setError(null)
    } catch (err) {
      console.error('[v0] Error loading settings:', err)
      setSettings(defaultSettings)
      setFormData(defaultSettings)
      setError('Failed to load settings. Using default values.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async (tab: string) => {
    if (!businessId || !formData) return
    try {
      setSaving(true)
      const response = await businessApi.updateSettings(businessId, formData)
      if (response.success || response.data) {
        setSettings(formData)
        setSuccess(`${tab === 'business' ? 'Business' : tab === 'notifications' ? 'Notification' : 'Security'} settings updated successfully`)
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(response.error || 'Failed to save settings')
      }
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
        ...formData.notificationSettings,
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

        {/* Profile Completion Banner */}
        {profileCompletion < 100 && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Complete Your Profile</h3>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{profileCompletion}%</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-800/40 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Add a business logo and complete all fields to improve visibility in search results
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Business Hours Setup Reminder - Only show if no hours configured */}
        {!hasBusinessHours && (
          <Card className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100">Configure Business Hours</h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                      Set up your operating hours to enable customers to book appointments. Without business hours configured, online booking won&apos;t be available.
                    </p>
                    <Button 
                      onClick={() => router.push('/dashboard/business-hours')}
                      className="mt-3 bg-amber-600 hover:bg-amber-700 text-white"
                      size="sm"
                    >
                      Configure Hours →
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto">
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Business</span>
            </TabsTrigger>
            {/* <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger> */}
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Business Settings Tab */}
          <TabsContent value="business" className="space-y-6">
            {/* Logo Upload */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Business Logo
                </CardTitle>
                <CardDescription>Upload a professional logo for your business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  {/* Logo Preview */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border overflow-hidden">
                      {logoPreview || formData?.logo ? (
                        <img 
                          src={logoPreview || formData?.logo} 
                          alt="Business logo" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="logo-upload" className="block mb-2">Upload Logo (PNG, JPG - Max 5MB)</Label>
                        <Input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="block"
                        />
                      </div>
                      <div className="flex gap-2">
                        {logoFile && (
                          <>
                            <Button
                              onClick={handleLogoUpload}
                              disabled={isLoadingLogo}
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              {isLoadingLogo ? (
                                <>
                                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Logo
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => {
                                setLogoFile(null)
                                setLogoPreview(formData?.logo || null)
                              }}
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {(formData?.logo || logoPreview) && !logoFile && (
                          <Button
                            onClick={handleRemoveLogo}
                            variant="destructive"
                            className="gap-2"
                          >
                            <X className="w-4 h-4" />
                            Remove Logo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
          </TabsContent>

          {/* Notifications Tab
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
          </TabsContent> */}

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
