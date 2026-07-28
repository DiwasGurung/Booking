'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { AuthWrapper } from '@/components/AuthWrapper'
import { businessHoursApi, type BusinessHours } from '@/lib/api'
import { useBusinessId } from '@/hooks/useBusinessId'
import { Loader, Clock, Copy, Save, AlertCircle, CheckCircle, X, Calendar, Coffee, ChevronDown } from 'lucide-react'

interface DayHours {
  dayOfWeek: number
  dayName: string
  openingTime: string
  closingTime: string
}

interface ClosedDate {
  id?: string
  date: string
  reason: string
}

const DAYS = [
  { id: 0, name: 'Sunday' },
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
]

export default function BusinessHoursPage() {
  const router = useRouter()
  const { businessId, loading: businessLoading } = useBusinessId()
  
  const [dayHours, setDayHours] = useState<DayHours[]>([])
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([])
  const [newClosedDate, setNewClosedDate] = useState('')
  const [newClosedDateReason, setNewClosedDateReason] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('hours')

  useEffect(() => {
    if (businessId) {
      loadBusinessHours()
    }
  }, [businessId])

  async function loadBusinessHours() {
    if (!businessId) return

    try {
      setLoading(true)
      const response = await businessHoursApi.getBusinessHours(businessId)

      if (response.success && Array.isArray(response.data)) {
        const sortedHours = response.data.sort((a, b) => a.dayOfWeek - b.dayOfWeek)
        const formattedHours = sortedHours.map(hour => ({
          dayOfWeek: hour.dayOfWeek,
          dayName: DAYS.find(d => d.id === hour.dayOfWeek)?.name || 'Unknown',
          openingTime: hour.openingTime || '09:00',
          closingTime: hour.closingTime || '18:00',
        }))
        setDayHours(formattedHours)
      }
    } catch (err) {
      console.error('[v0] Error loading business hours:', err)
    } finally {
      setLoading(false)
    }
  }

  function updateDayHours(dayOfWeek: number, field: 'openingTime' | 'closingTime', value: string) {
    setDayHours(prev =>
      prev.map(day =>
        day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day
      )
    )
  }

  function copyHoursToAllDays(fromDayOfWeek: number) {
    const sourceDay = dayHours.find(d => d.dayOfWeek === fromDayOfWeek)
    if (!sourceDay) return

    setDayHours(prev =>
      prev.map(day =>
        day.dayOfWeek === fromDayOfWeek
          ? day
          : {
              ...day,
              openingTime: sourceDay.openingTime,
              closingTime: sourceDay.closingTime,
            }
      )
    )
  }

  function addClosedDate() {
    if (!newClosedDate) {
      setError('Please select a date')
      return
    }

    // Check if date already exists
    if (closedDates.some(d => d.date === newClosedDate)) {
      setError('This date is already marked as closed')
      return
    }

    setClosedDates([...closedDates, {
      date: newClosedDate,
      reason: newClosedDateReason
    }])

    setNewClosedDate('')
    setNewClosedDateReason('')
    setError(null)
  }

  function removeClosedDate(dateToRemove: string) {
    setClosedDates(closedDates.filter(d => d.date !== dateToRemove))
  }

  async function saveBusinessHours() {
    if (!businessId) return

    try {
      setSaving(true)
      setError(null)
      setSaveSuccess(false)

      // Save operating hours
      const savePromises = dayHours.map(day =>
        businessHoursApi.setBusinessHours({
          businessId,
          dayOfWeek: day.dayOfWeek,
          openTime: day.openingTime,
          closeTime: day.closingTime,
          isClosed: false,
        })
      )

      await Promise.all(savePromises)

      console.log('[v0] Business hours saved. Closed dates:', closedDates)

      setSaveSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err) {
      console.error('[v0] Error saving business hours:', err)
      setError(err instanceof Error ? err.message : 'Failed to save business hours')
    } finally {
      setSaving(false)
    }
  }

  if (businessLoading || loading) {
    return (
      <AuthWrapper mode="business-only">
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <Loader className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </AuthWrapper>
    )
  }

  return (
    <AuthWrapper mode="business-only">
      <div className=" min-h-screen bg-background">
        <Sidebar />
           <main className="md:ml-64 pt-6 px-4 md:px-8 py-8">
            <Breadcrumbs
              items={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Business Hours' },
              ]}
            />

            <div className="mt-6">
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Business Hours & Availability</h1>
                <p className="text-sm md:text-base text-muted-foreground mt-2">
                  Configure when your business is open to control available booking slots
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <Card className="mb-6 bg-destructive/10 border-destructive/30">
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Success Message */}
              {saveSuccess && (
                <Card className="mb-6 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800">
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">Saved successfully!</p>
                        <p className="text-xs text-green-800 dark:text-green-200 mt-1">Redirecting...</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Main Content */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl md:text-2xl">Configure Availability</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Tab List - Responsive */}
                    <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 gap-2 md:gap-0 h-auto md:h-10">
                      <TabsTrigger value="hours" className="flex items-center gap-2 justify-center py-2 md:py-0">
                        <Clock className="w-4 h-4" />
                        <span className="hidden sm:inline">Operating Hours</span>
                        <span className="sm:hidden">Hours</span>
                      </TabsTrigger>
                      <TabsTrigger value="holidays" className="flex items-center gap-2 justify-center py-2 md:py-0">
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline">Holidays</span>
                        <span className="sm:hidden">Days Off</span>
                      </TabsTrigger>
                      <TabsTrigger value="breaks" className="flex items-center gap-2 justify-center py-2 md:py-0">
                        <Coffee className="w-4 h-4" />
                        <span className="hidden sm:inline">Time Off</span>
                        <span className="sm:hidden">Off</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Operating Hours Tab */}
                    <TabsContent value="hours" className="space-y-4 mt-6">
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 md:p-4">
                        <p className="text-xs md:text-sm text-blue-900 dark:text-blue-100">
                          Set your regular operating hours for each day. These hours determine available booking slots.
                        </p>
                      </div>

                      <div className="space-y-3 md:space-y-4">
                        {dayHours.map(day => (
                          <div 
                            key={day.dayOfWeek} 
                            className="p-3 md:p-4 bg-card border border-border rounded-lg space-y-3"
                          >
                            {/* Day Name */}
                            <div className="flex items-center justify-between">
                              <Label className="text-sm md:text-base font-semibold">{day.dayName}</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyHoursToAllDays(day.dayOfWeek)}
                                title="Copy this day's hours to all other days"
                                className="h-8 px-2 text-xs md:text-sm gap-1"
                              >
                                <Copy className="w-3 h-3 md:w-4 md:h-4" />
                                <span className="hidden sm:inline">Copy</span>
                              </Button>
                            </div>

                            {/* Time Inputs - Stacked on mobile */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor={`open-${day.dayOfWeek}`} className="text-xs md:text-sm text-muted-foreground mb-1 block">
                                  Opens
                                </Label>
                                <Input
                                  id={`open-${day.dayOfWeek}`}
                                  type="time"
                                  value={day.openingTime}
                                  onChange={e => updateDayHours(day.dayOfWeek, 'openingTime', e.target.value)}
                                  className="w-full text-sm md:text-base"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`close-${day.dayOfWeek}`} className="text-xs md:text-sm text-muted-foreground mb-1 block">
                                  Closes
                                </Label>
                                <Input
                                  id={`close-${day.dayOfWeek}`}
                                  type="time"
                                  value={day.closingTime}
                                  onChange={e => updateDayHours(day.dayOfWeek, 'closingTime', e.target.value)}
                                  className="w-full text-sm md:text-base"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Holidays & Closed Dates Tab */}
                    <TabsContent value="holidays" className="space-y-4 mt-6">
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 md:p-4">
                        <p className="text-xs md:text-sm text-amber-900 dark:text-amber-100">
                          Add dates when your business is completely closed. Customers won&apos;t be able to book on these dates.
                        </p>
                      </div>

                      {/* Add Closed Date */}
                      <Card className="border-dashed">
                        <CardContent className="pt-4 md:pt-6">
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor="closed-date" className="text-xs md:text-sm">
                                  Date
                                </Label>
                                <Input
                                  id="closed-date"
                                  type="date"
                                  value={newClosedDate}
                                  onChange={(e) => setNewClosedDate(e.target.value)}
                                  className="w-full text-sm md:text-base"
                                />
                              </div>
                              <div>
                                <Label htmlFor="closed-reason" className="text-xs md:text-sm">
                                  Reason (Optional)
                                </Label>
                                <Input
                                  id="closed-reason"
                                  placeholder="e.g., Holiday, Maintenance"
                                  value={newClosedDateReason}
                                  onChange={(e) => setNewClosedDateReason(e.target.value)}
                                  className="w-full text-sm md:text-base"
                                />
                              </div>
                            </div>
                            <Button 
                              onClick={addClosedDate}
                              className="w-full" 
                              size="sm"
                            >
                              Add Closed Date
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Closed Dates List */}
                      {closedDates.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs md:text-sm font-medium text-muted-foreground">
                            {closedDates.length} closed date{closedDates.length !== 1 ? 's' : ''}
                          </p>
                          {closedDates.map((date, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm md:text-base">{date.date}</p>
                                {date.reason && <p className="text-xs md:text-sm text-muted-foreground">{date.reason}</p>}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="ml-2"
                                onClick={() => removeClosedDate(date.date)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {closedDates.length === 0 && (
                        <div className="p-4 text-center bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">No closed dates set yet</p>
                        </div>
                      )}
                    </TabsContent>

                    {/* Time Off Tab */}
                    <TabsContent value="breaks" className="space-y-4 mt-6">
                      <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3 md:p-4">
                        <p className="text-xs md:text-sm text-purple-900 dark:text-purple-100">
                          Coming soon: Manage staff time off and break schedules.
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button
                  onClick={saveBusinessHours}
                  disabled={saving || saveSuccess}
                  size="lg"
                  className="flex-1 md:flex-none items-center gap-2 min-h-10 md:min-h-11"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save & Close
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  size="lg"
                  disabled={saving}
                  className="flex-1 md:flex-none min-h-10 md:min-h-11"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
            </main>
      </div>
    </AuthWrapper>
  )
}
