'use client'

import { useRouter, useParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { Calendar, Clock, CheckCircle2, AlertCircle, Briefcase, MessageCircle } from 'lucide-react'
import { servicesApi, businessHoursApi, bookingsApi, businessApi, type Service, type Business } from '@/lib/api'
import { useAuth } from '@/context/authContext'

function BookingPageContent() {
  const searchParams = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const businessId = searchParams.businessId as string

  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [servicesLoading, setServicesLoading] = useState(false)
  const [business, setBusiness] = useState<Business | null>(null)
  const [date, setDate] = useState('')
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!businessId) return
    loadBusinessData()
  }, [businessId])

  useEffect(() => {
    if (date && selectedService) {
      loadAvailableSlots()
    }
  }, [date, selectedService])

  const loadBusinessData = async () => {
    try {
      setServicesLoading(true)
      setError('')

      const [servicesRes, businessRes] = await Promise.all([
        servicesApi.getBusinessServices(businessId),
        businessApi.getBusinessById(businessId),
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
        if (list.length > 0) {
          setSelectedService(list[0])
        }
      }

      if (businessRes.data) {
        if (typeof businessRes.data === 'object') {
          setBusiness(businessRes.data as Business)
        }
      }
    } catch (err) {
      console.error('[v0] Error loading business data:', err)
      setError('Failed to load business information. Please try again.')
    } finally {
      setServicesLoading(false)
    }
  }

  const loadAvailableSlots = async () => {
    if (!selectedService || !date || !businessId) return

    try {
      setLoading(true)
      const response = await bookingsApi.getAvailableSlots(businessId, selectedService.id, date)

      if (response.data) {
        let slots: string[] = []
        if (Array.isArray(response.data)) {
          slots = response.data
        } else if (typeof response.data === 'object' && response.data !== null) {
          const data = response.data as Record<string, any>
          slots = data.slots || data.availableSlots || data.times || []
        }
        setAvailableSlots(slots)
      } else {
        setAvailableSlots([])
      }
    } catch (err) {
      console.error('[v0] Error loading slots:', err)
      setAvailableSlots([])
    } finally {
      setLoading(false)
    }
  }

  const formatTimeSlot = (isoString: string): string => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return isoString
    }
  }

  const getDisplayTime = (isoString: string): string => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return isoString
    }
  }

  const handleConfirmBooking = async () => {
    if (!selectedService || !date || !selectedTime || !customerName || !customerEmail || !customerPhone) {
      setError('Please fill in all required fields')
      return
    }

    if (!user || !user.id) {
      setError('You must be logged in to create a booking')
      return
    }

    try {
      setLoading(true)
      // selectedTime is now an ISO string, use it directly
      const startTime = new Date(selectedTime)
      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration)

      const response = await bookingsApi.createBooking({
        serviceId: selectedService.id,
        businessId,
        userId: user.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        customerName,
        customerEmail,
        customerPhone,
        notes,
      })

      if (response.success && response.data) {
        const booking = response.data as any
        setBookingId(booking.id || booking._id || '')
        setBookingSuccess(true)
      } else {
        setError(response.error || 'Failed to create booking')
      }
    } catch (err) {
      console.error('[v0] Booking error:', err)
      setError('Failed to book appointment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!businessId) {
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
          <Card className="border border-border shadow-lg">
            <div className="p-8 md:p-12 text-center">
              <div className="mb-6">
                <CheckCircle2 className="w-20 h-20 text-primary mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-foreground mb-2">Booking Confirmed!</h1>
                <p className="text-lg text-muted-foreground">Your appointment has been successfully booked</p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8 text-left">
                <div className="space-y-3">
                  <p><span className="font-semibold text-foreground">Business:</span> {business?.name}</p>
                  <p><span className="font-semibold text-foreground">Service:</span> {selectedService?.name}</p>
                  <p><span className="font-semibold text-foreground">Date:</span> {new Date(date).toLocaleDateString()}</p>
                  <p><span className="font-semibold text-foreground">Time:</span> {getDisplayTime(selectedTime || '')}</p>
                  <p><span className="font-semibold text-foreground">Booking ID:</span> <code className="bg-secondary px-2 py-1 rounded text-sm">{bookingId}</code></p>
                </div>
              </div>

              <div className="space-y-3">
                {business?.phone && (
                  <a
                    href={`https://wa.me/${business.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(business.name)}%2C%20I%20have%20a%20booking%20with%20ID%20${bookingId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-12 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] transition-colors font-semibold"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Contact via WhatsApp
                  </a>
                )}
                <Button
                  onClick={() => router.push(`/bookings/${bookingId}`)}
                  variant="outline"
                  className="w-full"
                >
                  View Booking Details
                </Button>
                <Button
                  onClick={() => router.push('/search')}
                  className="w-full"
                >
                  Book Another Service
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-6">
                Confirmation sent to <span className="font-semibold">{customerEmail}</span>
              </p>
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
          <p className="text-lg text-muted-foreground">Select a service, date and time</p>
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
            {/* Services */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Select Service
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
                            <><span className="line-through">${service.price.toFixed(2)}</span> ${service.offerPrice.toFixed(2)}</>
                          ) : (
                            `$${service.price.toFixed(2)}`
                          )}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date */}
            {selectedService && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Select Date
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={e => {
                    setDate(e.target.value)
                    setSelectedTime(null)
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-12"
                />
              </div>
            )}

            {/* Time */}
            {selectedService && date && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Select Time
                </label>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="bg-secondary/40 border border-border rounded-lg p-6 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                    No available slots for this date
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          selectedTime === slot
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

            {/* Customer Info */}
            {selectedService && date && selectedTime && (
              <div className="mb-8 p-6 bg-secondary/20 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-4">Your Information</h3>
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Full Name *"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="h-11"
                  />
                  <Input
                    type="email"
                    placeholder="Email Address *"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className="h-11"
                  />
                  <Input
                    type="tel"
                    placeholder="Phone Number *"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="h-11"
                  />
                  <textarea
                    placeholder="Notes (optional)"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full p-3 border-2 border-border rounded-lg text-sm focus:border-primary focus:outline-none"
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
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-medium">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">{selectedService.duration} min</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-primary/20">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-bold text-primary">${(selectedService.offerPrice || selectedService.price).toFixed(2)}</span>
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
