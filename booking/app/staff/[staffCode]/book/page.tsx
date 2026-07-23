'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Calendar, Clock, MapPin } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface StaffService {
  id: string
  name: string
  duration: number
  price: number
  description?: string
}

interface Staff {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  services: StaffService[]
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
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    email: '',
    phone: '',
    serviceId: '',
    date: '',
    time: '',
    notes: '',
  })

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
        if (data.services.length > 0) {
          setFormData((prev) => ({ ...prev, serviceId: data.services[0].id }))
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStaffInfo()
  }, [staffCode])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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

      const response = await fetch(`${API_URL}/api/booking/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: staff?.id,
          businessId: staff?.id, // Will be derived from staff
          customerId: '', // New customer
          serviceId: formData.serviceId,
          customerName: formData.customerName,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          startTime: `${formData.date}T${formData.time}`,
          notes: formData.notes,
          source: 'direct-staff-booking',
        }),
        credentials: 'include',
      })

      if (response.ok) {
        toast({
          title: 'Booking Confirmed!',
          description: 'Your appointment has been scheduled successfully',
        })
        setFormData({
          customerName: '',
          email: '',
          phone: '',
          serviceId: staff?.services[0]?.id || '',
          date: '',
          time: '',
          notes: '',
        })
      } else {
        const error = await response.json()
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
            <CardTitle className="text-2xl">
              Book an Appointment
            </CardTitle>
            <CardDescription>Schedule an appointment with {staff.firstName} {staff.lastName} at your convenience</CardDescription>
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
                    {staff.services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - Rs. {service.price} ({service.duration} min)
                      </option>
                    ))}
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
                    <Input
                      id="time"
                      name="time"
                      type="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      required
                    />
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
