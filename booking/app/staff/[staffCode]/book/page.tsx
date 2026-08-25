'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Calendar, Clock,Loader , MailIcon, Phone} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getCurrentUser } from '@/lib/auth'


import { Staff } from '@/lib/api'

interface TimeSlot {
  time: string
  isAvailable: boolean
}

interface FormData {
  customerName: string
  email: string
  phone: string
  serviceId: string
  date: string
  time: string
  notes: string
}

export default function StaffBookPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const staffCode = params.staffCode as string

  const [staff, setStaff] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [staffTimeOff, setStaffTimeOff] = useState<Set<string>>(new Set())
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set())
  const [closedReason, setClosedReason] = useState<string | null>(null)
  const [closedDates, setClosedDates] = useState<Map<string, string>>(new Map())
  const [businessHours, setBusinessHours] = useState<any[]>([])
  const [showVerificationNotice, setShowVerificationNotice] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    email: '',
    phone: '',
    serviceId: '',
    date: '',
    time: '',
    notes: '',
  })

  // Fetch staff info and check user authentication
  useEffect(() => {
    const fetchStaffInfo = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
        
        // Check if user is authenticated
        const user = await getCurrentUser()
        setCurrentUser(user)
        
        const response = await fetch(`${API_URL}/api/staff/code/${staffCode}`)

        if (!response.ok) {
          if (response.status === 404) {
            setError('Staff member not found')
          } else {
            setError('Failed to load staff information')
          }
          return
        }

        const data = await response.json()
        setStaff(data)
        // Set the first service's serviceId (from the join table)
        if (data.services && data.services.length > 0) {
          setFormData((prev) => ({ ...prev, serviceId: data.services[0].serviceId }))
        }
        
        // Pre-fill customer info if user is authenticated
        if (user) {
          setFormData((prev) => ({
            ...prev,
            customerName: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
          }))
        }
        
        // Fetch business hours and closed dates for the business
        try {
          // Fetch business hours
          const hoursRes = await fetch(`${API_URL}/api/business-hours/business/${data.businessId}`)
          if (hoursRes.ok) {
            const hoursData = await hoursRes.json()
            setBusinessHours(hoursData)
          }
          
          // Fetch closed dates
          const closedDatesRes = await fetch(`${API_URL}/api/business-hours/${data.businessId}/closed-dates`)
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
          console.error('Error fetching business hours or closed dates:', err)
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStaffInfo()
  }, [staffCode])

  // Generate time slots (30-minute intervals)
  const generateTimeSlots = (openingTime: string, closingTime: string): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const [openHour, openMin] = openingTime.split(':').map(Number)
    const [closeHour, closeMin] = closingTime.split(':').map(Number)

    let currentHour = openHour
    let currentMin = openMin

    while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`
      slots.push({
        time: timeStr,
        isAvailable: true,
      })

      currentMin += 30
      if (currentMin >= 60) {
        currentMin = 0
        currentHour += 1
      }
    }

    return slots
  }

  // Fetch availability data when date changes
  const loadAvailableSlots = async (selectedDate: string, selectedServiceId: string) => {
    if (!staff || !selectedDate) return

    try {
      setLoadingSlots(true)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

      // Fetch time-off data for this month
      try {
        const timeOffRes = await fetch(`${API_URL}/api/staff/${staff.id}/time-off?month=${selectedDate.substring(0, 7)}`)
        if (timeOffRes.ok) {
          const contentType = timeOffRes.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            const timeOffData = await timeOffRes.json()
            const timeOffSet: Set<string> = new Set(timeOffData.map((to: any) => to.date.split('T')[0]))
            setStaffTimeOff(timeOffSet)

            // Check if date is a time-off day
            if (timeOffSet.has(selectedDate)) {
              setAvailableSlots([])
              setLoadingSlots(false)
              return
            }
          }
        }
      } catch (err) {
        console.error('[v0] Error fetching time-off:', err)
      }

      // Fetch bookings for this staff member on the selected date
      let bookedTimes: Set<string> = new Set()
      try {
        const bookingsRes = await fetch(`${API_URL}/api/staff/code/${staff.staffCode}/bookings/date?date=${selectedDate}`)
        if (bookingsRes.ok) {
          const contentType = bookingsRes.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            const data = await bookingsRes.json()
            const bookings = Array.isArray(data) ? data : data.bookings ? data.bookings : []

            // Extract booked times from the date-filtered bookings
            // Block all time slots during the entire service duration
            bookings.forEach((booking: any) => {
              if (booking.startTime && booking.endTime) {
                const startDate = new Date(booking.startTime)
                const endDate = new Date(booking.endTime)

                // Generate all 30-minute slots between start and end time
                let currentTime = new Date(startDate)
                while (currentTime < endDate) {
                  const hours = String(currentTime.getHours()).padStart(2, '0')
                  const minutes = String(currentTime.getMinutes()).padStart(2, '0')
                  const timeStr = `${hours}:${minutes}`
                  bookedTimes.add(timeStr)
                  currentTime.setMinutes(currentTime.getMinutes() + 30)
                }
              }
            })
          }
        }
      } catch (err) {
        console.error('[v0] Error fetching bookings:', err)
      }

      // Generate available slots (9 AM to 6 PM, 30-min intervals)
      const selectedDateObj = new Date(selectedDate)
      const dayOfWeek = selectedDateObj.getDay()
      const now = new Date()
      const isToday = selectedDateObj.toISOString().split('T')[0] === now.toISOString().split('T')[0]
      
      // Check if date is in closed dates from database
      if (closedDates.has(selectedDate)) {
        setAvailableSlots([])
        setClosedReason(closedDates.get(selectedDate) || 'Business is closed')
        setLoadingSlots(false)
        return
      }
      
      // Get business hours for this day of week from database
      // Note: dayOfWeek from Date is 0-6 (Sun-Sat), but our business hours uses 0-6 (Mon-Sun)
      // So we need to adjust: 0 (Sun) -> 6, 1 (Mon) -> 0, ..., 6 (Sat) -> 5
      const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const dayHours = businessHours.find((bh: any) => bh.dayOfWeek === adjustedDayOfWeek)
      
      if (!dayHours || dayHours.isClosed) {
        setAvailableSlots([])
        setClosedReason(dayHours ? 'Business is closed on this day' : 'Business hours not found')
        setLoadingSlots(false)
        return
      }

      const openingTime = dayHours.openTime
      const closingTime = dayHours.closeTime

      // Parse closing time to check if business is closed for today
      if (isToday) {
        const [closingHour, closingMin] = closingTime.split(':').map(Number)
        const closingDateTime = new Date(selectedDateObj)
        closingDateTime.setHours(closingHour, closingMin, 0, 0)
        
        if (now > closingDateTime) {
          setAvailableSlots([])
          setClosedReason('Business is closed for today')
          setLoadingSlots(false)
          return
        }
      }
      
      // Clear closed reason if business is open
      setClosedReason(null)

      const allSlots = generateTimeSlots(openingTime, closingTime)
      
      // Filter slots: remove past times for today and booked times
      const availableSlotsList = allSlots.map((slot) => {
        let isAvailable = !bookedTimes.has(slot.time)
        
        // For today, filter out past times
        if (isToday && isAvailable) {
          const [slotHour, slotMin] = slot.time.split(':').map(Number)
          const slotDateTime = new Date(selectedDateObj)
          slotDateTime.setHours(slotHour, slotMin, 0, 0)
          
          if (now > slotDateTime) {
            isAvailable = false
          }
        }
        
        return {
          ...slot,
          isAvailable,
        }
      })

      setAvailableSlots(availableSlotsList)
      setLoadingSlots(false)
    } catch (err) {
      console.error('[v0] Error loading available slots:', err)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Check if date is a time-off date
    if (name === 'date' && staffTimeOff.has(value)) {
      toast({
        title: 'Staff Unavailable',
        description: 'The staff member is not available on this date. Please select another date.',
        variant: 'destructive',
      })
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))

    // Load available slots when date or service changes
    if (name === 'date' || name === 'serviceId') {
      const newFormData = { ...formData, [name]: value }
      if (newFormData.date && newFormData.serviceId) {
        loadAvailableSlots(newFormData.date, newFormData.serviceId)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    const errors = new Set<string>()
    const missingFields: string[] = []

    // For public users: validate name, email, phone
    // For authenticated users: skip these (come from backend)
    if (!currentUser) {
      if (!formData.customerName) {
        errors.add('customerName')
        missingFields.push('Name')
      }
      if (!formData.email) {
        errors.add('email')
        missingFields.push('Email')
      }
      if (!formData.phone) {
        errors.add('phone')
        missingFields.push('Phone')
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (formData.email && !emailRegex.test(formData.email)) {
        errors.add('email')
        missingFields.push('Valid email')
      }

      // Validate phone format (basic validation - at least 10 digits)
      const phoneRegex = /^\d{10,}$/
      if (formData.phone && !phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
        errors.add('phone')
        missingFields.push('Valid phone number')
      }
    }

    // Always validate service, date, time
    if (!formData.serviceId) {
      errors.add('serviceId')
      missingFields.push('Service')
    }
    if (!formData.date) {
      errors.add('date')
      missingFields.push('Date')
    }
    if (!formData.time) {
      errors.add('time')
      missingFields.push('Time')
    }

    if (errors.size > 0) {
      setValidationErrors(errors)
      toast({
        title: 'Missing or Invalid Fields',
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: 'destructive',
      })
      return
    }

    setValidationErrors(new Set())

    try {
      setSubmitting(true)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

      // Create booking with customer details
      const startDateTime = new Date(`${formData.date}T${formData.time}`)
      const endDateTime = new Date(startDateTime)

      // Get service duration
      const selectedStaffService = staff?.services?.find((ss: any) => ss.serviceId === formData.serviceId)
      const duration = selectedStaffService?.service?.duration || 60
      endDateTime.setMinutes(endDateTime.getMinutes() + duration)

      // Use public booking endpoint for guests, authenticated booking for logged-in users
      const endpoint = currentUser ? '/api/booking' : '/api/booking/public'
      const bookingPayload: any = {
        businessId: staff?.businessId,
        staffId: staff?.id,
        serviceId: formData.serviceId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notes: formData.notes,
      }

      // Add business ID and customer details only for public bookings
      if (!currentUser) {
        bookingPayload.businessId = staff?.businessId
        bookingPayload.customerName = formData.customerName
        bookingPayload.customerEmail = formData.email
        bookingPayload.customerPhone = formData.phone
      }

      const bookingRes = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
         },
         credentials: currentUser ? 'include' : 'omit', // Include credentials only for authenticated users
        body: JSON.stringify(bookingPayload),
        
      })

      if (bookingRes.ok) {
        const bookingData = await bookingRes.json()
        
        // Create appointment details message
        const serviceName = staff?.services?.find((s: any) => s.serviceId === formData.serviceId)?.service?.name || 'Service'
        const appointmentDetails = `${serviceName} on ${formData.date} at ${formData.time}`
        const isUserVerified = bookingData.userVerified; // adjust based on actual response

        if (!isUserVerified) {
    // Show verification notice
    setShowVerificationNotice(true);
  } else {
    // Redirect for verified user
    setTimeout(() => {
      router.push('/search');
    }, 2000);
  }
        if (bookingData.warnings && bookingData.warnings.length > 0) {
          toast({
            title: 'Booking Created with Warnings',
            description: bookingData.warnings.join('\n') || bookingData.message,
            variant: 'default',
          })
        } else {
          toast({
            title: 'Booking Confirmed!',
            description: `Your appointment for ${appointmentDetails} has been scheduled successfully`,
          })
        }
        
        
        // Redirect after a short delay
        setTimeout(() => {
          if (currentUser && currentUser.role === 'CUSTOMER' ) {
            
            // Redirect authenticated users to dashboard
            router.push('/search')
          }else if (currentUser && currentUser.role === 'BUSINESS_OWNER') {
            // Redirect business owners to their dashboard
            router.push('/')
          } 
          else {
            // Redirect guests back to staff page
            router.push("/")
          }
        }, 2000)
      } else {
     
        
        let error
        try {
          error = await bookingRes.json()
        
        } catch (parseErr) {
   
          error = { message: 'Failed to parse error response' }
        }
        
        let errorTitle = 'Booking Failed'
        let errorMessage = error.message || 'Failed to create booking'
        
    
        
        if (bookingRes.status === 401) {
          errorTitle = 'Session Expired'
          errorMessage = 'Your session has expired. Please log in again to complete your booking.'
        } else if (bookingRes.status === 400) {
          // For email validation errors, show both message and reason
          if (error.reason) {
            errorTitle = 'Invalid Email Address'
            errorMessage = `${error.message}\n• Issue: Email validation`
          } else if (error.reason) {
            errorMessage = `${error.message}\n• Reason: ${error.reason}`
          } else {
            errorMessage = error.message || 'Please fill in all required fields correctly'
          }
        } else if (bookingRes.status === 429) {
          errorTitle = 'Booking Limit Reached'
          errorMessage = error.message || 'Booking limit reached. Please upgrade your subscription.'
        }
      
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: 'destructive',
        })
        
        setSubmitting(false)
      }
    } catch (err: any) {
      console.error('[v0] Booking error:', err)
      let errorMessage = err.message || 'An error occurred while booking'
      if (err.name === 'AbortError') {
        errorMessage = 'Booking request timed out. Please check your connection and try again.'
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      setSubmitting(false)
    } 
    finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="py-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <p className="text-muted-foreground">Loading staff information...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !staff) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-destructive">
          <CardContent className="py-12">
            <div className="flex items-center gap-3 text-destructive mb-4">
              <AlertCircle className="w-6 h-6" />
              <p className="font-semibold">{error || 'Staff member not found'}</p>
            </div>
            <p className="text-sm text-muted-foreground">Please check the booking link and try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Staff Header */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Book an Appointment</CardTitle>
            <CardDescription>
              Schedule an appointment with {staff.firstName} {staff.lastName} at your convenience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MailIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{staff.email}</span>
              </div>
              {staff.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{staff.phone}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle>Book Your Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Your Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Your Information</h3>

                  <div>
                    <Label htmlFor="customerName" className={validationErrors.has('customerName') ? 'text-red-600' : ''}>
                      Name * {currentUser && <span className="text-xs text-primary">(verified)</span>}
                    </Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      type="text"
                      placeholder="Your full name"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      disabled={submitting || !!currentUser}
                      className={`${validationErrors.has('customerName') ? 'border-red-500 focus:border-red-500' : ''} ${currentUser ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className={validationErrors.has('email') ? 'text-red-600' : ''}>
                      Email * {currentUser && <span className="text-xs text-primary">(verified)</span>}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Your email address"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={submitting || !!currentUser}
                      className={`${validationErrors.has('email') ? 'border-red-500 focus:border-red-500' : ''} ${currentUser ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`}
                      required
                    />
                    {validationErrors.has('email') && (
                      <p className="text-xs text-red-600 mt-1">Please enter a valid email address</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone" className={validationErrors.has('phone') ? 'text-red-600' : ''}>
                      Phone *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Your phone number"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={submitting}
                      className={`${validationErrors.has('phone') ? 'border-red-500 focus:border-red-500' : ''}`}
                      required
                    />
                    {validationErrors.has('phone') && (
                      <p className="text-xs text-red-600 mt-1">Please enter a valid phone number (at least 10 digits)</p>
                    )}
                  </div>
              </div>

              {/* Service Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Service Selection</h3>

                <div>
                  <Label htmlFor="serviceId">Service *</Label>
                  <select
                    id="serviceId"
                    name="serviceId"
                    value={formData.serviceId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="">Select a service</option>
                    {staff.services?.map((staffService: any) => {
                      const svc = staffService.service
                      if (!svc) return null
                      return (
                        <option key={staffService.serviceId} value={staffService.serviceId}>
                          {svc.name} - Rs. {svc.price} ({svc.duration} min)
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Appointment Date & Time</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className={validationErrors.has('date') ? 'text-red-600' : ''}>
                      Date *
                    </Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={validationErrors.has('date') ? 'border-red-500 focus:border-red-500' : ''}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="time">Time *</Label>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-6 border border-input rounded-md bg-muted">
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Loading available times...</span>
                      </div>
                    ) : staffTimeOff.has(formData.date) ? (
                      <div className="flex items-center justify-center py-6 border border-input rounded-md bg-amber-50 border-amber-200">
                        <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
                        <span className="text-sm text-amber-600">Staff unavailable on this date</span>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, time: slot.time }))}
                            disabled={!slot.isAvailable}
                            className={`w-20 px-3 py-2 text-sm rounded-md border transition-all text-center ${
                              formData.time === slot.time && slot.isAvailable
                                ? 'bg-primary text-primary-foreground border-primary'
                                : slot.isAvailable
                                ? 'border-input hover:border-primary hover:bg-primary/10'
                                : 'border-input bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    ) : formData.date ? (
                      <div className="flex items-center justify-center py-6 border border-input rounded-md bg-red-50 border-red-200">
                        <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                        <span className="text-sm text-red-600">
                          {closedReason || 'No available times on this date'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-6 border border-input rounded-md bg-muted">
                        <span className="text-sm text-muted-foreground">Select a date to see available times</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any special requests or information..."
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Booking...' : 'Book Appointment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      {showVerificationNotice && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow max-w-sm w-full text-center">
          <h2 className="text-xl font-semibold mb-4">Verify Your Email</h2>
          <p className="mb-4">
            A verification email has been sent to your email address. Please verify your email to access all features and future bookings.
          </p>
          <button
            className="bg-primary text-primary-foreground px-4 py-2 rounded"
            onClick={() => {
              setShowVerificationNotice(false);
              router.push('/search');
            }}
          >
            OK
          </button>
        </div>
      </div>
    )}
    </div>
  )
}
