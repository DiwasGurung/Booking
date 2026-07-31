'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Calendar, Clock, MapPin, Loader, TimerOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
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

export default function StaffDirectBookPage() {
  const params = useParams()
  const { toast } = useToast()
  const staffCode = params.staffCode as string

  const [staff, setStaff] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [staffTimeOff, setStaffTimeOff] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    email: '',
    phone: '',
    serviceId: '',
    date: '',
    time: '',
    notes: '',
  })

  // Fetch staff info
  useEffect(() => {
    const fetchStaffInfo = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
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
            const timeOffSet = new Set<string>(timeOffData.map((to: any) => to.date.split('T')[0]))
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
                  const timeStr = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`
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
      const dayOfWeek = new Date(selectedDate).getDay()
      let openingTime = '09:00'
      let closingTime = '18:00'

      // Adjust for Sunday (closed) and Saturday (10 AM - 4 PM)
      if (dayOfWeek === 0) {
        setAvailableSlots([])
        setLoadingSlots(false)
        return
      } else if (dayOfWeek === 6) {
        openingTime = '10:00'
        closingTime = '16:00'
      }

      const allSlots = generateTimeSlots(openingTime, closingTime)
      const availableSlotsList = allSlots.map((slot) => ({
        ...slot,
        isAvailable: !bookedTimes.has(slot.time),
      }))

      setAvailableSlots(availableSlotsList)
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

    if (!formData.customerName || !formData.email || !formData.serviceId || !formData.date || !formData.time) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

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

      

      const bookingRes = await fetch(`${API_URL}/api/booking/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: staff?.id,
          businessId: staff?.businessId,
          serviceId: formData.serviceId,
          customerName: formData.customerName,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          notes: formData.notes,
        }),
      })


      if (bookingRes.ok) {
        toast({
          title: 'Booking Confirmed!',
          description: 'Your appointment has been scheduled successfully',
        })
        setFormData({
          customerName: '',
          email: '',
          phone: '',
          serviceId: staff?.services?.[0]?.serviceId || '',
          date: '',
          time: '',
          notes: '',
        })
      } else {
        const error = await bookingRes.json()
        toast({
          title: 'Booking Failed',
          description: error.message || 'Failed to create booking',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'An error occurred while booking',
        variant: 'destructive',
      })
    } finally {
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
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{staff.email}</span>
              </div>
              {staff.phone && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
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
                  <Label htmlFor="customerName">Full Name *</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1234567890"
                    />
                  </div>
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
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
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
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, time: slot.time }))}
                            disabled={!slot.isAvailable}
                            className={`px-3 py-2 text-sm rounded-md border transition-all ${
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
                        <span className="text-sm text-red-600">No available times on this date</span>
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
    </div>
  )
}
