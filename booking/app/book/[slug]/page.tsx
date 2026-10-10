'use client'

import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState, useRef, JSX } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import {
  Calendar, Clock, CheckCircle2, AlertCircle, Briefcase, User, Mail, X,
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Phone, Building2,
} from 'lucide-react'
import { servicesApi, bookingsApi, businessApi, staffApi, type Service, type Business, type Staff, type Branch } from '@/lib/api'
import { useAuth } from '@/context/authContext'
import { DateTime } from 'luxon'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

const VERIFICATION_COUNTDOWN = 10

function BusinessHeaderContent({ business, branch }: { business: Business | null; branch: Branch | null }) {
  // When a branch is chosen, show ITS address and phone instead of the business's
  const phone = branch?.phone || business?.phone
  const location = branch
    ? [branch.address, branch.city].filter(Boolean).join(', ')
    : [business?.address, business?.city].filter(Boolean).join(', ')

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl shadow-sm ring-1 ring-border">
        {typeof business?.logo === 'string' && business.logo ? (
          <img src={business.logo} alt={business.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10">
            <span className="text-lg font-semibold text-primary">{getInitials(business?.name || '')}</span>
          </div>
        )}
      </div>

      <div className="flex-1 pt-2 sm:pt-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {business?.name || 'Book Your Appointment'}
          </h1>
          {business?.isVerified && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
          {business?.category && (
            <span className="inline-flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              {business.category}
            </span>
          )}
          {branch && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Building2 className="w-3.5 h-3.5" />
              {branch.name}
            </span>
          )}
          {phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              {phone}
            </span>
          )}
          {location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {location}
            </span>
          )}
        </div>

        {business?.description && (
          <p className="mt-3 text-sm text-muted-foreground max-w-2xl">{business.description}</p>
        )}
      </div>
    </div>
  )
}

function BookingPageContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const slug = params.slug as string
  const branchQuery = searchParams.get('branch')
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
  // Step numbering shifts by one when the location step is shown
  const n = (i: number) => i + (multi ? 1 : 0)

  // Staff state
  const [staffMembers, setStaffMembers] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [staffLoading, setStaffLoading] = useState(false)

  const [date, setDate] = useState('')
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [allHours, setAllHours] = useState<any[]>([])
  const [closedDateRows, setClosedDateRows] = useState<any[]>([])
  const [closedReason, setClosedReason] = useState<string | null>(null)

  // Hours and closed dates are per branch. Rows without a branchId (older
  // data) apply everywhere.
  const businessHours = useMemo(() => {
    if (!branchId) return allHours
    const own = allHours.filter((h) => h.branchId === branchId)
    return own.length ? own : allHours.filter((h) => !h.branchId)
  }, [allHours, branchId])

  const closedDates = useMemo(() => {
    const map = new Map<string, string>()
    closedDateRows.forEach((cd: any) => {
      if (cd.branchId && branchId && cd.branchId !== branchId) return
      const dateStr = new Date(cd.date).toISOString().split('T')[0]
      map.set(dateStr, cd.reason || 'Business is closed')
    })
    return map
  }, [closedDateRows, branchId])

  // Verification modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [countdown, setCountdown] = useState(VERIFICATION_COUNTDOWN)

  useEffect(() => {
    if (!slug) return
    loadBusinessData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const isSlotInFuture = (dateStr: string, timeString: string): boolean => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    if (dateStr !== todayStr) return true

    let hours: number, minutes: number
    if (timeString.includes('T')) {
      const d = new Date(timeString)
      hours = d.getHours()
      minutes = d.getMinutes()
    } else {
      const parts = timeString.split(':')
      hours = parseInt(parts[0], 10)
      minutes = parseInt(parts[1], 10)
    }

    const slotDateTime = new Date(dateStr)
    slotDateTime.setHours(hours, minutes, 0, 0)
    return slotDateTime > now
  }

  useEffect(() => {
    if (!date || !selectedStaff) return
    const [y, m, d] = date.split('-').map(Number)
    const { disabled, reason } = getDateDisabledInfo(new Date(y, m - 1, d))
    if (disabled) {
      setDate('')
      setSelectedTime(null)
      setClosedReason(null)
      setError(reason || 'Please choose a different date for this staff member')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStaff])

  useEffect(() => {
    if (user) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
      setCustomerName(fullName)
      setCustomerEmail(user.email || '')
      setCustomerPhone(user.phone || '')
    }
  }, [user])

  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [error, setError] = useState('')

  const [verificationCode, setVerificationCode] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

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
      setStaffMembers([])
      setSelectedStaff(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedService, branchId])

  // Load slots whenever service, date, staff or branch changes
  useEffect(() => {
    if (date && selectedService) {
      loadAvailableSlots()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, selectedService, selectedStaff, branchId])

  useEffect(() => {
    if (!showVerificationModal) return

    setCountdown(VERIFICATION_COUNTDOWN)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [showVerificationModal])

  useEffect(() => {
    if (showVerificationModal) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = original
      }
    }
  }, [showVerificationModal])

  // Path for this page, keeping the chosen branch in the URL so it can be shared
  const bookPath = (businessSlug: string, branch?: Branch | null) =>
    branch ? `/book/${businessSlug}?branch=${branch.slug ?? branch.id}` : `/book/${businessSlug}`

  const resetSelections = () => {
    setSelectedService(null)
    setSelectedStaff(null)
    setDate('')
    setSelectedTime(null)
    setAvailableSlots([])
    setClosedReason(null)
    setError('')
  }

  const chooseBranch = (b: Branch) => {
    if (b.id === branchId) return
    setBranchId(b.id)
    resetSelections()
    router.replace(bookPath(business?.slug ?? slug, b), { scroll: false })
  }

  const clearBranch = () => {
    setBranchId('')
    resetSelections()
    router.replace(`/book/${business?.slug ?? slug}`, { scroll: false })
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
        setCodeError(data.error || 'Failed to send verification code')
        if (typeof data.retryAfterSeconds === 'number') setResendCooldown(data.retryAfterSeconds)
        return false
      }
      setResendCooldown(30)
      return true
    } catch {
      setCodeError('Failed to send verification code. Please try again.')
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
      setCodeError('Please enter the verification code')
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
            ? `${data.error || 'Invalid code'} (${data.attemptsRemaining} attempts remaining)`
            : data.error || 'Invalid verification code'
        )
        return
      }
      setShowVerificationModal(false)
      setBookingSuccess(true)
    } catch {
      setCodeError('Failed to verify code. Please try again.')
    } finally {
      setVerifyingCode(false)
    }
  }

  useEffect(() => {
  if (!businessId || !branchReady) return
  const q = branchId ? `?branchId=${branchId}` : ''
  ;(async () => {
    const [hoursRes, closedRes] = await Promise.all([
      fetch(`${API_URL}/api/business-hours/business/${businessId}${q}`),
      fetch(`${API_URL}/api/business-hours/${businessId}/closed-dates${q}`),
    ])
    if (hoursRes.ok) setAllHours(await hoursRes.json())
    if (closedRes.ok) {
      const d = await closedRes.json()
      setClosedDateRows(d.success && d.data ? d.data : [])
    }
  })()
}, [businessId, branchId, branchReady])

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

      // Pick the branch: a single branch is chosen silently; with several, a
      // valid ?branch= deep link preselects it, otherwise the picker is shown.
      const list: Branch[] = biz.branches ?? []
      if (list.length === 1) {
        setBranchId(list[0].id)
      } else if (list.length > 1 && branchQuery) {
        const match = list.find((b) => b.slug === branchQuery || b.id === branchQuery)
        if (match) setBranchId(match.id)
      }

      // Canonical slug redirect, keeping any ?branch= parameter
      if (biz.slug && slug !== biz.slug) {
        const qs = searchParams.toString()
        router.replace(`/book/${biz.slug}${qs ? `?${qs}` : ''}`)
      }

      const [servicesRes] = await Promise.all([
        servicesApi.getBusinessServices(biz.id),
      ])

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
      setError('Failed to load business information. Please try again.')
    } finally {
      setServicesLoading(false)
      setResolving(false)
    }
  }

  const loadStaffForService = async (serviceId: string) => {
    try {
      setStaffLoading(true)
      const response = await staffApi.getStaffForService(serviceId)
      if (response.data?.staff) {
        // Only staff who work at the chosen branch (staff with no branch work anywhere)
        const list = (response.data.staff as Staff[]).filter(
          (s) => !branchId || !s.branchId || s.branchId === branchId
        )
        setStaffMembers(list)
        setSelectedStaff(list.length === 1 ? list[0] : null)
      } else {
        setStaffMembers([])
        setSelectedStaff(null)
      }
    } catch (err) {
      setStaffMembers([])
      setSelectedStaff(null)
    } finally {
      setStaffLoading(false)
    }
  }

  const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const DAY_LABELS: Record<string, string> = {
    sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
    thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday',
  }

  const [dateCalendarOpen, setDateCalendarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const dateCalendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dateCalendarOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dateCalendarRef.current && !dateCalendarRef.current.contains(e.target as Node)) {
        setDateCalendarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dateCalendarOpen])

  const formatDateStr = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  interface DaySchedule {
    start: string
    end: string
    isWorking: boolean
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

  const getDateDisabledInfo = (d: Date): { disabled: boolean; reason?: string } => {
    const dateStr = formatDateStr(d)

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    if (d < startOfToday) {
      return { disabled: true, reason: 'Past date' }
    }

    if (closedDates.has(dateStr)) {
      return { disabled: true, reason: closedDates.get(dateStr) || 'Business is closed' }
    }

    const adjustedDayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1
    const dayHours = businessHours.find((bh: any) => bh.dayOfWeek === adjustedDayOfWeek)
    if (!dayHours || dayHours.isClosed) {
      return { disabled: true, reason: 'Business is closed on this day' }
    }

    const startOfCellDay = new Date(d)
    startOfCellDay.setHours(0, 0, 0, 0)
    const isCellToday = startOfCellDay.getTime() === startOfToday.getTime()
    if (isCellToday && dayHours.closeTime) {
      const [closeHour, closeMin] = dayHours.closeTime.split(':').map(Number)
      const closingDateTime = new Date(d)
      closingDateTime.setHours(closeHour, closeMin, 0, 0)
      if (new Date() > closingDateTime) {
        return { disabled: true, reason: 'Business is closed for today' }
      }
    }

    if (selectedStaff) {
      const dayName = DAY_KEYS[d.getDay()]
      const staffWorkingHours = getNormalizedWorkingHours(selectedStaff)
      const daySchedule = staffWorkingHours?.[dayName]
      if (daySchedule && daySchedule.isWorking === false) {
        return { disabled: true, reason: `${selectedStaff.firstName} does not work on ${DAY_LABELS[dayName]}s` }
      }
    }

    return { disabled: false }
  }

  const selectDate = (dateStr: string) => {
    setDate(dateStr)
    setSelectedTime(null)
    setDateCalendarOpen(false)

    if (closedDates.has(dateStr)) {
      setClosedReason(closedDates.get(dateStr) || 'Business is closed')
    } else {
      setClosedReason(getTodayClosedReason(dateStr))
    }
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

  useEffect(() => {
    if (date) {
      const [y, m] = date.split('-').map(Number)
      setCalendarMonth(new Date(y, m - 1, 1))
    }
  }, [date])

  const loadAvailableSlots = async () => {
    if (!selectedService || !date || !businessId) return

    if (!closedDates.has(date)) {
      const todayReason = getTodayClosedReason(date)
      if (todayReason) {
        setAvailableSlots([])
        setClosedReason(todayReason)
        return
      }
    }

    if (selectedStaff) {
      const dayName = DAY_KEYS[new Date(date).getDay()]
      const daySchedule = (selectedStaff as any)?.workingHours?.[dayName]
      if (daySchedule && daySchedule.isWorking === false) {
        setAvailableSlots([])
        setClosedReason(`${selectedStaff.firstName} does not work on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}s`)
        setError('')
        return
      }
    }

    try {
      setLoading(true)
      setClosedReason(null)

      const response = await (bookingsApi.getBusinessAvailableSlots as any)(
        businessId,
        selectedService.id,
        date,
        selectedStaff?.id,
        branchId || undefined
      )

      if (response.success) {
        let slots: string[] = []
        if (Array.isArray(response.data)) {
          slots = response.data
        } else if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray((response.data as any).data)) {
          slots = (response.data as any).data
        }

        if (slots.length > 0) {
          setAvailableSlots(slots as any)
          setError('')
        } else {
          setAvailableSlots([])
          setError('No available slots for the selected date')
        }
      } else {
        setAvailableSlots([])
        setError(response.error || 'Unable to load available slots')
      }
    } catch (err) {
      setAvailableSlots([])
      setError('Failed to load available slots')
    } finally {
      setLoading(false)
    }
  }

  const formatTimeSlot = (timeString: string): string => {
    try {
      let hours: number, minutes: number

      if (timeString.includes('T') || (timeString.includes(':') && timeString.length > 5)) {
        const d = new Date(timeString)
        hours = d.getHours()
        minutes = d.getMinutes()
      } else {
        const parts = timeString.split(':')
        hours = parseInt(parts[0], 10)
        minutes = parseInt(parts[1], 10)
      }

      const period = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
    } catch {
      return timeString
    }
  }

  const getTodayClosedReason = (dateStr: string): string | null => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    if (dateStr !== todayStr) return null

    const dayOfWeek = now.getDay()
    const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const dayHours = businessHours.find((bh: any) => bh.dayOfWeek === adjustedDayOfWeek)

    if (!dayHours || dayHours.isClosed) {
      return dayHours ? 'Business is closed on this day' : null
    }

    const [closingHour, closingMin] = dayHours.closeTime.split(':').map(Number)
    const closingDateTime = new Date(dateStr)
    closingDateTime.setHours(closingHour, closingMin, 0, 0)

    if (now > closingDateTime) {
      return 'Business is closed for today'
    }

    return null
  }

  const getDisplayTime = (timeString: string): string => {
    if (!timeString) return 'N/A'
    try {
      const parts = timeString.split(':')
      if (parts.length === 2) {
        const hours = parseInt(parts[0], 10)
        const minutes = parseInt(parts[1], 10)
        const period = hours >= 12 ? 'PM' : 'AM'
        const displayHours = hours % 12 || 12
        return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
      }
      return timeString
    } catch {
      return timeString
    }
  }

  const handleConfirmBooking = async () => {
    if (!selectedService || !date || !selectedTime) {
      setError('Please select service, date, and time')
      return
    }

    if (multi && !branchId) {
      setError('Please choose a location')
      return
    }

    if (!isSlotInFuture(date, selectedTime)) {
      setError('This time slot has passed. Please select a different time.')
      setSelectedTime(null)
      return
    }

    if (closedDates.has(date)) {
      setError(closedDates.get(date) || 'The business is closed on this date')
      return
    }

    if (!user) {
      if (!customerName || !customerEmail || !customerPhone) {
        setError('Please fill in all required fields')
        return
      }
    }

    try {
      setLoading(true)

      const BUSINESS_TZ = process.env.BUSINESS_TIME_ZONE || 'Asia/Kathmandu'
      const startDateTime = DateTime.fromISO(`${date}T${selectedTime}`, { zone: BUSINESS_TZ })
      const startTimeISO = startDateTime.toISO()
      const endDateTime = startDateTime.plus({ minutes: selectedService.duration })
      const endTimeISO = endDateTime.toISO()

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

        const requiresVerification =
          createdBooking.isPhoneVerified === false ||
          createdBooking.status === 'UNVERIFIED'

        setError('')

        if (requiresVerification) {
          setVerificationCode('')
          setCodeError(null)
          await sendPhoneVerificationCode(newBookingId)
          setShowVerificationModal(true)
        } else {
          setBookingSuccess(true)
        }
      } else {
        setError((response as any)?.error || payload?.message || 'Failed to create booking')
      }
    } catch (err: any) {
      setError('Failed to book appointment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading || resolving || (!businessId && !notFound)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!slug || notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
        <div className="mx-auto max-w-2xl text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Business not found</h1>
          <p className="text-muted-foreground mb-6">This booking link is invalid or the business is inactive</p>
          <Button onClick={() => router.push('/search')}>Browse Businesses</Button>
        </div>
      </div>
    )
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8 flex items-center justify-center">
        <div className="mx-auto w-full max-w-2xl">
          <Card className="border border-border shadow-2xl">
            <div className="p-8 md:p-12 text-center">
              <div className="mb-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-primary" />
                </div>
                <h1 className="text-4xl font-bold text-foreground mb-3">Booking Confirmed!</h1>
                <p className="text-lg text-muted-foreground">Your appointment has been successfully booked</p>
              </div>

              <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-8 mb-10 text-left">
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="text-sm font-semibold text-foreground min-w-fit">Business:</div>
                    <div className="text-sm text-foreground">{business?.name || 'N/A'}</div>
                  </div>
                  {selectedBranch && multi && (
                    <div className="flex items-start gap-3">
                      <div className="text-sm font-semibold text-foreground min-w-fit">Location:</div>
                      <div className="text-sm text-foreground">
                        {selectedBranch.name}
                        <span className="block text-xs text-muted-foreground">
                          {[selectedBranch.address, selectedBranch.city].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="text-sm font-semibold text-foreground min-w-fit">Service:</div>
                    <div className="text-sm text-foreground">{selectedService?.name || 'N/A'}</div>
                  </div>
                  {selectedStaff && (
                    <div className="flex items-start gap-3">
                      <div className="text-sm font-semibold text-foreground min-w-fit">Staff:</div>
                      <div className="text-sm text-foreground">{selectedStaff.firstName} {selectedStaff.lastName}</div>
                    </div>
                  )}
                  <div className="h-px bg-border my-1"></div>
                  <div className="flex items-start gap-3">
                    <div className="text-sm font-semibold text-foreground min-w-fit">Date:</div>
                    <div className="text-sm text-foreground">
                      {DateTime.fromISO(date + 'T00:00:00', { zone: 'Asia/Kathmandu' }).setLocale('en').toLocaleString({
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-sm font-semibold text-foreground min-w-fit">Time:</div>
                    <div className="text-sm text-foreground font-medium">{getDisplayTime(selectedTime || '')}</div>
                  </div>
                  <div className="h-px bg-border my-1"></div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <Button
                  onClick={() => (window.location.href = bookPath(business?.slug ?? slug, selectedBranch))}
                  className="w-full h-12 bg-primary hover:bg-primary/90 font-semibold"
                >
                  Book Another Service
                </Button>
              </div>

              <div className="pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10">
          <Card className="overflow-hidden border border-border shadow-lg">
            {business?.coverImage ? (
              <>
                <div
                  className="h-32 md:h-40 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${business.coverImage})` }}
                />
                <div className="px-6 md:px-8 pb-6 -mt-12">
                  <BusinessHeaderContent business={business} branch={selectedBranch} />
                </div>
              </>
            ) : (
              <div className="px-6 md:px-8 py-6">
                <BusinessHeaderContent business={business} branch={selectedBranch} />
              </div>
            )}
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {multi
              ? 'Select a location, service, date, staff (optional) and time'
              : 'Select a service, date, staff (optional) and time'}
          </p>
        </div>

        {error && (
          <Card className="border border-destructive/50 bg-destructive/5 mb-6">
            <div className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-foreground">{error}</p>
            </div>
          </Card>
        )}

        <Card className="border border-border shadow-lg">
          <div className="p-8 md:p-10">
            {/* Step 1 (multi-branch only): Location */}
            {multi && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  1. Choose Location
                </label>

                {selectedBranch ? (
                  <div className="p-4 rounded-lg border-2 border-primary bg-primary/5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm">{selectedBranch.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[selectedBranch.address, selectedBranch.city].filter(Boolean).join(', ')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearBranch}
                      className="text-xs font-medium text-primary hover:underline flex-shrink-0"
                    >
                      Change location
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {branches.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => chooseBranch(b)}
                        className="p-4 rounded-lg border-2 text-left transition-all bg-card text-foreground border-border hover:border-primary"
                      >
                        <div className="font-semibold">{b.name}</div>
                        <div className="mt-1 flex items-center gap-1 text-xs opacity-75">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{[b.address, b.city].filter(Boolean).join(', ')}</span>
                        </div>
                        {b.phone && (
                          <div className="mt-0.5 flex items-center gap-1 text-xs opacity-75">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            {b.phone}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Services (after a location is known) */}
            {branchReady && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  {n(1)}. Select Service
                </label>

                {servicesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                  </div>
                ) : services.length === 0 ? (
                  <div className="bg-secondary/40 border border-border rounded-lg p-6 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                    No services available
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => {
                          setSelectedService(service)
                          setSelectedStaff(null)
                          setDate('')
                          setSelectedTime(null)
                        }}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedService?.id === service.id
                            ? 'bg-primary text-primary-foreground border-primary shadow-md'
                            : 'bg-card text-foreground border-border hover:border-primary'
                        }`}
                      >
                        <div className="font-semibold">{service.name}</div>
                        {service.description && <div className="text-sm opacity-75 mt-1">{service.description}</div>}
                        <div className="flex justify-between items-center mt-2 text-xs opacity-75">
                          <span>{service.duration} mins</span>
                          <span className="font-semibold">
                            {service.offerPrice ? (
                              <><span className="line-through">Rs.{service.price.toFixed(2)}</span> Rs.{service.offerPrice.toFixed(2)}</>
                            ) : (
                              `Rs.${service.price.toFixed(2)}`
                            )}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Select Date */}
            {branchReady && selectedService && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {n(2)}. Select Date
                </label>
                <div className="relative" ref={dateCalendarRef}>
                  <button
                    type="button"
                    onClick={() => setDateCalendarOpen((open) => !open)}
                    className="w-full h-12 flex items-center justify-between px-3 border border-border rounded-md bg-background text-left text-sm"
                  >
                    <span className={date ? '' : 'text-muted-foreground'}>
                      {date
                        ? new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                          })
                        : 'Select a date'}
                    </span>
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  </button>

                  {dateCalendarOpen && (
                    <div className="absolute z-20 mt-2 w-72 rounded-lg border border-border bg-card shadow-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <button type="button" onClick={goToPrevMonth} className="p-1 rounded hover:bg-muted">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-semibold">
                          {calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </span>
                        <button type="button" onClick={goToNextMonth} className="p-1 rounded hover:bg-muted">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 mb-1">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                          <div key={d} className="text-center text-xs font-medium text-muted-foreground">{d}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {(() => {
                          const year = calendarMonth.getFullYear()
                          const month = calendarMonth.getMonth()
                          const firstDayOfMonth = new Date(year, month, 1)
                          const startOffset = firstDayOfMonth.getDay()
                          const daysInMonth = new Date(year, month + 1, 0).getDate()
                          const cells: JSX.Element[] = []

                          for (let i = 0; i < startOffset; i++) {
                            cells.push(<div key={`blank-${i}`} />)
                          }

                          for (let day = 1; day <= daysInMonth; day++) {
                            const cellDate = new Date(year, month, day)
                            const dateStr = formatDateStr(cellDate)
                            const { disabled, reason } = getDateDisabledInfo(cellDate)
                            const isSelected = date === dateStr

                            cells.push(
                              <button
                                key={dateStr}
                                type="button"
                                disabled={disabled}
                                title={disabled ? reason : undefined}
                                onClick={() => !disabled && selectDate(dateStr)}
                                className={`h-8 w-8 mx-auto flex items-center justify-center rounded-md text-sm transition-colors ${
                                  disabled
                                    ? 'text-muted-foreground/40 cursor-not-allowed line-through'
                                    : isSelected
                                    ? 'bg-primary text-primary-foreground font-semibold'
                                    : 'hover:bg-primary/10 text-foreground'
                                }`}
                              >
                                {day}
                              </button>
                            )
                          }

                          return cells
                        })()}
                      </div>

                      <p className="mt-3 text-xs text-muted-foreground border-t pt-2">
                        Greyed-out days are unavailable: closed dates, business hours, or the selected staff member&apos;s day off.
                      </p>
                    </div>
                  )}
                </div>

                {closedReason && (
                  <div className="flex items-center justify-center py-6 border border-input rounded-md bg-amber-50 border-amber-200 mt-4">
                    <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
                    <span className="text-sm text-amber-600">{closedReason || 'Business is closed'}</span>
                  </div>
                )}
              </div>
            )}

            {/* Staff Selection (optional) */}
            {branchReady && selectedService && date && staffMembers.length > 1 && !closedReason && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  {n(3)}. Select Staff <span className="text-xs opacity-60">(Optional)</span>
                </label>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {staffMembers.map((staff) => (
                      <button
                        key={staff.id}
                        onClick={() => {
                          setSelectedStaff(staff)
                          setSelectedTime(null)
                        }}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          selectedStaff?.id === staff.id
                            ? 'bg-primary text-primary-foreground border-primary shadow-md'
                            : 'bg-card text-foreground border-border hover:border-primary'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-2">
                          {staff.avatar ? (
                            <img src={staff.avatar || '/placeholder.svg'} alt={staff.firstName} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <User className="w-6 h-6" />
                          )}
                        </div>
                        <div className="font-semibold text-sm">{staff.firstName} {staff.lastName}</div>
                        <div className="text-xs opacity-75 mt-1">{staff.role}</div>
                      </button>
                    ))}
                  </div>

                  {selectedStaff && (
                    <button
                      onClick={() => {
                        setSelectedStaff(null)
                        setSelectedTime(null)
                      }}
                      className="w-full py-2 px-4 rounded-lg border-2 border-border hover:border-primary text-sm font-medium transition-all text-muted-foreground hover:text-foreground"
                    >
                      Clear selection (system will auto-assign any available staff)
                    </button>
                  )}
                </div>
              </div>
            )}

            {branchReady && selectedService && date && staffMembers.length === 1 && !closedReason && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Staff
                </label>
                <div className="p-4 rounded-lg border-2 border-primary bg-primary/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center flex-shrink-0">
                    {staffMembers[0].avatar ? (
                      <img src={staffMembers[0].avatar} alt={staffMembers[0].firstName} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{staffMembers[0].firstName} {staffMembers[0].lastName}</div>
                    <div className="text-xs text-muted-foreground">{staffMembers[0].role} · only staff for this service</div>
                  </div>
                </div>
              </div>
            )}

            {/* Time */}
            {branchReady && selectedService && date && !closedReason && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  {n(4)}. Select Time
                </label>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="bg-secondary/40 border border-border rounded-lg p-6 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                    No available slots for this date{selectedStaff ? ` with ${selectedStaff.firstName}` : ''}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {availableSlots.map((slot, idx) => {
                      const isPast = !isSlotInFuture(date, slot)
                      return (
                        <button
                          key={idx}
                          onClick={() => !isPast && setSelectedTime(slot)}
                          disabled={isPast}
                          title={isPast ? 'This time has already passed' : undefined}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            isPast
                              ? 'border-input bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                              : selectedTime === slot
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card text-foreground border-border hover:border-primary'
                          }`}
                        >
                          {formatTimeSlot(slot)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Customer Info */}
            {branchReady && selectedService && date && selectedTime && (
              <div className="mb-8 p-6 bg-secondary/20 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">{n(5)}. Your Information</h3>
                  {user && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Verified</span>}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                      Full Name *
                      {user && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">(verified)</span>}
                    </label>
                    <Input
                      type="text"
                      placeholder="Full Name *"
                      value={customerName}
                      onChange={user ? undefined : (e) => setCustomerName(e.target.value)}
                      disabled={!!user}
                      className={`h-11 ${user ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                      Email Address *
                      {user && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">(verified)</span>}
                    </label>
                    <Input
                      type="email"
                      placeholder="Email Address *"
                      value={customerEmail}
                      onChange={user ? undefined : (e) => setCustomerEmail(e.target.value)}
                      disabled={!!user}
                      className={`h-11 ${user ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1">Phone Number *</label>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      placeholder="98XXXXXXXX"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      maxLength={10}
                      className="bg-background border-border text-foreground"
                      required
                    />
                    {customerPhone.length > 0 && customerPhone.length !== 10 && (
                      <p className="mt-1 text-xs text-destructive">Phone number must be exactly 10 digits.</p>
                    )}
                  </div>
                  <textarea
                    placeholder="Notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 border-2 border-border rounded-lg text-sm focus:border-primary focus:outline-none bg-background"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Summary */}
            {branchReady && selectedService && date && selectedTime && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-3">Booking Summary</p>
                    <div className="space-y-2 text-sm">
                      {multi && selectedBranch && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Location:</span>
                          <span className="font-medium">{selectedBranch.name}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service:</span>
                        <span className="font-medium">{selectedService.name}</span>
                      </div>
                      {selectedStaff && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Staff:</span>
                          <span className="font-medium">{selectedStaff.firstName} {selectedStaff.lastName}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-medium">{formatTimeSlot(selectedTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">{selectedService.duration} min</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-primary/20">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-bold text-primary">Rs.{(selectedService.offerPrice || selectedService.price).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {branchReady && selectedService && date && selectedTime && (
              <div className="flex gap-3">
                <Button
                  onClick={handleConfirmBooking}
                  disabled={loading || !customerName || !customerEmail || !customerPhone}
                  className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? 'Confirming...' : 'Confirm Booking'}
                </Button>
                <Button onClick={() => setSelectedTime(null)} variant="outline" className="px-6 h-12">
                  Clear
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Phone verification modal */}
      {showVerificationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="verification-title"
          aria-describedby="verification-desc"
        >
          <Card className="relative w-full max-w-md border border-border shadow-2xl">
            <div className="p-8 text-center">
              <button
                onClick={() => {
                  setShowVerificationModal(false)
                  router.replace(bookPath(business?.slug ?? slug, selectedBranch))
                }}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <Mail className="w-8 h-8 text-primary" />
              </div>

              <h2 id="verification-title" className="text-2xl font-bold text-foreground mb-2">
                Verify your Phone Number
              </h2>
              <p id="verification-desc" className="text-sm text-muted-foreground mb-1">
                Your appointment is <span className="font-semibold text-foreground">pending confirmation</span>. We&apos;ve sent a verification code to
              </p>
              <p className="text-sm font-semibold text-foreground mb-6 break-all">{customerPhone}</p>

              <div className="rounded-lg border border-border bg-secondary/30 p-4 mb-6" aria-live="polite">
                <div className="mt-2 space-y-3">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter verification code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={verifyingCode}
                    className="h-11 text-center text-lg tracking-widest"
                  />
                  {codeError && <p className="text-sm text-destructive">{codeError}</p>}
                </div>
              </div>

              {bookingId && (
                <p className="text-xs text-muted-foreground mb-6">
                  Booking reference: <code className="font-mono text-foreground">{bookingId}</code>
                </p>
              )}

              <Button
                onClick={handleVerifyCode}
                disabled={verifyingCode || sendingCode}
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                {verifyingCode ? 'Verifying...' : 'Verify & Confirm'}
              </Button>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={sendingCode || resendCooldown > 0}
                className="mt-3 w-full text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : sendingCode ? 'Sending...' : "Didn't get a code? Resend"}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" /></div>}>
      <BookingPageContent />
    </Suspense>
  )
}