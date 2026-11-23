'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Calendar, Clock, CheckCircle2, AlertCircle, Briefcase, User, Phone, X, Check, Info,
  ChevronLeft, ChevronRight, MapPin, Mail, CalendarPlus, type LucideIcon,
} from 'lucide-react'
import { DateTime } from 'luxon'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getCurrentUser } from '@/lib/auth'
import type { Staff } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

// NEXT_PUBLIC_ prefix is required for env vars to exist in client components
const BUSINESS_TZ = process.env.NEXT_PUBLIC_BUSINESS_TIME_ZONE || 'Asia/Kathmandu'

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const DAY_LABELS: Record<string, string> = {
  sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const INACTIVE_REDIRECT_SECONDS = 5

interface TimeSlot {
  time: string
  isAvailable: boolean
}

interface DaySchedule {
  start: string
  end: string
  isWorking: boolean
}

/* ----------------------------- pure helpers ----------------------------- */

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

// "Now" in the business time zone (NOT the device zone, NOT UTC)
const nowInTz = () => DateTime.now().setZone(BUSINESS_TZ)
const todayInTz = () => nowInTz().toISODate() as string

const formatDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const slotToDateTime = (dateStr: string, slot: string): DateTime =>
  DateTime.fromISO(`${dateStr}T${slot}`, { zone: BUSINESS_TZ })

const isSlotInFuture = (dateStr: string, slot: string): boolean => {
  if (dateStr !== todayInTz()) return true
  const dt = slotToDateTime(dateStr, slot)
  if (!dt.isValid) return true
  return dt > nowInTz()
}

const formatTimeSlot = (slot: string): string => {
  const [h, m] = slot.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return slot
  const period = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`
}

// 1000 -> "Rs. 1,000", 1250.5 -> "Rs. 1,250.5"
const formatPrice = (value: number): string =>
  `Rs. ${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Scrolls to the first ref that is mounted, after React has rendered the next step
const scrollToFirst = (...refs: RefObject<HTMLElement | null>[]) => {
  window.setTimeout(() => {
    const el = refs.map((r) => r.current).find(Boolean)
    el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  }, 120)
}

const getNormalizedWorkingHours = (staffData: any): Record<string, DaySchedule> | null => {
  let raw = staffData?.workingHours
  if (!raw) return null
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw) } catch { return null }
  }
  if (typeof raw !== 'object') return null
  const normalized: Record<string, DaySchedule> = {}
  Object.keys(raw).forEach((key) => { normalized[key.toLowerCase()] = raw[key] })
  return normalized
}

// 30-minute slots from open (inclusive) to close (exclusive), as "HH:mm"
const generateTimeSlots = (open: string, close: string): string[] => {
  const [oh, om] = open.split(':').map(Number)
  const [ch, cm] = close.split(':').map(Number)
  const slots: string[] = []
  for (let mins = oh * 60 + om; mins < ch * 60 + cm; mins += 30) {
    slots.push(`${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`)
  }
  return slots
}

/* ------------------------------ components ------------------------------ */

function Spinner({ size = 8 }: { size?: 8 | 12 }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${
        size === 12 ? 'h-12 w-12' : 'h-8 w-8'
      }`}
    />
  )
}

// One consistent header for every step: numbered badge that turns into a check when done
function StepHeader({
  id, number, icon: Icon, title, done,
}: {
  id?: string
  number: number
  icon: LucideIcon
  title: string
  done?: boolean
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
          done ? 'bg-primary text-primary-foreground' : 'border-2 border-primary/40 text-primary'
        }`}
      >
        {done ? <Check className="h-4 w-4" /> : number}
      </span>
      <h2 id={id} className="flex items-center gap-2 text-base font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        {title}
      </h2>
    </div>
  )
}

function Section({
  sectionRef, labelledBy, children,
}: {
  sectionRef?: RefObject<HTMLElement | null>
  labelledBy?: string
  children: React.ReactNode
}) {
  return (
    <section
      ref={sectionRef as RefObject<HTMLElement>}
      aria-labelledby={labelledBy}
      className="scroll-mt-4 border-b border-border py-7 first:pt-0 last:border-b-0 last:pb-0"
    >
      {children}
    </section>
  )
}

