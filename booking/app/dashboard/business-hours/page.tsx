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
import { Loader, Clock, Copy, Save, AlertCircle, CheckCircle, X, Calendar } from 'lucide-react'

interface DayHours {
  dayOfWeek: number
  dayName: string
  openingTime: string
  closingTime: string
  isOff?: boolean
  isClosed?: boolean
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
  const [newClosedDateEnd, setNewClosedDateEnd] = useState('')
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
      const [hoursResponse, closedDatesResponse] = await Promise.all([
        businessHoursApi.getBusinessHours(businessId),
        businessHoursApi.getClosedDates(businessId),
      ])

      // Load business hours
      if (hoursResponse.success && Array.isArray(hoursResponse.data)) {
        const sortedHours = hoursResponse.data.sort((a, b) => a.dayOfWeek - b.dayOfWeek)
        const formattedHours = sortedHours.map(hour => ({
          dayOfWeek: hour.dayOfWeek,
          dayName: DAYS.find(d => d.id === hour.dayOfWeek)?.name || 'Unknown',
          openingTime: hour.openTime || hour.openTime || '09:00',
          closingTime: hour.closeTime || hour.closeTime || '18:00',
          isOff: hour.isClosed || false,
          isClosed: hour.isClosed || false,
        }))
        setDayHours(formattedHours)
      }

      // Load closed dates
      if (closedDatesResponse.success && Array.isArray(closedDatesResponse.data)) {
        const formattedClosedDates = closedDatesResponse.data.map(closedDate => ({
          date: closedDate.date.split('T')[0], // Format date to YYYY-MM-DD
          reason: closedDate.reason || '',
          id: closedDate.id,
        }))
        setClosedDates(formattedClosedDates)
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

  async function addClosedDate() {
    if (!newClosedDate) {
      setError('Please enter start date')
      return
    }

    if (!newClosedDateEnd) {
      setError('Please enter end date')
      return
    }

    if (new Date(newClosedDate) > new Date(newClosedDateEnd)) {
      setError('End date must be after start date')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Generate all dates in the range
      const start = new Date(newClosedDate)
      const end = new Date(newClosedDateEnd)
      const datesInRange = []

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        datesInRange.push({
          date: d.toISOString().split('T')[0],
          reason: newClosedDateReason,
        })
      }

      // Save each closed date to database
      for (const closedDate of datesInRange) {
        await businessHoursApi.addClosedDate(businessId as string, {
          date: closedDate.date,
          reason: closedDate.reason,
        })
      }

      // Update local state
      setClosedDates([...closedDates, ...datesInRange])
      setNewClosedDate('')
      setNewClosedDateEnd('')
      setNewClosedDateReason('')
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      setError('Failed to add closed date')
      console.error('[v0] Error adding closed date:', err)
    } finally {
      setSaving(false)
    }
  }

  async function removeClosedDate(dateToRemove: string) {
    try {
      setSaving(true)
      const datesToRemove = closedDates.filter(d => d.date >= dateToRemove && d.date <= dateToRemove)
      
      // Note: You would need to implement a delete method in your API
      // For now, just update local state
      setClosedDates(closedDates.filter(d => !(d.date >= dateToRemove && d.date <= dateToRemove)))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      setError('Failed to remove closed date')
    } finally {
      setSaving(false)
    }
  }

  function toggleDayOff(dayOfWeek: number) {
    setDayHours(dayHours.map(day =>
      day.dayOfWeek === dayOfWeek
        ? { ...day, isOff: !day.isOff }
        : day
    ))
  }

