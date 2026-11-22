'use client'

import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useMemo, useState, useRef, type RefObject } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import {
  Calendar, Clock, CheckCircle2, AlertCircle, Briefcase, User, Phone, X, Check, Info,
  ChevronLeft, ChevronRight, MapPin, Building2, CalendarPlus, type LucideIcon,
} from 'lucide-react'
import { servicesApi, bookingsApi, businessApi, staffApi, type Service, type Business, type Staff, type Branch } from '@/lib/api'
import { useAuth } from '@/context/authContext'
import { DateTime } from 'luxon'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

// NEXT_PUBLIC_ prefix is required for env vars to exist in client components
const BUSINESS_TZ = process.env.NEXT_PUBLIC_BUSINESS_TIME_ZONE || 'Asia/Kathmandu'

const SLOTS_CACHE_TTL_MS = 60_000

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const DAY_LABELS: Record<string, string> = {
  sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

// A slot is either a full ISO string or a "HH:mm" / "HH:mm:ss" time on `dateStr`
const slotToDateTime = (dateStr: string, slot: string): DateTime =>
  slot.includes('T')
    ? DateTime.fromISO(slot).setZone(BUSINESS_TZ)
    : DateTime.fromISO(`${dateStr}T${slot}`, { zone: BUSINESS_TZ })

const isSlotInFuture = (dateStr: string, slot: string): boolean => {
  if (dateStr !== todayInTz()) return true
  const dt = slotToDateTime(dateStr, slot)
  if (!dt.isValid) return true
  return dt > nowInTz()
}

const formatHM = (hours: number, minutes: number) => {
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
}

const formatTimeSlot = (slot: string): string => {
  try {
    if (slot.includes('T')) {
      const dt = DateTime.fromISO(slot).setZone(BUSINESS_TZ)
      if (!dt.isValid) return slot
      return formatHM(dt.hour, dt.minute)
    }
    const parts = slot.split(':')
    const h = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    if (Number.isNaN(h) || Number.isNaN(m)) return slot
    return formatHM(h, m)
  } catch {
    return slot
  }
}

const getDisplayTime = (slot: string): string => (slot ? formatTimeSlot(slot) : 'N/A')

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
  id, number, icon: Icon, title, done, optional,
}: {
  id?: string
  number: number
  icon: LucideIcon
  title: string
  done?: boolean
  optional?: boolean
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
          done
            ? 'bg-primary text-primary-foreground'
            : 'border-2 border-primary/40 text-primary'
        }`}
      >
        {done ? <Check className="h-4 w-4" /> : number}
      </span>
      <h2 id={id} className="flex items-center gap-2 text-base font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        {title}
        {optional && <span className="text-xs font-normal text-muted-foreground">(optional)</span>}
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

function BusinessHeader({ business, branch }: { business: Business | null; branch: Branch | null }) {
  const [expanded, setExpanded] = useState(false)

  // When a branch is chosen, show ITS address and phone instead of the business's
  const phone = branch?.phone || business?.phone
  const location = branch
    ? [branch.address, branch.city].filter(Boolean).join(', ')
    : [business?.address, business?.city].filter(Boolean).join(', ')

  const chip =
    'inline-flex max-w-full items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1.5 text-xs sm:text-sm text-muted-foreground'

  const paragraphs: string[] = (business?.description ?? '')
    .split(/\n+/)
    .map((p: string) => p.trim())
    .filter(Boolean)
  const isLong = (business?.description?.length ?? 0) > 160 || paragraphs.length > 2

  return (
    <>
      {/* Cover: fixed ratio so the whole banner is always visible */}
      <div className="relative aspect-[2.2/1] w-full overflow-hidden bg-gradient-to-br from-primary/20 to-secondary sm:aspect-[3/1]">
        {typeof business?.coverImage === 'string' && business.coverImage && (
          <img
            src={business.coverImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        )}
      </div>

      <div className="px-5 pb-6 sm:px-8">
        {/* z-10 + relative keeps the logo ABOVE the cover */}
        <div className="relative z-10 -mt-10 flex flex-col gap-3 sm:-mt-12 sm:flex-row sm:items-end sm:gap-5">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-card shadow-md ring-4 ring-card sm:h-24 sm:w-24">
            {typeof business?.logo === 'string' && business.logo ? (
              <img src={business.logo} alt={business.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10">
                <span className="text-xl font-semibold text-primary">{getInitials(business?.name || '')}</span>
              </div>
            )}
          </div>

          <div className="min-w-0 sm:pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-xl font-bold leading-tight text-foreground sm:text-2xl md:text-3xl">
                {business?.name || 'Book your appointment'}
              </h1>
              {business?.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {business?.category && (
            <span className={chip}>
              <Briefcase className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {business.category}
            </span>
          )}
          {branch && (
            <span className={`${chip} font-medium text-foreground`}>
              <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {branch.name}
            </span>
          )}
          {phone && (
            <a href={`tel:${phone}`} className={`${chip} hover:text-foreground`}>
              <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {phone}
            </a>
          )}
          {location && (
            <span className={chip}>
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{location}</span>
            </span>
          )}
        </div>

        {paragraphs.length > 0 && (
          <div className="mt-4 max-w-2xl">
            {expanded ? (
              <div className="space-y-2 break-words text-sm leading-relaxed text-muted-foreground">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            ) : (
              <p className="line-clamp-3 break-words text-sm leading-relaxed text-muted-foreground">
                {paragraphs.join(' ')}
              </p>
            )}
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="mt-1 text-xs font-medium text-primary hover:underline"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function BookingPageContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const slug = params.slug as string
  const branchQuery = searchParams.get('branch')

  /* ------------------------------- state ------------------------------- */

  const [businessId, setBusinessId] = useState('')
  const [resolving, setResolving] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [servicesLoading, setServicesLoading] = useState(false)
  const [business, setBusiness] = useState<Business | null>(null)

  // Branch state
  const [branchId, setBranchId] = useState('')
  const branches: Branch[] = business?.branches ?? []
  const multi = branches.length > 1
  const selectedBranch = branches.find((b) => b.id === branchId) ?? null
  // A single-location business has nothing to choose, so it is always "ready"
  const branchReady = !multi || !!branchId

  // Staff state
  const [staffMembers, setStaffMembers] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [staffLoading, setStaffLoading] = useState(false)

  const [date, setDate] = useState('')
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  // The key the currently shown slots belong to. While it differs from the
  // wanted key we show the small spinner instead of stale/empty slots.
  const [slotsFor, setSlotsFor] = useState('')
  // Booking submit is separate from slot loading so the page never unmounts
  const [submitting, setSubmitting] = useState(false)

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')

  const [allHours, setAllHours] = useState<any[]>([])
  const [closedDateRows, setClosedDateRows] = useState<any[]>([])
  const [hoursLoading, setHoursLoading] = useState(true)
  const [closedReason, setClosedReason] = useState<string | null>(null)

  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [error, setError] = useState('')

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

  /* ------------------------ refs: guards and caches ----------------------- */

  const slotsRequestId = useRef(0)
  const lastSlotsKey = useRef('')
  const slotsCache = useRef(new Map<string, { slots: string[]; ts: number }>())

  const staffRequestId = useRef(0)
  const staffCache = useRef(new Map<string, Staff[]>())

  // Scroll targets for the guided flow
  const serviceRef = useRef<HTMLElement>(null)
  const dateRef = useRef<HTMLElement>(null)
  const staffRef = useRef<HTMLElement>(null)
  const timeRef = useRef<HTMLElement>(null)
  const infoRef = useRef<HTMLElement>(null)
  const bottomErrorRef = useRef<HTMLDivElement>(null)

  const modalRef = useRef<HTMLDivElement>(null)

  /* ------------------------------ derived data ---------------------------- */

  // Hours and closed dates are per branch. Rows without a branchId (older
  // data) apply everywhere.
  const businessHours = useMemo(() => {
    if (!branchId) return allHours
    const own = allHours.filter((h) => h.branchId === branchId)
    return own.length ? own : allHours.filter((h) => !h.branchId)
  }, [allHours, branchId])

  const hoursByDay = useMemo(() => {
    const map = new Map<number, any>()
    businessHours.forEach((bh: any) => map.set(bh.dayOfWeek, bh))
    return map
  }, [businessHours])

  const closedDates = useMemo(() => {
    const map = new Map<string, string>()
    closedDateRows.forEach((cd: any) => {
      if (cd.branchId && branchId && cd.branchId !== branchId) return
      const dateStr = new Date(cd.date).toISOString().split('T')[0]
      map.set(dateStr, cd.reason || 'Business is closed')
    })
    return map
  }, [closedDateRows, branchId])

  // Parsed once per staff member instead of once per calendar cell
  const staffSchedule = useMemo(() => getNormalizedWorkingHours(selectedStaff), [selectedStaff])

  const slotsKey =
    selectedService && date ? `${branchId}|${selectedService.id}|${date}|${selectedStaff?.id ?? ''}` : ''
  const slotsLoading = !!slotsKey && (staffLoading || slotsFor !== slotsKey)

  const phoneValid = customerPhone.length === 10
  const emailValid = EMAIL_RE.test(customerEmail)
  const nameValid = customerName.trim().length > 0
  const detailsValid = nameValid && emailValid && phoneValid

  // A booking that exists but has not been phone-verified yet
  const pendingVerification = !!bookingId && !bookingSuccess && !showVerificationModal

  /* ------------------------- date availability logic ---------------------- */

  const getDateDisabledInfo = useCallback(
    (d: Date): { disabled: boolean; reason?: string } => {
      if (hoursLoading) return { disabled: true, reason: 'Loading business hours' }

      const dateStr = formatDateStr(d)
      const todayStr = todayInTz()

      if (dateStr < todayStr) return { disabled: true, reason: 'This date has already passed' }

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

      if (selectedStaff && staffSchedule) {
        const dayName = DAY_KEYS[d.getDay()]
        const daySchedule = staffSchedule[dayName]
        if (daySchedule && daySchedule.isWorking === false) {
          return { disabled: true, reason: `${selectedStaff.firstName} does not work on ${DAY_LABELS[dayName]}s` }
        }
      }

      return { disabled: false }
    },
    [hoursLoading, closedDates, hoursByDay, selectedStaff, staffSchedule]
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

  const getTodayClosedReason = (dateStr: string): string | null => {
    if (dateStr !== todayInTz()) return null
    const adjustedDayOfWeek = DateTime.fromISO(dateStr).weekday - 1
    const dayHours = hoursByDay.get(adjustedDayOfWeek)
    if (!dayHours) return null
    if (dayHours.isClosed) return 'Business is closed on this day'
    if (dayHours.closeTime) {
      const closing = DateTime.fromISO(`${dateStr}T${dayHours.closeTime}`, { zone: BUSINESS_TZ })
      if (closing.isValid && nowInTz() > closing) return 'Business is closed for today'
    }
    return null
  }

  const findBranch = (list: Branch[], q: string | null) => {
    if (!q) return undefined
    const v = q.toLowerCase()
    return list.find((b) => b.slug?.toLowerCase() === v || b.id === q)
  }

  // Which steps are on screen decides their numbers, so numbering never skips
  const showStaffPicker = branchReady && !!selectedService && !!date && staffMembers.length > 1 && !closedReason
  const showStaffSingle = branchReady && !!selectedService && !!date && staffMembers.length === 1 && !closedReason
  const showTime = branchReady && !!selectedService && !!date && !closedReason
  const showDetails = branchReady && !!selectedService && !!date && !!selectedTime

  let stepCounter = 0
  const stepLocation = multi ? ++stepCounter : 0
  const stepService = ++stepCounter
  const stepDate = ++stepCounter
  const stepStaff = showStaffPicker ? ++stepCounter : 0
  const stepTime = ++stepCounter
  const stepInfo = ++stepCounter

  const finalPrice = selectedService ? selectedService.offerPrice || selectedService.price : 0

  /* -------------------------------- loaders ------------------------------- */

  const loadBusinessData = async () => {
    try {
      setResolving(true)
      setServicesLoading(true)
      setError('')
      setNotFound(false)

      const businessRes = await businessApi.getPublic(slug)
      const biz = businessRes.data as Business | undefined

      if (!businessRes.success || !biz?.id) {
        setNotFound(true)
        return
      }

      setBusiness(biz)
      setBusinessId(biz.id)

      // A single branch is chosen silently; with several, a valid ?branch=
      // deep link preselects it, otherwise the picker is shown.
      const list: Branch[] = biz.branches ?? []
      if (list.length === 1) {
        setBranchId(list[0].id)
      } else if (list.length > 1 && branchQuery) {
        const match = findBranch(list, branchQuery)
        if (match) setBranchId(match.id)
      }

      // Canonical slug redirect, keeping any ?branch= parameter
      if (biz.slug && slug !== biz.slug) {
        const qs = searchParams.toString()
        router.replace(`/book/${biz.slug}${qs ? `?${qs}` : ''}`)
      }

      const servicesRes = await servicesApi.getBusinessServices(biz.id)

      if (servicesRes.data) {
        let svc: Service[] = []
        if (Array.isArray(servicesRes.data)) {
          svc = servicesRes.data
        } else if (typeof servicesRes.data === 'object' && servicesRes.data !== null) {
          const data = servicesRes.data as Record<string, any>
          svc = data.services || data.data || []
        }
        setServices(svc)
      }
    } catch (err) {
      setError('We could not load this business. Check your connection and try again.')
    } finally {
      setServicesLoading(false)
      setResolving(false)
    }
  }

  const loadStaffForService = async (serviceId: string) => {
    const reqId = ++staffRequestId.current

    // Staff only at the chosen branch (staff with no branch work anywhere)
    const applyStaff = (all: Staff[]) => {
      const list = all.filter((s) => !branchId || !s.branchId || s.branchId === branchId)
      setStaffMembers(list)
      setSelectedStaff(list.length === 1 ? list[0] : null)
    }

    const cached = staffCache.current.get(serviceId)
    if (cached) {
      applyStaff(cached)
      setStaffLoading(false)
      return
    }

    try {
      setStaffLoading(true)
      const response = await staffApi.getStaffForService(serviceId)
      if (reqId !== staffRequestId.current) return // a newer request owns the state
      if (response.data?.staff) {
        const all = response.data.staff as Staff[]
        staffCache.current.set(serviceId, all)
        applyStaff(all)
      } else {
        setStaffMembers([])
        setSelectedStaff(null)
      }
    } catch (err) {
      if (reqId !== staffRequestId.current) return
      setStaffMembers([])
      setSelectedStaff(null)
    } finally {
      if (reqId === staffRequestId.current) setStaffLoading(false)
    }
  }

  const loadAvailableSlots = async (key: string) => {
    if (!selectedService || !date || !businessId) return

    lastSlotsKey.current = key
    const reqId = ++slotsRequestId.current
    const isStale = () => reqId !== slotsRequestId.current
    const finish = (slots: string[]) => {
      if (isStale()) return
      setAvailableSlots(slots)
      setSlotsFor(key)
    }

    // Cheap local checks first: no network needed
    if (!closedDates.has(date)) {
      const todayReason = getTodayClosedReason(date)
      if (todayReason) {
        setClosedReason(todayReason)
        finish([])
        return
      }
    }

    if (selectedStaff && staffSchedule) {
      const dayName = DAY_KEYS[DateTime.fromISO(date).weekday % 7]
      const daySchedule = staffSchedule[dayName]
      if (daySchedule && daySchedule.isWorking === false) {
        setClosedReason(`${selectedStaff.firstName} does not work on ${DAY_LABELS[dayName]}s`)
        setError('')
        finish([])
        return
      }
    }

    // Recently fetched for the same service/date/staff/branch: reuse it
    const cached = slotsCache.current.get(key)
    if (cached && Date.now() - cached.ts < SLOTS_CACHE_TTL_MS) {
      setClosedReason(null)
      setError('')
      finish(cached.slots)
      return
    }

    try {
      setClosedReason(null)

      const response = await (bookingsApi.getBusinessAvailableSlots as any)(
        businessId,
        selectedService.id,
        date,
        selectedStaff?.id,
        branchId || undefined
      )
      if (isStale()) return

      if (response.success) {
        let slots: string[] = []
        if (Array.isArray(response.data)) {
          slots = response.data
        } else if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray((response.data as any).data)) {
          slots = (response.data as any).data
        }
        slotsCache.current.set(key, { slots, ts: Date.now() })
        setError('')
        finish(slots)
      } else {
        lastSlotsKey.current = ''
        setError(response.error || 'We could not load the available times. Try again.')
        finish([])
      }
    } catch (err) {
      if (isStale()) return
      lastSlotsKey.current = ''
      setError('We could not load the available times. Try again.')
      finish([])
    }
  }

  /* -------------------------------- effects ------------------------------- */

  useEffect(() => {
    if (!slug) return
    loadBusinessData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  // Hours + closed dates, fetched in parallel, cancelled if the branch changes
  useEffect(() => {
    if (!businessId || !branchReady) return
    let cancelled = false
    const q = branchId ? `?branchId=${branchId}` : ''
    setHoursLoading(true)
    ;(async () => {
      try {
        const [hours, closed] = await Promise.all([
          fetch(`${API_URL}/api/business-hours/business/${businessId}${q}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`${API_URL}/api/business-hours/${businessId}/closed-dates${q}`).then((r) => (r.ok ? r.json() : null)),
        ])
        if (cancelled) return
        if (hours) setAllHours(Array.isArray(hours) ? hours : hours.data ?? [])
        setClosedDateRows(closed && closed.success && closed.data ? closed.data : [])
      } catch {
        // keep whatever we had; calendar will show unavailable days
      } finally {
        if (!cancelled) setHoursLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [businessId, branchId, branchReady])

  // Deep link ?branch= after the business is known
  useEffect(() => {
    if (!business) return
    const list = business.branches ?? []
    if (list.length < 2) return
    const match = findBranch(list, branchQuery)
    if (match && match.id !== branchId) {
      setBranchId(match.id)
      resetSelections()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchQuery, business])

  // Drop the chosen date if the newly chosen staff member can't work it
  useEffect(() => {
    if (!date || !selectedStaff) return
    const [y, m, d] = date.split('-').map(Number)
    const { disabled, reason } = getDateDisabledInfo(new Date(y, m - 1, d))
    if (disabled) {
      setDate('')
      setSelectedTime(null)
      setClosedReason(null)
      setError(reason || 'Choose a different date for this staff member')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStaff])

  useEffect(() => {
    if (user) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
      setCustomerName(fullName)
      setCustomerEmail(user.email || '')
      setCustomerPhone((user.phone || '').replace(/\D/g, '').slice(-10))
    }
  }, [user])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((v) => (v <= 1 ? 0 : v - 1)), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Load staff when the service OR branch changes (staff are filtered per branch)
  useEffect(() => {
    if (selectedService) {
      loadStaffForService(selectedService.id)
    } else {
      staffRequestId.current++
      setStaffLoading(false)
      setStaffMembers([])
      setSelectedStaff(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedService, branchId])

  // Load slots when the combination changes. Waits for staff to settle so an
  // auto-selected single staff member doesn't cause a second request, and
  // skips keys that were already requested.
  useEffect(() => {
    if (!slotsKey || staffLoading) return
    if (lastSlotsKey.current === slotsKey) return
    loadAvailableSlots(slotsKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotsKey, staffLoading])

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

  /* ------------------------------- handlers ------------------------------- */

  // Path for this page, keeping the chosen branch in the URL so it can be shared
  const bookPath = (businessSlug: string, branch?: Branch | null) =>
    branch ? `/book/${businessSlug}?branch=${branch.slug ?? branch.id}` : `/book/${businessSlug}`

  const resetSelections = () => {
    setSelectedService(null)
    setSelectedStaff(null)
    setDate('')
    setSelectedTime(null)
    setAvailableSlots([])
    setSlotsFor('')
    lastSlotsKey.current = ''
    setClosedReason(null)
    setDateHint(null)
    setError('')
  }

  // Back to a clean form after a finished (or abandoned) booking, without a full page reload
  const startOver = () => {
    resetSelections()
    setBookingSuccess(false)
    setBookingId('')
    setVerificationCode('')
    setCodeError(null)
    setNotes('')
    slotsCache.current.clear()
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  const chooseBranch = (b: Branch) => {
    if (b.id === branchId) return
    setBranchId(b.id)
    resetSelections()
    router.replace(bookPath(business?.slug ?? slug, b), { scroll: false })
    scrollToFirst(serviceRef)
  }

  const clearBranch = () => {
    setBranchId('')
    resetSelections()
    router.replace(`/book/${business?.slug ?? slug}`, { scroll: false })
  }

  const chooseService = (service: Service) => {
    if (selectedService?.id === service.id) return
    setSelectedService(service)
    setSelectedStaff(null)
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
    setDateCalendarOpen(false)
    setDateHint(null)
    setError('')

    if (closedDates.has(dateStr)) {
      setClosedReason(closedDates.get(dateStr) || 'Business is closed')
    } else {
      setClosedReason(getTodayClosedReason(dateStr))
    }
    scrollToFirst(staffRef, timeRef)
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

    if (!selectedService || !date || !selectedTime) {
      setError('Choose a service, date, and time')
      return
    }

    if (multi && !branchId) {
      setError('Choose a location')
      return
    }

    if (!isSlotInFuture(date, selectedTime)) {
      setError('That time has passed. Choose a different time.')
      setSelectedTime(null)
      return
    }

    if (closedDates.has(date)) {
      setError(closedDates.get(date) || 'The business is closed on this date')
      return
    }

    if (!nameValid) {
      setError('Enter your full name')
      return
    }
    if (!emailValid) {
      setError('Enter a valid email address')
      return
    }
    if (!phoneValid) {
      setError('Enter a 10-digit phone number')
      return
    }

    try {
      setSubmitting(true)

      const startDateTime = slotToDateTime(date, selectedTime)
      const startTimeISO = startDateTime.toISO()
      const endTimeISO = startDateTime.plus({ minutes: selectedService.duration }).toISO()

      const basePayload: any = {
        serviceId: selectedService.id,
        businessId,
        startTime: startTimeISO,
        endTime: endTimeISO,
        notes,
      }

      if (branchId) basePayload.branchId = branchId
      if (selectedStaff?.id) basePayload.staffId = selectedStaff.id

      let response
      if (user) {
        response = await bookingsApi.createBusinessBooking(basePayload)
      } else {
        response = await bookingsApi.createBusinessPublicBooking({
          ...basePayload,
          customerName,
          customerEmail,
          customerPhone,
        })
      }

      const payload = (response as any)?.data ?? response
      const createdBooking = payload?.booking

      if (response.success !== false && createdBooking?.id) {
        const newBookingId = createdBooking.id
        setBookingId(newBookingId)

        // The slot just got taken, so cached availability is no longer valid
        slotsCache.current.clear()
        lastSlotsKey.current = ''

        const requiresVerification =
          createdBooking.isPhoneVerified === false ||
          createdBooking.status === 'UNVERIFIED'

        setError('')

        if (requiresVerification) {
          setVerificationCode('')
          setCodeError(null)
          setShowVerificationModal(true)
          await sendPhoneVerificationCode(newBookingId)
        } else {
          setBookingSuccess(true)
        }
      } else {
        setError((response as any)?.error || payload?.message || 'We could not create your booking. Try again.')
      }
    } catch (err: any) {
      setError('We could not create your booking. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Downloads an .ics file so the appointment can go straight into any calendar app
  const addToCalendar = () => {
    if (!selectedService || !date || !selectedTime) return
    const start = slotToDateTime(date, selectedTime)
    if (!start.isValid) return
    const end = start.plus({ minutes: selectedService.duration })
    const fmt = (dt: DateTime) => dt.toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'")
    const where = selectedBranch
      ? [selectedBranch.name, selectedBranch.address, selectedBranch.city].filter(Boolean).join(', ')
      : [business?.address, business?.city].filter(Boolean).join(', ')
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
      `SUMMARY:${esc(`${selectedService.name} at ${business?.name ?? ''}`.trim())}`,
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

  /* ------------------------------- rendering ------------------------------ */

  const pageBg = 'min-h-screen bg-gradient-to-br from-background via-background to-secondary/30'

  // Full-page spinner ONLY while the business itself is being resolved
  if (resolving || (!businessId && !notFound)) {
    return (
      <div className={`${pageBg} flex items-center justify-center p-4`}>
        <div className="text-center">
          <div className="mx-auto mb-4"><Spinner size={12} /></div>
          <p className="text-lg text-muted-foreground">Loading booking page...</p>
        </div>
      </div>
    )
  }

  if (!slug || notFound) {
    return (
      <div className={`${pageBg} flex items-center justify-center p-4`}>
        <div className="mx-auto max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" aria-hidden="true" />
          <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">Business not found</h1>
          <p className="mb-6 text-muted-foreground">This booking link is invalid, or the business is no longer active.</p>
          <Button onClick={() => router.push('/search')}>Browse businesses</Button>
        </div>
      </div>
    )
  }

  if (bookingSuccess) {
    const dateLabel = DateTime.fromISO(`${date}T00:00:00`, { zone: BUSINESS_TZ })
      .setLocale('en')
      .toLocaleString({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    const rows: { label: string; value: React.ReactNode }[] = [
      { label: 'Business', value: business?.name || 'N/A' },
      ...(selectedBranch && multi
        ? [{
            label: 'Location',
            value: (
              <>
                {selectedBranch.name}
                <span className="block text-xs text-muted-foreground">
                  {[selectedBranch.address, selectedBranch.city].filter(Boolean).join(', ')}
                </span>
              </>
            ),
          }]
        : []),
      { label: 'Service', value: selectedService?.name || 'N/A' },
      ...(selectedStaff ? [{ label: 'Staff', value: `${selectedStaff.firstName} ${selectedStaff.lastName}` }] : []),
      { label: 'Date', value: dateLabel },
      { label: 'Time', value: getDisplayTime(selectedTime || '') },
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

  return (
    <div className={`${pageBg} px-3 py-4 sm:p-6 md:p-8`}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 sm:mb-8">
          <Card className="gap-0 overflow-hidden border border-border py-0 shadow-lg">
            <BusinessHeader business={business} branch={selectedBranch} />
          </Card>

          <p className="mt-4 px-2 text-center text-sm text-muted-foreground">
            {multi
              ? 'Choose a location, service, date, and time to book.'
              : 'Choose a service, date, and time to book.'}
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
            {/* Location (multi-branch only) */}
            {multi && (
              <Section labelledBy="step-location">
                <StepHeader id="step-location" number={stepLocation} icon={Building2} title="Choose a location" done={!!selectedBranch} />

                {selectedBranch ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-primary bg-primary/5 p-4">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{selectedBranch.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[selectedBranch.address, selectedBranch.city].filter(Boolean).join(', ')}
                      </div>
                    </div>
                    <button type="button" onClick={clearBranch} className="shrink-0 text-xs font-medium text-primary hover:underline">
                      Change location
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {branches.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => chooseBranch(b)}
                        className="rounded-xl border-2 border-border bg-card p-4 text-left text-foreground transition-all hover:border-primary"
                      >
                        <div className="font-semibold">{b.name}</div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                          <span className="truncate">{[b.address, b.city].filter(Boolean).join(', ')}</span>
                        </div>
                        {b.phone && (
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
                            {b.phone}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* Services (after a location is known) */}
            {branchReady && (
              <Section sectionRef={serviceRef} labelledBy="step-service">
                <StepHeader id="step-service" number={stepService} icon={Briefcase} title="Select a service" done={!!selectedService} />

                {servicesLoading ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : services.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 p-6 text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
                    This business has no services to book yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {services.map((service) => {
                      const selected = selectedService?.id === service.id
                      return (
                        <button
                          key={service.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => chooseService(service)}
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
                            <div className="font-semibold leading-snug">{service.name}</div>
                            {service.description && (
                              <div className="mt-1 line-clamp-2 text-sm opacity-75">{service.description}</div>
                            )}
                          </div>

                          <div className="flex items-end justify-between gap-3 text-xs">
                            <span className="inline-flex items-center gap-1 opacity-75">
                              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                              {service.duration} min
                            </span>
                            <span className="whitespace-nowrap text-right text-sm font-semibold">
                              {service.offerPrice ? (
                                <>
                                  <span className="mr-1.5 text-xs font-normal line-through opacity-60">
                                    {formatPrice(service.price)}
                                  </span>
                                  {formatPrice(service.offerPrice)}
                                </>
                              ) : (
                                formatPrice(service.price)
                              )}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </Section>
            )}

            {/* Date */}
            {branchReady && selectedService && (
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

                {closedReason && (
                  <div role="status" className="mt-4 flex items-center justify-center rounded-md border border-amber-200 bg-amber-50 px-4 py-5 text-center text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    <AlertCircle className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="text-sm">{closedReason || 'Business is closed'}</span>
                  </div>
                )}
              </Section>
            )}

            {/* Staff (optional, only when there is a choice) */}
            {showStaffPicker && (
              <Section sectionRef={staffRef} labelledBy="step-staff">
                <StepHeader id="step-staff" number={stepStaff} icon={User} title="Select staff" optional done={!!selectedStaff} />

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {staffMembers.map((staff) => {
                      const selected = selectedStaff?.id === staff.id
                      return (
                        <button
                          key={staff.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            if (selected) return
                            setSelectedStaff(staff)
                            setSelectedTime(null)
                            scrollToFirst(timeRef)
                          }}
                          className={`rounded-xl border-2 p-3 text-center transition-all sm:p-4 ${
                            selected
                              ? 'border-primary bg-primary text-primary-foreground shadow-md'
                              : 'border-border bg-card text-foreground hover:border-primary'
                          }`}
                        >
                          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-secondary/50">
                            {staff.avatar ? (
                              <img src={staff.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                            ) : (
                              <User className="h-6 w-6 text-foreground" aria-hidden="true" />
                            )}
                          </div>
                          <div className="break-words text-sm font-semibold">{staff.firstName} {staff.lastName}</div>
                          <div className="mt-1 text-xs opacity-75">{staff.role}</div>
                        </button>
                      )
                    })}
                  </div>

                  {selectedStaff && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStaff(null)
                        setSelectedTime(null)
                      }}
                      className="w-full rounded-lg border-2 border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-primary hover:text-foreground"
                    >
                      Clear selection and assign any available staff
                    </button>
                  )}
                </div>
              </Section>
            )}

            {showStaffSingle && (
              <Section labelledBy="step-staff-single">
                <h2 id="step-staff-single" className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <User className="h-4 w-4 text-primary" aria-hidden="true" />
                  Your staff member
                </h2>
                <div className="flex items-center gap-3 rounded-xl border-2 border-primary bg-primary/5 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary/50">
                    {staffMembers[0].avatar ? (
                      <img src={staffMembers[0].avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <User className="h-5 w-5" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{staffMembers[0].firstName} {staffMembers[0].lastName}</div>
                    <div className="text-xs text-muted-foreground">{staffMembers[0].role}, the only staff for this service</div>
                  </div>
                </div>
              </Section>
            )}

            {/* Time: only this section shows a spinner while slots load */}
            {showTime && (
              <Section sectionRef={timeRef} labelledBy="step-time">
                <StepHeader id="step-time" number={stepTime} icon={Clock} title="Select a time" done={!!selectedTime} />

                {slotsLoading ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : availableSlots.length === 0 ? (
                  <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 p-4 text-sm sm:p-6">
                    <AlertCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
                    <span>No times are available on this date{selectedStaff ? ` with ${selectedStaff.firstName}` : ''}. Try another date.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {availableSlots.map((slot, idx) => {
                      const isPast = !isSlotInFuture(date, slot)
                      const selected = selectedTime === slot
                      return (
                        <button
                          key={idx}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => !isPast && chooseTime(slot)}
                          disabled={isPast}
                          title={isPast ? 'This time has already passed' : undefined}
                          className={`rounded-lg border-2 px-1 py-2.5 text-xs font-medium transition-all sm:p-3 sm:text-sm ${
                            isPast
                              ? 'cursor-not-allowed border-input bg-muted text-muted-foreground opacity-50'
                              : selected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-card text-foreground hover:border-primary'
                          }`}
                        >
                          {formatTimeSlot(slot)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </Section>
            )}

            {/* Customer info */}
            {showDetails && (
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
                      disabled={!!user}
                      required
                      className={`h-11 ${user ? 'cursor-not-allowed bg-muted text-muted-foreground' : ''}`}
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
                      disabled={!!user}
                      required
                      className={`h-11 ${user ? 'cursor-not-allowed bg-muted text-muted-foreground' : ''}`}
                    />
                    {!user && customerEmail.length > 0 && !emailValid && (
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
                      placeholder="Anything the business should know"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-lg border-2 border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Summary */}
                {selectedService && selectedTime && (
                  <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-6">
                    <p className="mb-3 font-semibold text-foreground">Booking summary</p>
                    <dl className="space-y-2 text-sm">
                      {multi && selectedBranch && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">Location</dt>
                          <dd className="text-right font-medium">{selectedBranch.name}</dd>
                        </div>
                      )}
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Service</dt>
                        <dd className="text-right font-medium">{selectedService.name}</dd>
                      </div>
                      {selectedStaff && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted-foreground">Staff</dt>
                          <dd className="text-right font-medium">{selectedStaff.firstName} {selectedStaff.lastName}</dd>
                        </div>
                      )}
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
                )}

                {error && selectedTime && (
                  <div className="mt-6">
                    <ErrorAlert message={error} innerRef={bottomErrorRef} />
                  </div>
                )}

                {/* Sticky on phones so the total and Confirm are always in reach */}
                <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-border bg-card/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <Button onClick={() => { setSelectedTime(null); scrollToFirst(timeRef) }} variant="outline" className="h-12 px-6" disabled={submitting}>
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

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size={12} />
        </div>
      }
    >
      <BookingPageContent />
    </Suspense>
  )
}