function ErrorAlert({ message, innerRef }: { message: string; innerRef?: RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={innerRef as RefObject<HTMLDivElement>}
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-destructive/50 bg-destructive/5 p-4"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
      <p className="break-words text-sm text-foreground sm:text-base">{message}</p>
    </div>
  )
}
function StaffHeader({ staff }: { staff: any }) {
  const [imgFailed, setImgFailed] = useState(false)

  const fullName = `${staff.firstName ?? ''} ${staff.lastName ?? ''}`.trim()
  const branch = staff.branch
  const showBranchName = branch?.name && branch.name !== staff.businessName
  const hasAvatar = typeof staff.avatar === 'string' && staff.avatar && !imgFailed

  const chip =
    'inline-flex max-w-full items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1.5 text-xs text-muted-foreground sm:text-sm'

  return (
    <div className="bg-gradient-to-b from-primary/5 to-transparent px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-card shadow-md ring-4 ring-card sm:h-28 sm:w-28">
          {hasAvatar ? (
            <img
              src={staff.avatar}
              alt={fullName}
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10">
              <span className="text-2xl font-semibold text-primary">{getInitials(fullName)}</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="break-words text-2xl font-bold leading-tight text-foreground md:text-3xl">
            {fullName || 'Book your appointment'}
          </h1>
          {(staff.role || staff.businessName) && (
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {[staff.role, staff.businessName].filter(Boolean).join(' at ')}
            </p>
          )}

          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            {staff.email && (
              <a href={`mailto:${staff.email}`} className={`${chip} hover:text-foreground`}>
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{staff.email}</span>
              </a>
            )}
            {staff.phone && (
              <a href={`tel:${staff.phone}`} className={`${chip} hover:text-foreground`}>
                <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {staff.phone}
              </a>
            )}
            {branch?.address && (
              <span className={chip}>
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {showBranchName ? `${branch.name}, ` : ''}
                  {branch.address}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StaffBookPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const staffCode = params.staffCode as string

  /* ------------------------------- state ------------------------------- */

  const [staff, setStaff] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  // The date the currently shown slots belong to. While it differs from the
  // chosen date we show the small spinner instead of stale/empty slots.
  const [slotsFor, setSlotsFor] = useState('')
  const [closedReason, setClosedReason] = useState<string | null>(null)

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')

  const [businessHours, setBusinessHours] = useState<any[]>([])
  const [closedDates, setClosedDates] = useState<Map<string, string>>(new Map())
  const [staffTimeOff, setStaffTimeOff] = useState<Set<string>>(new Set())
  const [hoursLoading, setHoursLoading] = useState(true)

  const [submitting, setSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [error, setError] = useState('')

  // Inactive staff notice
  const [inactiveNoticeOpen, setInactiveNoticeOpen] = useState(false)
  const [inactiveCountdown, setInactiveCountdown] = useState(INACTIVE_REDIRECT_SECONDS)

  // Verification modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Calendar state
  const [dateCalendarOpen, setDateCalendarOpen] = useState(false)
  const [dateHint, setDateHint] = useState<string | null>(null) // why a tapped day is unavailable (works on touch)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const dateCalendarRef = useRef<HTMLDivElement>(null)

  /* ------------------------------- refs -------------------------------- */

  const slotsRequestId = useRef(0)
  const dateRef = useRef<HTMLElement>(null)
  const timeRef = useRef<HTMLElement>(null)
  const infoRef = useRef<HTMLElement>(null)
  const bottomErrorRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  /* ------------------------------ derived data --------------------------- */

  const staffServices: any[] = useMemo(() => (staff as any)?.services ?? [], [staff])
  const selectedService = useMemo(
    () => staffServices.find((ss: any) => ss.serviceId === serviceId)?.service ?? null,
    [staffServices, serviceId]
  )
  const finalPrice = selectedService ? selectedService.offerPrice || selectedService.price : 0

  const hoursByDay = useMemo(() => {
    const map = new Map<number, any>()
    businessHours.forEach((bh: any) => map.set(bh.dayOfWeek, bh))
    return map
  }, [businessHours])

  // Parsed once per staff member instead of once per calendar cell
  const staffSchedule = useMemo(() => getNormalizedWorkingHours(staff), [staff])

  const slotsLoading = !!date && slotsFor !== date

  const phoneValid = customerPhone.length === 10
  const emailValid = EMAIL_RE.test(customerEmail)
  const nameValid = customerName.trim().length > 0
  const detailsValid = nameValid && emailValid && phoneValid

  // A booking that exists but has not been phone-verified yet
  const pendingVerification = !!bookingId && !bookingSuccess && !showVerificationModal

  const showDate = !!selectedService
  const showTime = !!selectedService && !!date && !closedReason
  const showDetails = !!selectedService && !!date && !!selectedTime

  /* ------------------------- date availability logic ---------------------- */

  const getDateDisabledInfo = useCallback(
    (d: Date): { disabled: boolean; reason?: string } => {
      if (hoursLoading) return { disabled: true, reason: 'Loading business hours' }

      const dateStr = formatDateStr(d)
      const todayStr = todayInTz()

      if (dateStr < todayStr) return { disabled: true, reason: 'This date has already passed' }

      if (staffTimeOff.has(dateStr)) return { disabled: true, reason: 'Staff is on time off' }

      if (closedDates.has(dateStr)) {
        return { disabled: true, reason: closedDates.get(dateStr) || 'Business is closed' }
      }

      const adjustedDayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1
      const dayHours = hoursByDay.get(adjustedDayOfWeek)
      if (!dayHours || dayHours.isClosed) {
        return { disabled: true, reason: 'Business is closed on this day' }
      }

      if (dateStr === todayStr && dayHours.closeTime) {
        const closing = DateTime.fromISO(`${dateStr}T${dayHours.closeTime}`, { zone: BUSINESS_TZ })
        if (closing.isValid && nowInTz() > closing) {
          return { disabled: true, reason: 'Business is closed for today' }
        }
      }

      const dayName = DAY_KEYS[d.getDay()]
      const daySchedule = staffSchedule?.[dayName]
      if (daySchedule && daySchedule.isWorking === false) {
        return { disabled: true, reason: `${staff?.firstName || 'Staff'} does not work on ${DAY_LABELS[dayName]}s` }
      }

      return { disabled: false }
    },
    [hoursLoading, staffTimeOff, closedDates, hoursByDay, staffSchedule, staff?.firstName]
  )

  // Calendar grid is computed once per relevant change, not on every render
  const calendarDays = useMemo(() => {
    if (!dateCalendarOpen) return []
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const list: { day: number; dateStr: string; label: string; disabled: boolean; reason?: string }[] = []
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day)
      const { disabled, reason } = getDateDisabledInfo(cellDate)
      list.push({
        day,
        dateStr: formatDateStr(cellDate),
        label: cellDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
        disabled,
        reason,
      })
    }
    return list
  }, [dateCalendarOpen, calendarMonth, getDateDisabledInfo])

  const calendarStartOffset = useMemo(
    () => new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay(),
    [calendarMonth]
  )

  /* -------------------------------- loaders ------------------------------ */

  const loadAvailableSlots = async (selectedDate: string) => {
    if (!staff) return
    const reqId = ++slotsRequestId.current
    const isStale = () => reqId !== slotsRequestId.current
    const finish = (slots: TimeSlot[], reason: string | null) => {
      if (isStale()) return
      setAvailableSlots(slots)
      setClosedReason(reason)
      setSlotsFor(selectedDate)
    }

    // Cheap local checks first: no network needed
    if (staffTimeOff.has(selectedDate)) {
      finish([], 'Staff member is on time off for this date')
      return
    }

    if (closedDates.has(selectedDate)) {
      finish([], closedDates.get(selectedDate) || 'Business is closed')
      return
    }

    const dt = DateTime.fromISO(selectedDate, { zone: BUSINESS_TZ })
    const dayName = DAY_KEYS[dt.weekday % 7]
    const staffDaySchedule = staffSchedule?.[dayName]

    if (staffDaySchedule && staffDaySchedule.isWorking === false) {
      finish([], `${staff.firstName} does not work on ${DAY_LABELS[dayName]}s`)
      return
    }

    const dayHours = hoursByDay.get(dt.weekday - 1)
    if (!dayHours || dayHours.isClosed) {
      finish([], dayHours ? 'Business is closed on this day' : 'Business hours not found')
      return
    }

    // Intersect business hours with the staff member's own hours for the day
    let effectiveOpen: string = String(dayHours.openTime).slice(0, 5)
    let effectiveClose: string = String(dayHours.closeTime).slice(0, 5)
    if (staffDaySchedule?.isWorking) {
      const sStart = String(staffDaySchedule.start).slice(0, 5)
      const sEnd = String(staffDaySchedule.end).slice(0, 5)
      if (sStart > effectiveOpen) effectiveOpen = sStart
      if (sEnd < effectiveClose) effectiveClose = sEnd
    }

    if (effectiveOpen >= effectiveClose) {
      finish([], `${staff.firstName} has no overlapping hours with the business on this day`)
      return
    }

    if (selectedDate === todayInTz()) {
      const closing = DateTime.fromISO(`${selectedDate}T${effectiveClose}`, { zone: BUSINESS_TZ })
      if (closing.isValid && nowInTz() > closing) {
        finish([], 'Business is closed for today')
        return
      }
    }

    // Times already booked for this staff member on that date
    const bookedTimes = new Set<string>()
    try {
      const res = await fetch(`${API_URL}/api/staff/code/${staff.staffCode}/bookings/date?date=${selectedDate}`)
      if (isStale()) return
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json()
        const bookings = Array.isArray(data) ? data : data.bookings ?? []
        bookings.forEach((booking: any) => {
          if (!booking.startTime || !booking.endTime) return
          const end = DateTime.fromISO(booking.endTime).setZone(BUSINESS_TZ)
          let cur = DateTime.fromISO(booking.startTime).setZone(BUSINESS_TZ)
          // Block every 30-minute slot for the whole service duration
          while (cur < end) {
            bookedTimes.add(cur.toFormat('HH:mm'))
            cur = cur.plus({ minutes: 30 })
          }
        })
      }
    } catch {
      if (isStale()) return
    }

    const slots = generateTimeSlots(effectiveOpen, effectiveClose).map((time) => ({
      time,
      isAvailable: !bookedTimes.has(time) && isSlotInFuture(selectedDate, time),
    }))
    finish(slots, null)
  }

  /* -------------------------------- effects ------------------------------ */

  // Staff info, current user, business hours and closed dates
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const user = await getCurrentUser()
        if (cancelled) return
        setCurrentUser(user)

        const response = await fetch(`${API_URL}/api/staff/code/${staffCode}`)
        if (!response.ok) {
          setLoadError(response.status === 404 ? 'Staff member not found' : 'Failed to load staff information')
          return
        }
        const data = await response.json()
        if (cancelled) return
        setStaff(data)

        if (data.isActive === false) {
          setInactiveCountdown(INACTIVE_REDIRECT_SECONDS)
          setInactiveNoticeOpen(true)
          return
        }

        // Only one service means nothing to choose
        if (data.services?.length === 1) setServiceId(data.services[0].serviceId)

        const q = data.branchId ? `?branchId=${data.branchId}` : ''
        try {
          const [hours, closed] = await Promise.all([
            fetch(`${API_URL}/api/business-hours/business/${data.businessId}${q}`).then((r) => (r.ok ? r.json() : null)),
            fetch(`${API_URL}/api/business-hours/${data.businessId}/closed-dates${q}`).then((r) => (r.ok ? r.json() : null)),
          ])
          if (cancelled) return
          if (hours) setBusinessHours(Array.isArray(hours) ? hours : hours.data ?? [])
          const map = new Map<string, string>()
          if (closed?.success && closed.data) {
            closed.data.forEach((cd: any) => {
              map.set(new Date(cd.date).toISOString().split('T')[0], cd.reason || 'Business is closed')
            })
          }
          setClosedDates(map)
        } catch {
          // keep whatever we had; calendar will show unavailable days
        }
      } catch (err: any) {
        if (!cancelled) setLoadError(err.message || 'An error occurred')
      } finally {
        if (!cancelled) {
          setLoading(false)
          setHoursLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [staffCode])

  // Pre-fill details for signed-in users
  useEffect(() => {
    if (!currentUser) return
    setCustomerName(currentUser.name || '')
    setCustomerEmail(currentUser.email || '')
    setCustomerPhone((currentUser.phone || '').replace(/\D/g, '').slice(-10))
  }, [currentUser])

  // Staff time off for the month on screen, so the calendar can grey those days out
  useEffect(() => {
    if (!staff?.id) return
    let cancelled = false
    const month = formatDateStr(calendarMonth).substring(0, 7)
    ;(async () => {
      try {
        const res = await fetch(`${API_URL}/api/staff/${staff.id}/time-off?month=${month}`)
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return
        const data = await res.json()
        if (cancelled || !Array.isArray(data)) return
        setStaffTimeOff((prev) => {
          const next = new Set(prev)
          data.forEach((to: any) => next.add(String(to.date).split('T')[0]))
          return next
        })
      } catch {
        // time off is a nicety for the calendar; slot loading still checks again
      }
    })()
    return () => {
      cancelled = true
    }
  }, [staff?.id, calendarMonth])

  // Load slots whenever the chosen date (or the data it depends on) changes
  useEffect(() => {
    if (!date || !staff || hoursLoading) return
    loadAvailableSlots(date)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, staff, hoursLoading, staffTimeOff, closedDates, businessHours])

  // Inactive notice: count down, then send the customer to the business page
  useEffect(() => {
    if (!inactiveNoticeOpen) return
    const timer = window.setInterval(() => setInactiveCountdown((v) => (v <= 1 ? 0 : v - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [inactiveNoticeOpen])

  useEffect(() => {
    if (inactiveCountdown === 0 && inactiveNoticeOpen && staff?.businessId) {
      router.replace(`/book/${staff.businessId}`)
    }
  }, [inactiveCountdown, inactiveNoticeOpen, router, staff?.businessId])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((v) => (v <= 1 ? 0 : v - 1)), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Lock page scroll while the modal is open
  useEffect(() => {
    if (!showVerificationModal) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [showVerificationModal])

  // Modal: move focus in, close on Escape, keep Tab inside the dialog
  useEffect(() => {
    if (!showVerificationModal) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusables = () =>
      Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        ) ?? []
      )

    window.setTimeout(() => modalRef.current?.querySelector<HTMLInputElement>('input')?.focus(), 50)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowVerificationModal(false)
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [showVerificationModal])

  // Calendar: close on outside click or Escape
  useEffect(() => {
    if (!dateCalendarOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dateCalendarRef.current && !dateCalendarRef.current.contains(e.target as Node)) {
        setDateCalendarOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDateCalendarOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [dateCalendarOpen])

  useEffect(() => {
    if (date) {
      const [y, m] = date.split('-').map(Number)
      setCalendarMonth(new Date(y, m - 1, 1))
    }
  }, [date])

  // Errors raised next to the confirm button must be visible, not off-screen
  useEffect(() => {
    if (error && selectedTime) {
      bottomErrorRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' })
    }
  }, [error, selectedTime])

  /* ------------------------------- handlers ------------------------------ */

  // Back to a clean form after a finished (or abandoned) booking, without a full page reload
  const startOver = () => {
    setServiceId(staffServices.length === 1 ? staffServices[0].serviceId : '')
    setDate('')
    setSelectedTime(null)
    setAvailableSlots([])
    setSlotsFor('')
    setClosedReason(null)
    setDateHint(null)
    setError('')
    setBookingSuccess(false)
    setBookingId('')
    setVerificationCode('')
    setCodeError(null)
    setNotes('')
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  const chooseService = (id: string) => {
    if (id === serviceId) return
    setServiceId(id)
    setDate('')
    setSelectedTime(null)
    setClosedReason(null)
    setDateHint(null)
    setError('')
    scrollToFirst(dateRef)
  }

  const selectDate = (dateStr: string) => {
    setDate(dateStr)
    setSelectedTime(null)
    setClosedReason(null)
    setDateCalendarOpen(false)
    setDateHint(null)
    setError('')
    scrollToFirst(timeRef)
  }

  const chooseTime = (slot: string) => {
    setSelectedTime(slot)
    setError('')
    scrollToFirst(infoRef)
  }

  const goToPrevMonth = () => {
    setCalendarMonth((prev) => {
      const next = new Date(prev)
      next.setMonth(next.getMonth() - 1)
      const startOfThisMonth = new Date()
      startOfThisMonth.setDate(1)
      startOfThisMonth.setHours(0, 0, 0, 0)
      return next < startOfThisMonth ? prev : next
    })
  }

  const goToNextMonth = () => {
    setCalendarMonth((prev) => {
      const next = new Date(prev)
      next.setMonth(next.getMonth() + 1)
      return next
    })
  }

  const sendPhoneVerificationCode = async (id: string) => {
    setSendingCode(true)
    setCodeError(null)
    try {
      const res = await fetch(`${API_URL}/api/public-verification/bookings/${id}/send-phone-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'PHONE_VERIFICATION' }),
      })
      const data = await res.json()

      if (data.alreadyVerified === true || (data.error && /already verified/i.test(data.error))) {
        setShowVerificationModal(false)
        setBookingSuccess(true)
        return true
      }

      if (!res.ok || !data.success) {
        setCodeError(data.error || 'We could not send the code. Try again.')
        if (typeof data.retryAfterSeconds === 'number') setResendCooldown(data.retryAfterSeconds)
        return false
      }
      setResendCooldown(30)
      return true
    } catch {
      setCodeError('We could not send the code. Check your connection and try again.')
      return false
    } finally {
      setSendingCode(false)
    }
  }

  const handleResendCode = async () => {
    if (!bookingId || resendCooldown > 0) return
    await sendPhoneVerificationCode(bookingId)
  }

  const handleVerifyCode = async () => {
    if (!bookingId) return
    if (!verificationCode || verificationCode.length < 4) {
      setCodeError('Enter the code we sent to your phone')
      return
    }
    setVerifyingCode(true)
    setCodeError(null)
    try {
      const res = await fetch(`${API_URL}/api/public-verification/bookings/${bookingId}/verify-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode, purpose: 'PHONE_VERIFICATION' }),
      })
      const data = await res.json()

      if (data.alreadyVerified === true || (data.error && /already verified/i.test(data.error))) {
        setShowVerificationModal(false)
        setVerificationCode('')
        setBookingSuccess(true)
        return
      }

      if (!res.ok || !data.success) {
        setCodeError(
          typeof data.attemptsRemaining === 'number'
            ? `${data.error || 'That code is not correct'} (${data.attemptsRemaining} attempts left)`
            : data.error || 'That code is not correct'
        )
        return
      }
      setShowVerificationModal(false)
      setVerificationCode('')
      setBookingSuccess(true)
    } catch {
      setCodeError('We could not verify the code. Check your connection and try again.')
    } finally {
      setVerifyingCode(false)
    }
  }

  const handleConfirmBooking = async () => {
    // A booking was already created and is waiting for its code: reopen, never duplicate
    if (bookingId && !bookingSuccess) {
      setShowVerificationModal(true)
      return
    }

    if (!staff || !selectedService || !date || !selectedTime) {
      setError('Choose a service, date, and time')
      return
    }

    if (!isSlotInFuture(date, selectedTime)) {
      setError('That time has passed. Choose a different time.')
      setSelectedTime(null)
      return
    }

    if (!currentUser) {
      if (!nameValid) return setError('Enter your full name')
      if (!emailValid) return setError('Enter a valid email address')
      if (!phoneValid) return setError('Enter a 10-digit phone number')
    }

    try {
      setSubmitting(true)

      const startDateTime = slotToDateTime(date, selectedTime)
      const startTimeISO = startDateTime.toISO()
      const endTimeISO = startDateTime.plus({ minutes: selectedService.duration || 60 }).toISO()

      const bookingPayload: any = {
        businessId: staff.businessId,
        branchId: staff.branchId ?? undefined,
        staffId: staff.id,
        serviceId,
        startTime: startTimeISO,
        endTime: endTimeISO,
        notes,
      }

      // Customer details only for public bookings; signed-in users come from the backend
      if (!currentUser) {
        bookingPayload.customerName = customerName
        bookingPayload.customerEmail = customerEmail
        bookingPayload.customerPhone = customerPhone
      }

      const endpoint = currentUser ? '/api/booking' : '/api/booking/public'
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: currentUser ? 'include' : 'omit',
        body: JSON.stringify(bookingPayload),
      })

      if (!res.ok) {
        let err: any
        try {
          err = await res.json()
        } catch {
          err = { message: 'Failed to parse error response' }
        }

        let message = err.message || 'We could not create your booking. Try again.'
        if (res.status === 401) message = 'Your session has expired. Log in again to complete your booking.'
        else if (res.status === 400) message = err.reason ? `${err.message} (email validation failed)` : err.message || 'Check the details and try again.'
        else if (res.status === 429) message = err.message || 'Booking limit reached. Upgrade your subscription to continue.'
        setError(message)
        return
      }

      const bookingData = await res.json()
      const createdBooking = bookingData.booking || bookingData
      setError('')

      if (bookingData.warnings?.length > 0) {
        toast({
          title: 'Booking created with warnings',
          description: bookingData.warnings.join('\n') || bookingData.message,
        })
      }

      const requiresVerification =
  createdBooking?.isPhoneVerified === false ||
  createdBooking?.status === 'UNVERIFIED'

if (createdBooking?.id) setBookingId(createdBooking.id)

if (requiresVerification && createdBooking?.id) {
  setVerificationCode('')
  setCodeError(null)
  setShowVerificationModal(true)
  await sendPhoneVerificationCode(createdBooking.id)
} else {
  setBookingSuccess(true)
}
    } catch (err: any) {
      setError(
        err?.name === 'AbortError'
          ? 'The request timed out. Check your connection and try again.'
          : 'We could not create your booking. Check your connection and try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Downloads an .ics file so the appointment can go straight into any calendar app
  const addToCalendar = () => {
    if (!selectedService || !date || !selectedTime) return
    const start = slotToDateTime(date, selectedTime)
    if (!start.isValid) return
    const end = start.plus({ minutes: selectedService.duration || 60 })
    const fmt = (dt: DateTime) => dt.toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'")
    const branch = (staff as any)?.branch
    const where = branch ? [branch.name, branch.address].filter(Boolean).join(', ') : ''
    const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Appoint-Nepal//Booking//EN',
      'BEGIN:VEVENT',
      `UID:${bookingId || start.toMillis()}@appoint-nepal`,
      `DTSTAMP:${fmt(DateTime.now())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${esc(`${selectedService.name} with ${staff?.firstName ?? ''} ${staff?.lastName ?? ''}`.trim())}`,
      where ? `LOCATION:${esc(where)}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n')

    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'appointment.ics'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  /* ------------------------------- rendering ----------------------------- */

  const pageBg = 'min-h-screen bg-gradient-to-br from-background via-background to-secondary/30'

  if (loading) {
    return (
      <div className={`${pageBg} flex items-center justify-center p-4`}>
        <div className="text-center">
          <div className="mx-auto mb-4"><Spinner size={12} /></div>
          <p className="text-lg text-muted-foreground">Loading booking page...</p>
        </div>
      </div>
    )
  }

  if (loadError || !staff) {
    return (
      <div className={`${pageBg} flex items-center justify-center p-4`}>
        <div className="mx-auto max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" aria-hidden="true" />
          <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">{loadError || 'Staff member not found'}</h1>
          <p className="text-muted-foreground">Check the booking link and try again.</p>
        </div>
      </div>
    )
  }

  const staffAny = staff as any
  const staffName = `${staff.firstName ?? ''} ${staff.lastName ?? ''}`.trim()

  const inactiveModal = inactiveNoticeOpen && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inactive-staff-title"
    >
      <Card className="w-full max-w-md gap-0 border border-border shadow-2xl">
        <CardHeader>
          <CardTitle id="inactive-staff-title">Staff member unavailable</CardTitle>
          <CardDescription>
            {staffName} is inactive and cannot accept bookings. We will take you to the business booking page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted px-4 py-3 text-center text-sm text-muted-foreground" aria-live="polite">
            Redirecting in <span className="font-semibold text-foreground">{inactiveCountdown}</span> seconds...
          </div>
        </CardContent>
      </Card>
    </div>
  )

  if (inactiveNoticeOpen) {
    return <div className={pageBg}>{inactiveModal}</div>
  }

  if (bookingSuccess) {
    const dateLabel = DateTime.fromISO(`${date}T00:00:00`, { zone: BUSINESS_TZ })
      .setLocale('en')
      .toLocaleString({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    const rows: { label: string; value: React.ReactNode }[] = [
      ...(staffAny.businessName ? [{ label: 'Business', value: staffAny.businessName }] : []),
      ...(staffAny.branch?.address
        ? [{
            label: 'Location',
            value: (
              <>
                {staffAny.branch.name}
                <span className="block text-xs text-muted-foreground">{staffAny.branch.address}</span>
              </>
            ),
          }]
        : []),
      { label: 'Service', value: selectedService?.name || 'N/A' },
      { label: 'Staff', value: staffName },
      { label: 'Date', value: dateLabel },
      { label: 'Time', value: selectedTime ? formatTimeSlot(selectedTime) : 'N/A' },
      { label: 'Price', value: formatPrice(finalPrice) },
    ]

    return (
      <div className={`${pageBg} flex items-center justify-center p-4 md:p-8`}>
        <div className="mx-auto w-full max-w-xl">
          <Card className="gap-0 border border-border py-0 shadow-2xl">
            <div className="p-5 text-center sm:p-10">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 sm:h-20 sm:w-20">
                <CheckCircle2 className="h-10 w-10 text-primary sm:h-12 sm:w-12" aria-hidden="true" />
              </div>
              <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">Booking confirmed</h1>
              <p className="mb-8 text-base text-muted-foreground sm:text-lg">Your appointment is booked. See you soon.</p>

              <dl className="mb-8 divide-y divide-border rounded-xl border border-primary/20 bg-primary/5 px-5 text-left">
                {rows.map((r) => (
                  <div key={r.label} className="flex items-start justify-between gap-4 py-3">
                    <dt className="text-sm font-semibold text-foreground">{r.label}</dt>
                    <dd className="text-right text-sm text-foreground">{r.value}</dd>
                  </div>
                ))}
              </dl>

              {bookingId && (
                <p className="mb-6 break-all text-xs text-muted-foreground">
                  Booking reference: <code className="font-mono text-foreground">{bookingId}</code>
                </p>
              )}

              <div className="mb-8 flex flex-col gap-3 sm:flex-row">
                <Button onClick={addToCalendar} variant="outline" className="h-12 flex-1 font-semibold">
                  <CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Add to calendar
                </Button>
                <Button onClick={startOver} className="h-12 flex-1 bg-primary font-semibold hover:bg-primary/90">
                  Book another service
                </Button>
              </div>

              <div className="border-t border-border pt-6">
                <p className="break-words text-sm text-muted-foreground">
                  A confirmation has been sent to <span className="font-semibold text-foreground">{customerEmail}</span>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  let stepCounter = 0
  const stepService = ++stepCounter
  const stepDate = ++stepCounter
  const stepTime = ++stepCounter
  const stepInfo = ++stepCounter

  return (
    <div className={`${pageBg} px-3 py-4 sm:p-6 md:p-8`}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 sm:mb-8">
          <Card className="gap-0 overflow-hidden border border-border py-0 shadow-lg">
            <StaffHeader staff={staff} />
          </Card>

          <p className="mt-4 px-2 text-center text-sm text-muted-foreground">
            Choose a service, date, and time to book with {staff.firstName}.
          </p>
        </div>

        {/* Errors that happen before a time is picked show up here; later ones sit by the confirm button */}
        {error && !selectedTime && (
          <div className="mb-6">
            <ErrorAlert message={error} />
          </div>
        )}

        {/* A booking was created but its phone code was never entered */}
        {pendingVerification && (
          <div role="status" className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="text-sm">Your booking is saved but not confirmed. Enter the code we sent to {customerPhone} to confirm it.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" onClick={() => setShowVerificationModal(true)}>Enter code</Button>
              <Button size="sm" variant="outline" onClick={startOver}>Start over</Button>
            </div>
          </div>
        )}

        <Card className="gap-0 border border-border py-0 shadow-lg">
          <div className="p-4 sm:p-6 md:p-10">
            {/* Service */}
            <Section labelledBy="step-service">
              <StepHeader id="step-service" number={stepService} icon={Briefcase} title="Select a service" done={!!selectedService} />

              {staffServices.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 p-6 text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
                  {staff.firstName} has no services to book yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {staffServices.map((ss: any) => {
                    const svc = ss.service
                    if (!svc) return null
                    const selected = serviceId === ss.serviceId
                    return (
                      <button
                        key={ss.serviceId}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => chooseService(ss.serviceId)}
                        className={`relative flex h-full flex-col items-stretch justify-between gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                          selected
                            ? 'border-primary bg-primary text-primary-foreground shadow-md'
                            : 'border-border bg-card text-foreground hover:border-primary'
                        }`}
                      >
                        {selected && (
                          <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-primary">
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                        )}
                        <div className={selected ? 'pr-7' : ''}>
                          <div className="font-semibold leading-snug">{svc.name}</div>
                          {svc.description && (
                            <div className="mt-1 line-clamp-2 text-sm opacity-75">{svc.description}</div>
                          )}
                        </div>

                        <div className="flex items-end justify-between gap-3 text-xs">
                          <span className="inline-flex items-center gap-1 opacity-75">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            {svc.duration} min
                          </span>
                          <span className="whitespace-nowrap text-right text-sm font-semibold">
                            {svc.offerPrice ? (
                              <>
                                <span className="mr-1.5 text-xs font-normal line-through opacity-60">
                                  {formatPrice(svc.price)}
                                </span>
                                {formatPrice(svc.offerPrice)}
                              </>
                            ) : (
                              formatPrice(svc.price)
                            )}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </Section>

            {/* Date */}
            {showDate && (
              <Section sectionRef={dateRef} labelledBy="step-date">
                <StepHeader id="step-date" number={stepDate} icon={Calendar} title="Select a date" done={!!date && !closedReason} />

                <div className="relative" ref={dateCalendarRef}>
                  <button
                    type="button"
                    onClick={() => setDateCalendarOpen((open) => !open)}
                    aria-haspopup="dialog"
                    aria-expanded={dateCalendarOpen}
                    className="flex h-12 w-full items-center justify-between rounded-md border border-border bg-background px-3 text-left text-sm"
                  >
                    <span className={date ? '' : 'text-muted-foreground'}>
                      {date
                        ? new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                          })
                        : 'Select a date'}
                    </span>
                    <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </button>

                  {dateCalendarOpen && (
                    <div
                      role="dialog"
                      aria-label="Choose a date"
                      className="absolute left-0 z-20 mt-2 w-full max-w-sm rounded-xl border border-border bg-card p-3 shadow-lg sm:w-80"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <button type="button" onClick={goToPrevMonth} className="rounded p-2 hover:bg-muted" aria-label="Previous month">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-semibold" aria-live="polite">
                          {calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </span>
                        <button type="button" onClick={goToNextMonth} className="rounded p-2 hover:bg-muted" aria-label="Next month">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mb-1 grid grid-cols-7 gap-1" aria-hidden="true">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                          <div key={d} className="text-center text-xs font-medium text-muted-foreground">{d}</div>
                        ))}
                      </div>

                      {hoursLoading ? (
                        <div className="flex justify-center py-10"><Spinner /></div>
                      ) : (
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: calendarStartOffset }).map((_, i) => (
                            <div key={`blank-${i}`} />
                          ))}
                          {calendarDays.map(({ day, dateStr, label, disabled, reason }) => {
                            const isToday = dateStr === todayInTz()
                            const isSelected = date === dateStr
                            return (
                              <button
                                key={dateStr}
                                type="button"
                                aria-label={disabled && reason ? `${label}, unavailable: ${reason}` : label}
                                aria-disabled={disabled}
                                aria-pressed={isSelected}
                                onClick={() => {
                                  if (disabled) {
                                    setDateHint(`${label}: ${reason ?? 'Unavailable'}`)
                                  } else {
                                    selectDate(dateStr)
                                  }
                                }}
                                className={`mx-auto flex aspect-square w-full max-w-10 items-center justify-center rounded-md text-sm transition-colors ${
                                  disabled
                                    ? 'cursor-not-allowed text-muted-foreground/40 line-through'
                                    : isSelected
                                    ? 'bg-primary font-semibold text-primary-foreground'
                                    : 'text-foreground hover:bg-primary/10'
                                } ${isToday && !isSelected ? 'ring-1 ring-primary/50' : ''}`}
                              >
                                {day}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      <p className="mt-3 min-h-[2.5rem] border-t border-border pt-2 text-xs text-muted-foreground" aria-live="polite">
                        {dateHint ?? 'Crossed-out days are unavailable. Tap one to see why.'}
                      </p>
                    </div>
                  )}
                </div>

                {closedReason && !slotsLoading && (
                  <div role="status" className="mt-4 flex items-center justify-center rounded-md border border-amber-200 bg-amber-50 px-4 py-5 text-center text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    <AlertCircle className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="text-sm">{closedReason}</span>
                  </div>
                )}
              </Section>
            )}

            {/* Time: only this section shows a spinner while slots load */}
            {showTime && (
              <Section sectionRef={timeRef} labelledBy="step-time">
                <StepHeader id="step-time" number={stepTime} icon={Clock} title="Select a time" done={!!selectedTime} />

                {slotsLoading ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : availableSlots.every((s) => !s.isAvailable) ? (
                  <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 p-4 text-sm sm:p-6">
                    <AlertCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
                    <span>No times are available on this date with {staff.firstName}. Try another date.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {availableSlots.map((slot) => {
                      const selected = selectedTime === slot.time && slot.isAvailable
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => slot.isAvailable && chooseTime(slot.time)}
                          disabled={!slot.isAvailable}
                          title={!slot.isAvailable ? 'This time is not available' : undefined}
                          className={`rounded-lg border-2 px-1 py-2.5 text-xs font-medium transition-all sm:p-3 sm:text-sm ${
                            !slot.isAvailable
                              ? 'cursor-not-allowed border-input bg-muted text-muted-foreground opacity-50'
                              : selected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-card text-foreground hover:border-primary'
                          }`}
                        >
                          {formatTimeSlot(slot.time)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </Section>
            )}

            {/* Customer info */}
            {showDetails && selectedService && selectedTime && (
              <Section sectionRef={infoRef} labelledBy="step-info">
                <StepHeader id="step-info" number={stepInfo} icon={User} title="Your details" done={detailsValid} />

                <div className="space-y-4">
                  <div>
                    <label htmlFor="customer-name" className="mb-1 block text-sm font-medium text-foreground">
                      Full name <span aria-hidden="true">*</span>
                    </label>
                    <Input
                      id="customer-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your full name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      disabled={!!currentUser}
                      required
                      className={`h-11 ${currentUser ? 'cursor-not-allowed bg-muted text-muted-foreground' : ''}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="customer-email" className="mb-1 block text-sm font-medium text-foreground">
                      Email address <span aria-hidden="true">*</span>
                    </label>
                    <Input
                      id="customer-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      disabled={!!currentUser}
                      required
                      className={`h-11 ${currentUser ? 'cursor-not-allowed bg-muted text-muted-foreground' : ''}`}
                    />
                    {!currentUser && customerEmail.length > 0 && !emailValid && (
                      <p className="mt-1 text-xs text-destructive">Enter a valid email address.</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="customer-phone" className="mb-1 block text-sm font-medium text-foreground">
                      Phone number <span aria-hidden="true">*</span>
                    </label>
                    <div className="flex">
                      <span className="inline-flex h-11 items-center rounded-l-md border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                        +977
                      </span>
                      <Input
                        id="customer-phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="98XXXXXXXX"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        maxLength={10}
                        aria-describedby="phone-help"
                        className="h-11 rounded-l-none border-border bg-background text-foreground"
                        required
                      />
                    </div>
                    <p id="phone-help" className={`mt-1 text-xs ${customerPhone.length > 0 && !phoneValid ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {customerPhone.length > 0 && !phoneValid
                        ? 'Phone number must be exactly 10 digits.'
                        : 'We will text a code to this number to confirm your booking.'}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="booking-notes" className="mb-1 block text-sm font-medium text-foreground">
                      Notes <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                    </label>
                    <textarea
                      id="booking-notes"
                      placeholder="Anything the staff member should know"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-lg border-2 border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-6">
                  <p className="mb-3 font-semibold text-foreground">Booking summary</p>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Service</dt>
                      <dd className="text-right font-medium">{selectedService.name}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Staff</dt>
                      <dd className="text-right font-medium">{staffName}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Date</dt>
                      <dd className="text-right font-medium">
                        {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Time</dt>
                      <dd className="text-right font-medium">{formatTimeSlot(selectedTime)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Duration</dt>
                      <dd className="text-right font-medium">{selectedService.duration} min</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-primary/20 pt-2">
                      <dt className="text-muted-foreground">Price</dt>
                      <dd className="font-bold text-primary">{formatPrice(finalPrice)}</dd>
                    </div>
                  </dl>
                </div>

                {error && (
                  <div className="mt-6">
                    <ErrorAlert message={error} innerRef={bottomErrorRef} />
                  </div>
                )}

                {/* Sticky on phones so the total and Confirm are always in reach */}
                <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-border bg-card/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <Button
                      onClick={() => { setSelectedTime(null); scrollToFirst(timeRef) }}
                      variant="outline"
                      className="h-12 px-6"
                      disabled={submitting || !!bookingId}
                    >
                      Change time
                    </Button>
                    <Button
                      onClick={handleConfirmBooking}
                      disabled={submitting || !detailsValid}
                      className="h-12 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {submitting ? 'Booking...' : pendingVerification ? 'Enter verification code' : `Confirm booking · ${formatPrice(finalPrice)}`}
                    </Button>
                  </div>
                </div>
              </Section>
            )}
          </div>
        </Card>
      </div>

      {/* Phone verification modal */}
      {showVerificationModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowVerificationModal(false)
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="verification-title"
            aria-describedby="verification-desc"
            className="w-full max-w-md"
          >
            <Card className="relative max-h-[92vh] w-full gap-0 overflow-y-auto rounded-b-none border border-border py-0 shadow-2xl sm:rounded-b-xl">
              <div className="p-5 text-center sm:p-8">
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(false)}
                  className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 sm:mb-5 sm:h-16 sm:w-16">
                  <Phone className="h-7 w-7 text-primary sm:h-8 sm:w-8" aria-hidden="true" />
                </div>

                <h2 id="verification-title" className="mb-2 text-xl font-bold text-foreground sm:text-2xl">
                  Verify your phone number
                </h2>
                <p id="verification-desc" className="mb-1 text-sm text-muted-foreground">
                  Your appointment is <span className="font-semibold text-foreground">pending confirmation</span>. We sent a verification code to
                </p>
                <p className="mb-5 break-all text-sm font-semibold text-foreground sm:mb-6">+977 {customerPhone}</p>

                <div className="mb-5 rounded-lg border border-border bg-secondary/30 p-3 sm:mb-6 sm:p-4" aria-live="polite">
                  <div className="space-y-3">
                    <label htmlFor="verification-code" className="sr-only">Verification code</label>
                    <Input
                      id="verification-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="Enter verification code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleVerifyCode()
                      }}
                      disabled={verifyingCode}
                      className="h-11 text-center text-lg tracking-widest"
                    />
                    {codeError && <p role="alert" className="text-sm text-destructive">{codeError}</p>}
                  </div>
                </div>

                {bookingId && (
                  <p className="mb-5 break-all text-xs text-muted-foreground sm:mb-6">
                    Booking reference: <code className="font-mono text-foreground">{bookingId}</code>
                  </p>
                )}

                <Button
                  onClick={handleVerifyCode}
                  disabled={verifyingCode || sendingCode}
                  className="h-11 w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {verifyingCode ? 'Verifying...' : 'Verify and confirm'}
                </Button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={sendingCode || resendCooldown > 0}
                  className="mt-3 w-full text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : sendingCode ? 'Sending...' : 'Did not get a code? Resend'}
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}