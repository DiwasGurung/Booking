'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loader, CheckCircle, AlertCircle, Calendar, Clock, User, Mail, Phone, MapPin, ArrowRight } from 'lucide-react'
import { businessApi, servicesApi, bookingsApi, type Business, type Service } from '@/lib/api'

export default function PublicBookingPage() {
  const params = useParams()
  const businessId = params.businessId as string

  const [business, setBusiness] = useState<Business | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedService, setSelectedService] = useState<string>('')
  const [appointmentDate, setAppointmentDate] = useState<string>('')
  const [appointmentTime, setAppointmentTime] = useState<string>('')
  const [customerName, setCustomerName] = useState<string>('')
  const [customerEmail, setCustomerEmail] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  useEffect(() => {
    loadBusinessData()
  }, [businessId])

  async function loadBusinessData() {
    try {
      setLoading(true)
      setError(null)

      const businessResponse = await businessApi.getBusinessById(businessId)
      
      if (!businessResponse.success || !businessResponse.data) {
        throw new Error(businessResponse.error || 'Business not found')
      }
      
      setBusiness(businessResponse.data)

      const servicesResponse = await servicesApi.getBusinessServices(businessId)
      
      if (servicesResponse.success && servicesResponse.data) {
        setServices(servicesResponse.data)
      }
    } catch (err) {
      console.error('[v0] Error loading business:', err)
      setError(err instanceof Error ? err.message : 'Failed to load booking information')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedService || !appointmentDate || !appointmentTime || !customerName || !customerEmail || !customerPhone) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const startTime = new Date(`${appointmentDate}T${appointmentTime}`)
      const selectedServiceData = services.find(s => s.id === selectedService)
      
      if (!selectedServiceData) {
        throw new Error('Selected service not found')
      }

      const endTime = new Date(startTime.getTime() + selectedServiceData.duration * 60000)

      const bookingResponse = await bookingsApi.createBooking({
        businessId,
        serviceId: selectedService,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        customerName,
        customerEmail,
        customerPhone,
        notes,
      })

      if (!bookingResponse.success) {
        throw new Error(bookingResponse.error || 'Failed to create booking')
      }

      setBookingSuccess(true)
      setSelectedService('')
      setAppointmentDate('')
      setAppointmentTime('')
      setCustomerName('')
      setCustomerEmail('')
      setCustomerPhone('')
      setNotes('')

      setTimeout(() => setBookingSuccess(false), 5000)
    } catch (err) {
      console.error('[v0] Booking error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground text-lg">Loading booking information...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 border-border bg-card">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-center text-foreground mb-2">Business Not Found</h1>
          <p className="text-center text-muted-foreground">{error || 'Unable to load business information'}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground py-12 md:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            {business.logo && (
              <img src={business.logo} alt={business.name} className="w-14 h-14 rounded-lg object-cover shadow-lg" />
            )}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-balance">{business.name}</h1>
              <p className="text-primary-foreground/85 text-lg mt-1">{business.category}</p>
            </div>
          </div>
          {business.description && (
            <p className="text-primary-foreground/90 text-lg max-w-2xl mt-4">{business.description}</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Business Info Sidebar */}
          <div className="md:col-span-1 space-y-6">
            {/* Contact Card */}
            <Card className="border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-foreground mb-4">Contact Information</h2>
              
              {business.phone && (
                <div className="flex items-start gap-3 mb-4">
                  <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a href={`tel:${business.phone}`} className="text-foreground font-medium hover:text-primary transition-colors">
                      {business.phone}
                    </a>
                  </div>
                </div>
              )}

              {business.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="text-foreground font-medium">{business.address}</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Services Card */}
            <Card className="border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4">Services</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {services.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No services available</p>
                ) : (
                  services.map(service => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedService === service.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-card/50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-foreground">{service.name}</p>
                        <p className="text-sm font-semibold text-primary">Rs. {service.price}</p>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {service.duration} min
                      </p>
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="md:col-span-2">
            <Card className="border-border bg-card shadow-lg overflow-hidden">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 px-8 py-6 text-primary-foreground">
                <h2 className="text-3xl font-bold text-balance">Book Your Appointment</h2>
                <p className="text-primary-foreground/80 mt-2">No registration required. We&apos;ll send you a confirmation email.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {/* Success Message */}
                {bookingSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-900">Booking Confirmed!</p>
                      <p className="text-sm text-emerald-700 mt-1">Check your email for confirmation details.</p>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-destructive text-sm">{error}</p>
                  </div>
                )}

                {/* Service Selection Reminder */}
                {!selectedService && (
                  <div className="p-4 bg-secondary/20 border border-secondary/40 rounded-lg flex items-center gap-2 text-sm text-foreground">
                    <AlertCircle className="w-4 h-4" />
                    Please select a service from the list
                  </div>
                )}

                {/* Personal Information Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Your Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="bg-background border-border text-foreground"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email Address *</label>
                    <Input
                      type="email"
                      placeholder="your.email@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="bg-background border-border text-foreground"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Phone Number *</label>
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="bg-background border-border text-foreground"
                      required
                    />
                  </div>
                </div>

                {/* Appointment Section */}
                <div className="border-t border-border pt-6 space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Select Date & Time
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Date *</label>
                      <Input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="bg-background border-border text-foreground"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Time *</label>
                      <Input
                        type="time"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="bg-background border-border text-foreground"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="border-t border-border pt-6">
                  <label className="block text-sm font-medium text-foreground mb-2">Additional Notes</label>
                  <textarea
                    placeholder="Any special requests or additional information..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={submitting || !selectedService || !appointmentDate || !appointmentTime}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 font-semibold text-lg rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      Confirm Booking
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