  async function saveBusinessHours() {
    if (!businessId) return

    try {
      setSaving(true)
      setError(null)
      setSaveSuccess(false)

      // Save operating hours
      const hoursPromises = dayHours.map(day =>
        businessHoursApi.setBusinessHours({
          businessId,
          dayOfWeek: day.dayOfWeek,
          openTime: day.isOff ? '00:00' : day.openingTime,
          closeTime: day.isOff ? '00:00' : day.closingTime,
          isClosed: day.isClosed !== undefined ? day.isClosed : (day.isOff || false),
        })
      )

      // Save closed dates
      const closedDatesPromises = closedDates.map(closedDate =>
        businessHoursApi.addClosedDate(businessId, {
          date: closedDate.date,
          reason: closedDate.reason,
        })
      )

      await Promise.all([...hoursPromises, ...closedDatesPromises])

      console.log('[v0] Business hours and closed dates saved successfully')

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
                    <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 gap-2 md:gap-0 h-auto md:h-10">
                      <TabsTrigger value="hours" className="flex items-center gap-2 justify-center py-2 md:py-0">
                        <Clock className="w-4 h-4" />
                        <span className="hidden sm:inline">Operating Hours</span>
                        <span className="sm:hidden">Hours</span>
                      </TabsTrigger>
                      <TabsTrigger value="closed" className="flex items-center gap-2 justify-center py-2 md:py-0">
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline">Closed Dates</span>
                        <span className="sm:hidden">Closed</span>
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
                            className={`p-3 md:p-4 border rounded-lg space-y-3 transition-colors ${
                              day.isOff
                                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                : 'bg-card border-border'
                            }`}
                          >
                            {/* Day Name and Off Toggle */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Label className={`text-sm md:text-base font-semibold ${day.isOff ? 'text-red-700 dark:text-red-400' : ''}`}>
                                  {day.dayName}
                                </Label>
                                {day.isOff && (
                                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200">
                                    Closed
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2 items-center">
                                {!day.isOff && (
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
                                )}
                                <Button
                                  variant={day.isOff ? "destructive" : "outline"}
                                  size="sm"
                                  onClick={() => toggleDayOff(day.dayOfWeek)}
                                  title={day.isOff ? "Mark as open" : "Mark as closed all day"}
                                  className="h-8 px-2 text-xs md:text-sm gap-1"
                                >
                                  {day.isOff ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                                      <span className="hidden sm:inline">Open</span>
                                    </>
                                  ) : (
                                    <>
                                      <X className="w-3 h-3 md:w-4 md:h-4" />
                                      <span className="hidden sm:inline">Close Day</span>
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Time Inputs - Only show if day is not off */}
                            {!day.isOff && (
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
                            )}
                            
                            {/* Show message when day is off */}
                            {day.isOff && (
                              <div className="text-sm text-red-700 dark:text-red-400 py-2">
                                This day is marked as closed. Customers cannot book on {day.dayName}s.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Closed Dates Tab */}
                    <TabsContent value="closed" className="space-y-4 mt-6">
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 md:p-4">
                        <p className="text-xs md:text-sm text-amber-900 dark:text-amber-100">
                          Add specific dates when your business is completely closed. Customers won&apos;t be able to book on these dates.
                        </p>
                      </div>

                      {/* Add Closed Date Range */}
                      <Card className="border-dashed">
                        <CardContent className="pt-4 md:pt-6">
                          <div className="space-y-3">
                            <p className="text-xs text-muted-foreground font-medium">Select date range for closure</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <Label htmlFor="closed-start-date" className="text-xs md:text-sm">
                                  Start Date
                                </Label>
                                <Input
                                  id="closed-start-date"
                                  type="date"
                                  value={newClosedDate}
                                  onChange={(e) => setNewClosedDate(e.target.value)}
                                  min={new Date().toISOString().split('T')[0]}
                                  className="w-full text-sm md:text-base"
                                />
                              </div>
                              <div>
                                <Label htmlFor="closed-end-date" className="text-xs md:text-sm">
                                  End Date
                                </Label>
                                <Input
                                  id="closed-end-date"
                                  type="date"
                                  value={newClosedDateEnd}
                                  onChange={(e) => setNewClosedDateEnd(e.target.value)}
                                  min={newClosedDate || new Date().toISOString().split('T')[0]}
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
                              disabled={saving}
                              className="w-full" 
                              size="sm"
                            >
                              {saving ? (
                                <>
                                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                                  Adding...
                                </>
                              ) : saveSuccess ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Added!
                                </>
                              ) : (
                                'Add Closed Dates'
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Closed Dates List - Grouped by Range */}
                      {closedDates.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            {closedDates.length} closed date{closedDates.length !== 1 ? 's' : ''} (grouped by range)
                          </p>
                          {(() => {
                            // Group consecutive dates
                            if (!closedDates || closedDates.length === 0) return []
                            
                            const sorted = [...closedDates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            const grouped = []
                            let current = { start: sorted[0].date, end: sorted[0].date, reason: sorted[0].reason }

                            for (let i = 1; i < sorted.length; i++) {
                              const currentDate = new Date(sorted[i].date)
                              const prevDate = new Date(sorted[i - 1].date)
                              const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

                              if (diffDays === 1 && sorted[i].reason === current.reason) {
                                current.end = sorted[i].date
                              } else {
                                grouped.push(current)
                                current = { start: sorted[i].date, end: sorted[i].date, reason: sorted[i].reason }
                              }
                            }
                            grouped.push(current)

                            return grouped.map((range, idx) => (
                              <div key={idx} className="p-3 bg-card border border-border rounded-lg flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm md:text-base">
                                    {range.start === range.end ? range.start : `${range.start} to ${range.end}`}
                                  </p>
                                  {range.reason && <p className="text-xs md:text-sm text-muted-foreground">{range.reason}</p>}
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="ml-2"
                                  onClick={() => {
                                    // Remove all dates in this range
                                    setClosedDates(closedDates.filter(d => !(d.date >= range.start && d.date <= range.end)))
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))
                          })()}
                        </div>
                      )}

                      {closedDates.length === 0 && (
                        <div className="p-4 text-center bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">No closed dates set yet</p>
                        </div>
                      )}
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
