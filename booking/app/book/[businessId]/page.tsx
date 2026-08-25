'use client'

import { useRouter, useParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { Calendar, Clock, CheckCircle2, AlertCircle, Briefcase, MessageCircle, User } from 'lucide-react'
import { servicesApi, bookingsApi, businessApi, staffApi, type Service, type Business, type Staff } from '@/lib/api'
import { useAuth } from '@/context/authContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

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
      console.error('[v0] Error loading business data:', err)
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
      console.error('[v0] Error loading staff:', err)
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
      console.error('[v0] Error loading slots:', err)
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
      // Combine date string (YYYY-MM-DD) with time string (HH:MM) to create valid datetime
      const dateTimeString = `${date}T${selectedTime}:00`
      const startTime = new Date(dateTimeString)
      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration)

      const basePayload: any = {
        serviceId: selectedService.id,
        businessId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
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
        const bookingId = response.data.booking?.id || response.data.id || ''
        if (bookingId) {
          setBookingId(bookingId)
          setBookingSuccess(true)
          setError('')
        } else {
          setError('Booking created but no ID returned. Please contact support.')
        }
      } else {
        setError(response.error || 'Failed to create booking')
      }
    } catch (err: any) {
      console.error('[v0] Booking error:', err)
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
                      {new Date(date + 'T00:00:00').toLocaleDateString('ne-NP', {
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
                {/* {business?.phone && (
                  <a
                    href={`https://wa.me/${String(business.phone).replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(String(business.name))}%2C%20I%20have%20a%20booking%20with%20ID%20${bookingId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-12 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] transition-colors font-semibold shadow-md"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Contact via WhatsApp
                  </a>
                )} */}
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
                            <img src={staff.avatar} alt={staff.firstName} className="w-12 h-12 rounded-full object-cover" />
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
            {selectedService && date  && !closedReason && (
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
                    {availableSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTime(slot)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${selectedTime === slot
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-foreground border-border hover:border-primary'
                          }`}
                      >
                        {formatTimeSlot(slot)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Customer Info */}
            {selectedService && date && selectedTime && (
              <div className="mb-8 p-6 bg-secondary/20 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">5. Your Information</h3>
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
                      onChange={user ? undefined : (e => setCustomerName(e.target.value))}
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
                      onChange={user ? undefined : (e => setCustomerEmail(e.target.value))}
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
                    onChange={e => setNotes(e.target.value)}
                    className="w-full p-3 border-2 border-border rounded-lg text-sm focus:border-primary focus:outline-none bg-background"
                    rows={3}
                  />
                </div>
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
function setClosedDates(closedDatesMap: Map<string, string>) {
  throw new Error('Function not implemented.')
}

