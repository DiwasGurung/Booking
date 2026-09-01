'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { AuthWrapper } from '@/components/AuthWrapper'
import { businessHoursApi } from '@/lib/api'
import { useBusinessId } from '@/hooks/useBusinessId'
import {
  Loader,
  Clock,
  Copy,
  Save,
  AlertCircle,
  CheckCircle,
  X,
  Calendar,
  Pencil,
  RotateCcw,
  Plus,
  MoonStar,
} from 'lucide-react'

interface DayHours {
  dayOfWeek: number
  dayName: string
  openingTime: string
  closingTime: string
  isOff: boolean
}

interface ClosedDate {
  id?: string
  date: string
  reason: string
}

const DAYS = [
  { id: 0, name: 'Sunday', short: 'Sun' },
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
]

const DEFAULT_OPEN = '09:00'
const DEFAULT_CLOSE = '18:00'

// Always start from a full Sunday -> Saturday list at 09:00 - 18:00
function buildDefaultHours(): DayHours[] {
  return DAYS.map(day => ({
    dayOfWeek: day.id,
    dayName: day.name,
    openingTime: DEFAULT_OPEN,
    closingTime: DEFAULT_CLOSE,
    isOff: false,
  }))
}

// Normalize any time value coming from the API into "HH:mm"
function normalizeTime(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || value.trim() === '') return fallback
  const match = value.match(/(\d{1,2}):(\d{2})/)
  if (!match) return fallback
  const hours = match[1].padStart(2, '0')
  return `${hours}:${match[2]}`
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h)) return time
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${suffix}`
}

function formatDuration(open: string, close: string): string {
  const diff = toMinutes(close) - toMinutes(open)
  if (diff <= 0) return 'Invalid range'
  const hours = Math.floor(diff / 60)
  const minutes = diff % 60
  return minutes === 0 ? `${hours}h open` : `${hours}h ${minutes}m open`
}

function formatDateLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function daysBetween(start: string, end: string): number {
  const diff =
    new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24)) + 1
}

export default function BusinessHoursPage() {
  const router = useRouter()
  const { businessId, loading: businessLoading } = useBusinessId()

  // Seeded with all 7 days so the UI is never empty
  const [dayHours, setDayHours] = useState<DayHours[]>(buildDefaultHours)
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([])
  const [newClosedDate, setNewClosedDate] = useState('')
  const [newClosedDateEnd, setNewClosedDateEnd] = useState('')
  const [newClosedDateReason, setNewClosedDateReason] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('hours')
  const [pendingRangeKeys, setPendingRangeKeys] = useState<Set<string>>(new Set())
  const [editingRangeKey, setEditingRangeKey] = useState<string | null>(null)
  const [editReason, setEditReason] = useState('')

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
        businessHoursApi.getClosedDates(businessId) as any,
      ])

      // Merge saved hours on top of the 9-6 defaults so every day is always rendered
      const merged = buildDefaultHours()

      const savedHours = Array.isArray(hoursResponse?.data)
        ? hoursResponse.data
        : Array.isArray(hoursResponse)
          ? hoursResponse
          : []

      savedHours.forEach((hour: any) => {
        const index = merged.findIndex(d => d.dayOfWeek === Number(hour.dayOfWeek))
        if (index === -1) return

        merged[index] = {
          ...merged[index],
          openingTime: normalizeTime(hour.openTime ?? hour.openingTime, DEFAULT_OPEN),
          closingTime: normalizeTime(hour.closeTime ?? hour.closingTime, DEFAULT_CLOSE),
          isOff: Boolean(hour.isClosed),
        }
      })

      setDayHours(merged)

      const savedClosedDates = Array.isArray(closedDatesResponse?.data?.data)
        ? closedDatesResponse.data.data
        : Array.isArray(closedDatesResponse?.data)
          ? closedDatesResponse.data
          : Array.isArray(closedDatesResponse)
            ? closedDatesResponse
            : []

      setClosedDates(
        savedClosedDates.map((closedDate: any) => ({
          id: closedDate.id,
          date: String(closedDate.date).split('T')[0],
          reason: closedDate.reason || '',
        }))
      )
    } catch (err) {
    
      setDayHours(buildDefaultHours())
    } finally {
      setLoading(false)
    }
  }

  const groupedClosedDates = (() => {
    if (closedDates.length === 0) return []

    const sorted = [...closedDates].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const grouped: { start: string; end: string; reason: string }[] = []
    let current = {
      start: sorted[0].date,
      end: sorted[0].date,
      reason: sorted[0].reason,
    }

    for (let i = 1; i < sorted.length; i++) {
      const currentDate = new Date(sorted[i].date)
      const prevDate = new Date(sorted[i - 1].date)
      const diffDays = Math.round(
        (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (diffDays === 1 && sorted[i].reason === current.reason) {
        current.end = sorted[i].date
      } else {
        grouped.push(current)
        current = {
          start: sorted[i].date,
          end: sorted[i].date,
          reason: sorted[i].reason,
        }
      }
    }
    grouped.push(current)
    return grouped
  })()

  const openDays = dayHours.filter(d => !d.isOff)
  const weeklyMinutes = openDays.reduce((total, day) => {
    const diff = toMinutes(day.closingTime) - toMinutes(day.openingTime)
    return total + (diff > 0 ? diff : 0)
  }, 0)

  function updateDayHours(dayOfWeek: number, field: 'openingTime' | 'closingTime', value: string) {
    setDayHours(prev =>
      prev.map(day => (day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day))
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

  function resetToDefaultHours() {
    setDayHours(buildDefaultHours())
  }

  function closeWeekends() {
    setDayHours(prev =>
      prev.map(day =>
        day.dayOfWeek === 0 || day.dayOfWeek === 6 ? { ...day, isOff: true } : day
      )
    )
  }

  // Staged locally only — nothing is uploaded until "Save"
  function addClosedDate() {
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

    setError(null)

    const start = new Date(newClosedDate)
    const end = new Date(newClosedDateEnd)
    const datesInRange: ClosedDate[] = []

    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      datesInRange.push({
        date: d.toISOString().split('T')[0],
        reason: newClosedDateReason,
      })
    }

    setClosedDates(prev => {
      const existing = new Set(prev.map(d => d.date))
      return [...prev, ...datesInRange.filter(d => !existing.has(d.date))]
    })

    setNewClosedDate('')
    setNewClosedDateEnd('')
    setNewClosedDateReason('')
  }

  async function removeClosedDateRange(start: string, end: string) {
    if (!businessId) return
    const key = `${start}_${end}`
    setPendingRangeKeys(prev => new Set(prev).add(key))
    setError(null)

    const toRemove = closedDates.filter(d => d.date >= start && d.date <= end)
    const persisted = toRemove.filter(d => d.id)

    try {
      await Promise.all(
        persisted.map(d => businessHoursApi.removeClosedDate(businessId, d.id as string))
      )
      // Only drop from state once the server confirms the deletes succeeded
      setClosedDates(prev => prev.filter(d => !(d.date >= start && d.date <= end)))
    } catch (err) {
    
      setError(err instanceof Error ? err.message : 'Failed to remove closed dates')
    } finally {
      setPendingRangeKeys(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  function startEditReason(start: string, end: string, currentReason: string) {
    setEditingRangeKey(`${start}_${end}`)
    setEditReason(currentReason)
  }

  function cancelEditReason() {
    setEditingRangeKey(null)
    setEditReason('')
  }

  async function saveEditReason(start: string, end: string) {
    if (!businessId) return
    const key = `${start}_${end}`
    setPendingRangeKeys(prev => new Set(prev).add(key))
    setError(null)

    const inRange = closedDates.filter(d => d.date >= start && d.date <= end)
    const persisted = inRange.filter(d => d.id)

    try {
      // Delete the old persisted entries, then re-add every date in the range with the new reason
      await Promise.all(
        persisted.map(d => businessHoursApi.removeClosedDate(businessId, d.id as string))
      )
      const readded = await Promise.all(
        inRange.map(d =>
          businessHoursApi.addClosedDate(businessId, { date: d.date, reason: editReason })
        )
      )

      setClosedDates(prev => {
        const withoutRange = prev.filter(d => !(d.date >= start && d.date <= end))
        const newEntries = inRange.map((d, i) => ({
          id: (readded[i]?.data as any)?.id,
          date: d.date,
          reason: editReason,
        }))
        return [...withoutRange, ...newEntries]
      })

      setEditingRangeKey(null)
      setEditReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update closed dates')
    } finally {
      setPendingRangeKeys(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  function toggleDayOff(dayOfWeek: number) {
    setDayHours(prev =>
      prev.map(day => (day.dayOfWeek === dayOfWeek ? { ...day, isOff: !day.isOff } : day))
    )
  }

  async function saveBusinessHours() {
    if (!businessId) return

    try {
      setSaving(true)
      setError(null)
      setSaveSuccess(false)

      // Save operating hours for all 7 days
      const hoursPromises = dayHours.map(day =>
        businessHoursApi.setBusinessHours({
          businessId,
          dayOfWeek: day.dayOfWeek,
          openTime: day.isOff ? '00:00' : day.openingTime,
          closeTime: day.isOff ? '00:00' : day.closingTime,
          isClosed: day.isOff,
        })
      )

      // Only upload closed dates that aren't already persisted
      const closedDatesPromises = closedDates
        .filter(closedDate => !closedDate.id)
        .map(closedDate =>
          businessHoursApi.addClosedDate(businessId, {
            date: closedDate.date,
            reason: closedDate.reason,
          })
        )

      await Promise.all([...hoursPromises, ...closedDatesPromises])

      setSaveSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save business hours')
    } finally {
      setSaving(false)
    }
  }

  if (businessLoading || loading) {
    return (
      <AuthWrapper mode="business-only">
        <div className="min-h-screen bg-background">
          <Sidebar />
          <main className="md:ml-64 flex min-h-screen items-center justify-center px-4">
            <div className="flex flex-col items-center gap-3">
              <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading your schedule…</p>
            </div>
          </main>
        </div>
      </AuthWrapper>
    )
  }

  const saveButtonContent = saving ? (
    <>
      <Loader className="h-4 w-4 animate-spin" />
      Saving…
    </>
  ) : saveSuccess ? (
    <>
      <CheckCircle className="h-4 w-4" />
      Saved
    </>
  ) : (
    <>
      <Save className="h-4 w-4" />
      Save changes
    </>
  )

  return (
    <AuthWrapper mode="business-only">
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="md:ml-64">
          <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-8">
            <Breadcrumbs
              items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Business Hours' }]}
            />

            {/* Page header */}
            <header className="mt-6 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance md:text-3xl">
                  Business hours &amp; availability
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Set when you are open so customers only see bookable slots. Changes upload when you
                  save.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-4 rounded-lg border border-border bg-card px-4 py-2 sm:flex">
                  <div className="flex flex-col">
                    <span className="text-lg font-semibold leading-tight text-foreground">
                      {openDays.length}
                      <span className="text-sm font-normal text-muted-foreground">/7</span>
                    </span>
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Open days
                    </span>
                  </div>
                  <div className="h-8 w-px bg-border" aria-hidden="true" />
                  <div className="flex flex-col">
                    <span className="text-lg font-semibold leading-tight text-foreground">
                      {Math.round(weeklyMinutes / 60)}h
                    </span>
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Per week
                    </span>
                  </div>
                </div>

                <Button
                  onClick={saveBusinessHours}
                  disabled={saving || saveSuccess}
                  className="hidden items-center gap-2 md:inline-flex"
                >
                  {saveButtonContent}
                </Button>
              </div>
            </header>

            {/* Alerts */}
            {error && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {saveSuccess && (
              <div
                role="status"
                className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-muted px-4 py-3"
              >
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-foreground" />
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-foreground">Availability saved</p>
                  <p className="text-xs text-muted-foreground">Taking you back to the dashboard…</p>
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
              {/* Editor */}
              <section>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="inline-flex h-auto w-full gap-1 rounded-lg bg-muted p-1 sm:w-auto">
                    <TabsTrigger
                      value="hours"
                      className="flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm sm:flex-none"
                    >
                      <Clock className="h-4 w-4" />
                      Weekly hours
                    </TabsTrigger>
                    <TabsTrigger
                      value="closed"
                      className="flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm sm:flex-none"
                    >
                      <Calendar className="h-4 w-4" />
                      Closed dates
                      {closedDates.length > 0 && (
                        <span className="rounded-full bg-foreground px-1.5 text-[11px] font-medium leading-5 text-background">
                          {groupedClosedDates.length}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* Weekly hours */}
                  <TabsContent value="hours" className="mt-6 space-y-4">
                    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">
                        Defaults to 09:00 – 18:00 every day.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={closeWeekends}
                          className="h-8 gap-1.5 text-xs"
                        >
                          <MoonStar className="h-3.5 w-3.5" />
                          Close weekends
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetToDefaultHours}
                          className="h-8 gap-1.5 text-xs"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reset to 9–6
                        </Button>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                      {dayHours.map((day, index) => {
                        const short = DAYS.find(d => d.id === day.dayOfWeek)?.short ?? ''
                        const invalid =
                          !day.isOff && toMinutes(day.closingTime) <= toMinutes(day.openingTime)

                        return (
                          <div
                            key={day.dayOfWeek}
                            className={`flex flex-col gap-3 px-4 py-4 transition-colors lg:flex-row lg:items-center lg:gap-6 ${
                              index !== 0 ? 'border-t border-border' : ''
                            } ${day.isOff ? 'bg-muted/40' : 'bg-card'}`}
                          >
                            {/* Day identity */}
                            <div className="flex items-center justify-between gap-3 lg:w-52 lg:justify-start">
                              <div className="flex items-center gap-3">
                                <span
                                  aria-hidden="true"
                                  className={`flex h-9 w-9 items-center justify-center rounded-md text-[11px] font-semibold uppercase tracking-wide ${
                                    day.isOff
                                      ? 'bg-muted text-muted-foreground'
                                      : 'bg-foreground text-background'
                                  }`}
                                >
                                  {short}
                                </span>
                                <div className="flex flex-col">
                                  <Label className="text-sm font-medium text-foreground">
                                    {day.dayName}
                                  </Label>
                                  <span className="text-xs text-muted-foreground">
                                    {day.isOff
                                      ? 'Closed all day'
                                      : formatDuration(day.openingTime, day.closingTime)}
                                  </span>
                                </div>
                              </div>

                              {/* Mobile-only actions */}
                              <div className="flex items-center gap-1 lg:hidden">
                                {!day.isOff && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyHoursToAllDays(day.dayOfWeek)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Copy className="h-4 w-4" />
                                    <span className="sr-only">
                                      Copy {day.dayName} hours to all days
                                    </span>
                                  </Button>
                                )}
                                <Button
                                  variant={day.isOff ? 'secondary' : 'ghost'}
                                  size="sm"
                                  onClick={() => toggleDayOff(day.dayOfWeek)}
                                  className="h-8 gap-1.5 px-2 text-xs"
                                >
                                  {day.isOff ? (
                                    <>
                                      <CheckCircle className="h-3.5 w-3.5" />
                                      Open
                                    </>
                                  ) : (
                                    <>
                                      <X className="h-3.5 w-3.5" />
                                      Close
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Times */}
                            {day.isOff ? (
                              <p className="flex-1 text-sm text-muted-foreground">
                                Customers cannot book on {day.dayName}s.
                              </p>
                            ) : (
                              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
                                <div className="flex-1">
                                  <Label
                                    htmlFor={`open-${day.dayOfWeek}`}
                                    className="mb-1 block text-xs text-muted-foreground"
                                  >
                                    Opens
                                  </Label>
                                  <Input
                                    id={`open-${day.dayOfWeek}`}
                                    type="time"
                                    value={day.openingTime}
                                    onChange={e =>
                                      updateDayHours(day.dayOfWeek, 'openingTime', e.target.value)
                                    }
                                    className="h-10 w-full"
                                  />
                                </div>
                                <span
                                  aria-hidden="true"
                                  className="hidden pb-3 text-muted-foreground sm:block"
                                >
                                  –
                                </span>
                                <div className="flex-1">
                                  <Label
                                    htmlFor={`close-${day.dayOfWeek}`}
                                    className="mb-1 block text-xs text-muted-foreground"
                                  >
                                    Closes
                                  </Label>
                                  <Input
                                    id={`close-${day.dayOfWeek}`}
                                    type="time"
                                    value={day.closingTime}
                                    onChange={e =>
                                      updateDayHours(day.dayOfWeek, 'closingTime', e.target.value)
                                    }
                                    aria-invalid={invalid}
                                    className={`h-10 w-full ${
                                      invalid ? 'border-destructive text-destructive' : ''
                                    }`}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Desktop-only actions */}
                            <div className="hidden items-center gap-1 lg:flex">
                              {!day.isOff && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyHoursToAllDays(day.dayOfWeek)}
                                  title="Apply these hours to every day"
                                  className="h-9 gap-1.5 text-xs"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  Apply to all
                                </Button>
                              )}
                              <Button
                                variant={day.isOff ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => toggleDayOff(day.dayOfWeek)}
                                className="h-9 w-24 gap-1.5 text-xs"
                              >
                                {day.isOff ? (
                                  <>
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    Reopen
                                  </>
                                ) : (
                                  <>
                                    <X className="h-3.5 w-3.5" />
                                    Close day
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </TabsContent>

                  {/* Closed dates */}
                  <TabsContent value="closed" className="mt-6 space-y-4">
                    <Card>
                      <CardContent className="flex flex-col gap-4 p-4 md:p-5">
                        <div className="flex flex-col gap-1">
                          <h2 className="text-sm font-medium text-foreground">Add a closure</h2>
                          <p className="text-xs text-muted-foreground">
                            Block a single day or a full range, such as a holiday shutdown.
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <Label htmlFor="closed-start-date" className="mb-1 block text-xs">
                              Start date
                            </Label>
                            <Input
                              id="closed-start-date"
                              type="date"
                              value={newClosedDate}
                              onChange={e => setNewClosedDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="h-10 w-full"
                            />
                          </div>
                          <div>
                            <Label htmlFor="closed-end-date" className="mb-1 block text-xs">
                              End date
                            </Label>
                            <Input
                              id="closed-end-date"
                              type="date"
                              value={newClosedDateEnd}
                              onChange={e => setNewClosedDateEnd(e.target.value)}
                              min={newClosedDate || new Date().toISOString().split('T')[0]}
                              className="h-10 w-full"
                            />
                          </div>
                          <div>
                            <Label htmlFor="closed-reason" className="mb-1 block text-xs">
                              Reason (optional)
                            </Label>
                            <Input
                              id="closed-reason"
                              placeholder="Holiday, maintenance…"
                              value={newClosedDateReason}
                              onChange={e => setNewClosedDateReason(e.target.value)}
                              className="h-10 w-full"
                            />
                          </div>
                        </div>

                        <Button
                          onClick={addClosedDate}
                          variant="outline"
                          className="w-full gap-2 sm:w-auto sm:self-start"
                        >
                          <Plus className="h-4 w-4" />
                          Add closure
                        </Button>
                      </CardContent>
                    </Card>

                    {groupedClosedDates.length > 0 ? (
                      <div className="overflow-hidden rounded-xl border border-border bg-card">
                        {groupedClosedDates.map((range, idx) => {
                          const key = `${range.start}_${range.end}`
                          const isPending = pendingRangeKeys.has(key)
                          const isEditing = editingRangeKey === key
                          const total = daysBetween(range.start, range.end)

                          return (
                            <div
                              key={key}
                              className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
                                idx !== 0 ? 'border-t border-border' : ''
                              }`}
                            >
                              <div className="flex min-w-0 flex-1 items-start gap-3">
                                <span
                                  aria-hidden="true"
                                  className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
                                >
                                  <Calendar className="h-4 w-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-foreground">
                                      {range.start === range.end
                                        ? formatDateLabel(range.start)
                                        : `${formatDateLabel(range.start)} – ${formatDateLabel(range.end)}`}
                                    </p>
                                    <span className="rounded-full border border-border px-2 text-[11px] leading-5 text-muted-foreground">
                                      {total} day{total !== 1 ? 's' : ''}
                                    </span>
                                  </div>

                                  {isEditing ? (
                                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                                      <Input
                                        value={editReason}
                                        onChange={e => setEditReason(e.target.value)}
                                        placeholder="Reason"
                                        className="h-9 flex-1"
                                        disabled={isPending}
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          className="h-9"
                                          disabled={isPending}
                                          onClick={() => saveEditReason(range.start, range.end)}
                                        >
                                          {isPending ? (
                                            <Loader className="h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            'Save'
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-9"
                                          disabled={isPending}
                                          onClick={cancelEditReason}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="truncate text-xs text-muted-foreground">
                                      {range.reason || 'No reason given'}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {!isEditing && (
                                <div className="flex items-center gap-1 self-end sm:self-auto">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={isPending}
                                    onClick={() =>
                                      startEditReason(range.start, range.end, range.reason)
                                    }
                                    className="h-9 w-9 p-0"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit reason</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={isPending}
                                    onClick={() => removeClosedDateRange(range.start, range.end)}
                                    className="h-9 w-9 p-0"
                                  >
                                    {isPending ? (
                                      <Loader className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <X className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">Remove closure</span>
                                  </Button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">No closures yet</p>
                        <p className="max-w-xs text-xs text-muted-foreground">
                          Your weekly hours apply every week until you add a closed date.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </section>

              {/* Summary rail (desktop) */}
              <aside className="hidden lg:block">
                <div className="sticky top-8 flex flex-col gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Week at a glance
                      </h2>
                      <ul className="flex flex-col gap-2">
                        {dayHours.map(day => (
                          <li
                            key={day.dayOfWeek}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <span className="text-muted-foreground">
                              {DAYS.find(d => d.id === day.dayOfWeek)?.short}
                            </span>
                            {day.isOff ? (
                              <span className="text-xs font-medium text-muted-foreground">
                                Closed
                              </span>
                            ) : (
                              <span className="font-mono text-xs text-foreground">
                                {formatTime12(day.openingTime)} – {formatTime12(day.closingTime)}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="flex flex-col gap-2 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Open days</span>
                        <span className="font-medium text-foreground">{openDays.length} of 7</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Weekly hours</span>
                        <span className="font-medium text-foreground">
                          {Math.round(weeklyMinutes / 60)}h
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Closed dates</span>
                        <span className="font-medium text-foreground">{closedDates.length}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </aside>
            </div>
          </div>

          {/* Mobile sticky save bar */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {openDays.length}/7 days open
                </span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(weeklyMinutes / 60)}h per week
                </span>
              </div>
              <Button
                onClick={saveBusinessHours}
                disabled={saving || saveSuccess}
                className="ml-auto flex-1 items-center gap-2"
              >
                {saveButtonContent}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </AuthWrapper>
  )
}
