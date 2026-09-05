'use client'

import { useRouter, useParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { Calendar, Clock, CheckCircle2, AlertCircle, Briefcase, MessageCircle, User, Mail, Loader2, X } from 'lucide-react'
import { servicesApi, bookingsApi, businessApi, staffApi, type Service, type Business, type Staff } from '@/lib/api'
import { useAuth } from '@/context/authContext'
import { DateTime } from 'luxon';

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

// Seconds the verification notice counts down before telling the user to check their inbox.
const VERIFICATION_COUNTDOWN = 10

function BookingPageContent() {
  const searchParams = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const businessId = searchParams.businessId as string

  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [servicesLoading, setServicesLoading] = useState(false)
  const [business, setBusiness] = useState<Business | null>(null)

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
  const [businessHours, setBusinessHours] = useState<any[]>([])
  const [closedDates, setClosedDates] = useState<Map<string, string>>(new Map())
  const [closedReason, setClosedReason] = useState<string | null>(null)

  // Verification modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [countdown, setCountdown] = useState(VERIFICATION_COUNTDOWN)


  // Returns true if this slot's start time (for the given date) is still in
  // the future. Mirrors the past-time filtering already done in the staff
  // booking page — applied here so an already-passed slot for today renders
  // disabled instead of being clickable.
  const isSlotInFuture = (dateStr: string, timeString: string): boolean => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    if (dateStr !== todayStr) return true // any future date is fine as-is

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

  // Pre-fill customer info from logged-in user
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

  // Redirect unauthenticated users to public booking page
  useEffect(() => {
    if (!businessId) return
    if (!user && !loading) {
      router.push(`/book/${businessId}`)
    }
  }, [businessId, user, loading, router])

  useEffect(() => {
    if (!businessId) return
    loadBusinessData()
  }, [businessId])

  // Load staff when service is selected
  useEffect(() => {
    if (selectedService) {
      loadStaffForService(selectedService.id)
    } else {
      setStaffMembers([])
      setSelectedStaff(null)
    }
  }, [selectedService])

  // Load available slots when date and service are selected (staff is optional)
  useEffect(() => {
    if (date && selectedService) {
      loadAvailableSlots()
    }
  }, [date, selectedService])

  // Reload slots when staff selection changes
  useEffect(() => {
    if (date && selectedService) {
      loadAvailableSlots()
    }
  }, [selectedStaff])

  // Countdown that only runs while the verification modal is open.
  // It resets to the full duration each time the modal opens and stops cleanly at 0.
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

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (showVerificationModal) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = original
      }
    }
  }, [showVerificationModal])


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

  const loadBusinessData = async () => {
    try {
      setServicesLoading(true)
      setError('')

      const [servicesRes, businessRes, hoursRes, closedDatesRes] = await Promise.all([
        servicesApi.getBusinessServices(businessId),
        businessApi.getBusinessById(businessId),
        fetch(`${API_URL}/api/business-hours/business/${businessId}`),
        fetch(`${API_URL}/api/business-hours/${businessId}/closed-dates`), // Fetch closed dates
      ])

      if (servicesRes.data) {
        let list: Service[] = []
        if (Array.isArray(servicesRes.data)) {
          list = servicesRes.data
        } else if (typeof servicesRes.data === 'object' && servicesRes.data !== null) {
          const data = servicesRes.data as Record<string, any>
          list = data.services || data.data || []
        }
        setServices(list)
      }

      if (businessRes.data) {
        if (typeof businessRes.data === 'object') {
          setBusiness(businessRes.data as Business)
        }
      }

      // Fetch business hours
      if (hoursRes.ok) {
        const hoursData = await hoursRes.json()
        setBusinessHours(hoursData)
      }

      // Fetch closed dates
      if (closedDatesRes.ok) {
        const closedDatesData = await closedDatesRes.json()
        const closedDatesMap = new Map<string, string>()
        if (closedDatesData.success && closedDatesData.data) {
          closedDatesData.data.forEach((cd: any) => {
            const dateStr = new Date(cd.date).toISOString().split('T')[0]
            closedDatesMap.set(dateStr, cd.reason || 'Business is closed')
          })
        }
        setClosedDates(closedDatesMap)
      }
    } catch (err) {
      setError('Failed to load business information. Please try again.')
    } finally {
      setServicesLoading(false)
    }
  }



  const loadStaffForService = async (serviceId: string) => {
    try {
      setStaffLoading(true)
      const response = await staffApi.getStaffForService(serviceId)
      if (response.data?.staff) {
        setStaffMembers(response.data.staff)
        // Don't auto-select - staff selection is now optional
        setSelectedStaff(null)
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

  // Load available slots for the selected service (staff is optional)
  const loadAvailableSlots = async () => {
    if (!selectedService || !date || !businessId) return

    try {
      setLoading(true)

      const response = await bookingsApi.getBusinessAvailableSlots(businessId, selectedService.id, date, selectedStaff?.id)

      if (response.success) {
        // Handle nested response: response.data could be array or {data: array}
        let slots: string[] = []
        if (Array.isArray(response.data)) {
          slots = response.data
        } else if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray((response.data as any).data)) {
          slots = (response.data as any).data
        }


        if (slots.length > 0) {
          // Store time strings directly
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
      // Handle both "HH:MM" format and ISO date strings
      let hours: number, minutes: number

      if (timeString.includes('T') || timeString.includes(':') && timeString.length > 5) {
        // ISO date string like "2026-08-06T11:00:00"
        const date = new Date(timeString)
        hours = date.getHours()
        minutes = date.getMinutes()
      } else {
        // Simple time string like "11:00"
        const parts = timeString.split(':')
        hours = parseInt(parts[0], 10)
        minutes = parseInt(parts[1], 10)
      }

      // Format as 12-hour time
      const period = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
    } catch {
      return timeString
    }
  }

  const getDisplayTime = (timeString: string): string => {
    if (!timeString) return 'N/A'
    try {
      // Handle "HH:MM" format
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

  if (!isSlotInFuture(date, selectedTime)) {
    setError('This time slot has passed. Please select a different time.')
    setSelectedTime(null)
    return
  }

    // Check if the date is a closed date
    if (closedDates.has(date)) {
      setError(closedDates.get(date) || 'The business is closed on this date')
      return
    }

    // Only validate customer details for public users
    if (!user) {
      if (!customerName || !customerEmail || !customerPhone) {
        setError('Please fill in all required fields')
        return
      }
    }

    try {
      setLoading(true)

      // Define your business timezone, e.g., 'Asia/Kathmandu'
      const BUSINESS_TZ = process.env.BUSINESS_TIME_ZONE || 'Asia/Kathmandu';

      const startDateTime = DateTime.fromISO(`${date}T${selectedTime}`, { zone: BUSINESS_TZ });
      const startTimeISO = startDateTime.toISO();

      const endDateTime = startDateTime.plus({ minutes: selectedService.duration });
      const endTimeISO = endDateTime.toISO();


      const basePayload: any = {
        serviceId: selectedService.id,
        businessId,
        startTime: startTimeISO,
        endTime: endTimeISO,
        notes,
      }

      // Only include staffId if a staff member was specifically selected
      if (selectedStaff?.id) {
        basePayload.staffId = selectedStaff.id
      }

      // Call the appropriate API method based on user type
      let response
      if (user) {
        // Authenticated user - use createBusinessBooking
        response = await bookingsApi.createBusinessBooking(basePayload)
      } else {
        // Public user - use createBusinessPublicBooking with customer details
        response = await bookingsApi.createBusinessPublicBooking({
          ...basePayload,
          customerName,
          customerEmail,
          customerPhone,
        })
      }

      if (response.success && response.data) {
        const createdBooking = response.data.booking || response.data
        const newBookingId = createdBooking?.id || ''

        if (newBookingId) {
          setBookingId(newBookingId)

          // Treat every explicit false/unverified signal as requiring verification.
          // The API can return these flags either on the response or inside booking.
          const responsePayload = response.data as any
          const requiresVerification =
            responsePayload.isPhoneVerified === false ||
            responsePayload.status === 'UNVERIFIED' ||
            createdBooking?.isPhoneVerified === false ||
            createdBooking?.status === 'UNVERIFIED'

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
          setError('Booking created but no ID returned. Please contact support.')
        }
      } else {
        setError(response.error || 'Failed to create booking')
      }
    } catch (err: any) {

      setError('Failed to book appointment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show loading during auth check
  if (loading || !businessId) {
    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
        <div className="mx-auto max-w-2xl text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Invalid Request</h1>
          <p className="text-muted-foreground mb-6">No business selected for booking</p>
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
              {/* Success Icon */}
              <div className="mb-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-primary" />
                </div>
                <h1 className="text-4xl font-bold text-foreground mb-3">Booking Confirmed!</h1>
                <p className="text-lg text-muted-foreground">Your appointment has been successfully booked</p>
              </div>

              {/* Details Card */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-8 mb-10 text-left">
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="text-sm font-semibold text-foreground min-w-fit">Business:</div>
                    <div className="text-sm text-foreground">{business?.name || 'N/A'}</div>
                  </div>
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
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-sm font-semibold text-foreground min-w-fit">Time:</div>
                    <div className="text-sm text-foreground font-medium">{getDisplayTime(selectedTime || '')}</div>
                  </div>
                  <div className="h-px bg-border my-1"></div>
                  <div className="flex items-start gap-3">
                    <div className="text-sm font-semibold text-foreground min-w-fit">Booking ID:</div>
                    <code className="text-xs bg-secondary/50 px-3 py-2 rounded font-mono text-foreground cursor-pointer hover:bg-secondary transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(bookingId)
                      }}
                      title="Click to copy"
                    >
                      {bookingId}
                    </code>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-8">
                <Button
                  onClick={() => window.location.href = `/book/${business?.id}`}
                  className="w-full h-12 bg-primary hover:bg-primary/90 font-semibold"
                >
                  Book Another Service
                </Button>
              </div>

              {/* Confirmation Email */}
              <div className="pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  A confirmation email has been sent to <span className="font-semibold text-foreground">{customerEmail}</span>
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
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-3">{business?.name || 'Book Your Appointment'}</h1>
          <p className="text-lg text-muted-foreground">Select a service, date, staff (optional) and time</p>
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
            {/* Step 1: Services */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                1. Select Service
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
                  {services.map(service => (
                    <button
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service)
                        setSelectedStaff(null)
                        setDate('')
                        setSelectedTime(null)
                      }}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${selectedService?.id === service.id
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

            {/* Step 2: Select Date */}
            {selectedService && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  2. Select Date
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    setDate(selectedDate);
                    setSelectedTime(null);

                    // Check if the selected date is closed
                    if (closedDates.has(selectedDate)) {
                      setClosedReason(closedDates.get(selectedDate) || 'Business is closed');
                    } else {
                      setClosedReason(null);
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-12"
                />

                {/* Show closed message if applicable */}
                {closedReason && (
                  <div className="flex items-center justify-center py-6 border border-input rounded-md bg-amber-50 border-amber-200 mt-4">
                    <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
                    <span className="text-sm text-amber-600">{closedReason || 'Business is closed'}</span>
                  </div>
                )}
              </div>
            )}



            {/* Step 3: Staff Selection (Optional) - Show after date is selected */}
            {selectedService && date && staffMembers.length > 0 && !closedReason && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  3. Select Staff <span className="text-xs opacity-60">(Optional)</span>
                </label>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {staffMembers.map(staff => (
                      <button
                        key={staff.id}
                        onClick={() => {
                          setSelectedStaff(staff)
                          setSelectedTime(null)
                        }}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${selectedStaff?.id === staff.id
                          ? 'bg-primary text-primary-foreground border-primary shadow-md'
                          : 'bg-card text-foreground border-border hover:border-primary'
                          }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-2">
                          {staff.avatar ? (
                            <img src={staff.avatar || "/placeholder.svg"} alt={staff.firstName} className="w-12 h-12 rounded-full object-cover" />
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
            {/* Step 4: Time */}
            {selectedService && date && !closedReason && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  4. Select Time
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
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${isPast
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

            {/* Summary */}
            {selectedService && date && selectedTime && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-3">Booking Summary</p>
                    <div className="space-y-2 text-sm">
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
            {selectedService && date && selectedTime && (
              <div className="flex gap-3">
                <Button
                  onClick={handleConfirmBooking}
                  disabled={loading || !customerName || !customerEmail || !customerPhone}
                  className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? 'Confirming...' : 'Confirm Booking'}
                </Button>
                <Button
                  onClick={() => setSelectedTime(null)}
                  variant="outline"
                  className="px-6 h-12"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Unverified customer verification notice */}
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
              {/* Close */}
              <button
                onClick={() => {
                  setShowVerificationModal(false)
                  router.replace(`/book/${businessId}`)
                }}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <Mail className="w-8 h-8 text-primary" />
              </div>

              <h2 id="verification-title" className="text-2xl font-bold text-foreground mb-2">
                Verify your Phone Number
              </h2>
              <p id="verification-desc" className="text-sm text-muted-foreground mb-1">
                Your appointment is <span className="font-semibold text-foreground">pending confirmation</span>. We&apos;ve sent a verification code to
              </p>
              <p className="text-sm font-semibold text-foreground mb-6 break-all">
                {customerPhone}
              </p>

              {/* Countdown / status */}
              <div
                className="rounded-lg border border-border bg-secondary/30 p-4 mb-6"
                aria-live="polite"
              >
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
                  Booking reference:{' '}
                  <code className="font-mono text-foreground">{bookingId}</code>
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
