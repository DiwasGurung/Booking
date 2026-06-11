'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loader, CheckCircle, AlertCircle, Calendar, Clock, User, Mail, Phone } from 'lucide-react'

interface Business {
  id: string
  name: string
  description?: string
  logo?: string
  category: string
  phone: string
  email: string
  address: string
  city: string
}

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
}

export default function PublicBookingPage() {
  const params = useParams()
  const businessId = params.businessId as string

  const [business, setBusiness] = useState<Business | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [selectedService, setSelectedService] = useState<string>('')
  const [appointmentDate, setAppointmentDate] = useState<string>('')
  const [appointmentTime, setAppointmentTime] = useState<string>('')
  const [customerName, setCustomerName] = useState<string>('')
  const [customerEmail, setCustomerEmail] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // Load business and services
  useEffect(() => {
    loadBusinessData()
  }, [businessId])

  async function loadBusinessData() {
    try {
      setLoading(true)
      setError(null)

      // Fetch business details
      const businessRes = await fetch(`/api/businesses/${businessId}`)
      if (!businessRes.ok) throw new Error('Business not found')
      const businessData = await businessRes.json()
      setBusiness(businessData.data)

      // Fetch services for this business
      const servicesRes = await fetch(`/api/services?businessId=${businessId}`)
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(servicesData.data || [])
      }
    } catch (err) {
      console.error('[v0] Error loading business:', err)
      setError('Failed to load booking information. Please try again.')
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

      // Combine date and time
      const startTime = new Date(`${appointmentDate}T${appointmentTime}`)
      const selectedServiceObj = services.find(s => s.id === selectedService)
      const endTime = new Date(startTime.getTime() + (selectedServiceObj?.duration || 60) * 60000)

      // Create booking - call backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/booking/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          serviceId: selectedService,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          customerName,
          customerEmail,
          customerPhone,
          notes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create booking')
      }

      setBookingSuccess(true)
      // Reset form
      setSelectedService('')
      setAppointmentDate('')
      setAppointmentTime('')
      setCustomerName('')
      setCustomerEmail('')
      setCustomerPhone('')
      setNotes('')

      // Hide success message after 5 seconds
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading booking information...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Business Not Found</h1>
          <p className="text-slate-600">The business you're looking for does not exist.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Business Header */}
        <Card className="mb-6 p-6 bg-white border-0 shadow-lg">
          <div className="flex items-start gap-4">
            {business.logo && (
              <img 
                src={business.logo} 
                alt={business.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900">{business.name}</h1>
              <p className="text-slate-600 mt-1">{business.category}</p>
              {business.description && (
                <p className="text-slate-700 mt-2">{business.description}</p>
              )}
              <div className="flex gap-4 mt-3 text-sm text-slate-600">
                <a href={`tel:${business.phone}`} className="hover:text-blue-600">
                  {business.phone}
                </a>
                <a href={`mailto:${business.email}`} className="hover:text-blue-600">
                  {business.email}
                </a>
              </div>
            </div>
          </div>
        </Card>

        {/* Booking Form */}
        <Card className="bg-white shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">Book an Appointment</h2>
            <p className="text-blue-100 text-sm mt-1">Fill in your details to schedule a booking</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Success Message */}
            {bookingSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Booking Confirmed!</p>
                  <p className="text-sm text-green-700 mt-1">
                    A confirmation email has been sent to {customerEmail}. We'll follow up with you soon.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Service Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Select Service *
              </label>
              {services.length === 0 ? (
                <p className="text-slate-600 text-sm">No services available</p>
              ) : (
                <div className="space-y-2">
                  {services.map(service => (
                    <label key={service.id} className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-blue-50 cursor-pointer">
                      <input
                        type="radio"
                        name="service"
                        value={service.id}
                        checked={selectedService === service.id}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="ml-3 flex-1">
                        <p className="font-medium text-slate-900">{service.name}</p>
                        <p className="text-sm text-slate-600">{service.duration} mins • ${service.price.toFixed(2)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date *
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Time *
                </label>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Full Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email *
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone *
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or information..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting || !selectedService}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Confirming Booking...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>

            <p className="text-xs text-slate-600 text-center">
              No registration required. We'll send a confirmation email with all the details.
            </p>
          </form>
        </Card>
      </div>
    </div>
  )
}
