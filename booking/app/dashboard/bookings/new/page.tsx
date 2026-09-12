'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Loader, CalendarPlus, Clock, User, Sparkles } from 'lucide-react'
import { useBusinessId } from '@/hooks/useBusinessId'
import { servicesApi, staffApi, bookingsApi, type Service, type Staff } from '@/lib/api'

const extractHHMM = (slot: string): string => {
  if (slot.includes('T')) {
    const d = new Date(slot)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return slot.slice(0, 5)
}

const formatTimeDisplay = (hhmm: string): string => {
  if (!hhmm || !hhmm.includes(':')) return hhmm
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayHour = h % 12 || 12
  return `${displayHour}:${String(m).padStart(2, '0')} ${period}`
}

const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function NewManualBookingPage() {
  const router = useRouter()
  const { businessId, loading: fetchingBusinessId } = useBusinessId()

  const [services, setServices] = useState<Service[]>([])
  const [staffMembers, setStaffMembers] = useState<Staff[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [serviceId, setServiceId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [touchedSubmit, setTouchedSubmit] = useState(false)

  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState('')

  const selectedService = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId])
  const selectedStaff = useMemo(() => staffMembers.find((s) => s.id === staffId), [staffMembers, staffId])

  useEffect(() => {
    if (!businessId) return
    ;(async () => {
      try {
        setLoadingOptions(true)
        setLoadError('')
        const [servicesRes, staffRes] = await Promise.all([
          servicesApi.getBusinessServices(businessId),
          staffApi.getBusinessStaff(businessId),
        ])

        const serviceList: Service[] = Array.isArray(servicesRes.data)
          ? servicesRes.data
          : (servicesRes.data as any)?.services || (servicesRes.data as any)?.data || []
        setServices(serviceList)
        if (serviceList.length > 0) setServiceId(serviceList[0].id)

        setStaffMembers(staffRes.data?.staff || [])
      } catch {
        setLoadError('Failed to load services and staff.')
      } finally {
        setLoadingOptions(false)
      }
    })()
  }, [businessId])

  useEffect(() => {
    if (!businessId || !serviceId || !date) {
      setAvailableSlots([])
      setSlotsError('')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        setLoadingSlots(true)
        setSlotsError('')
        const response = await bookingsApi.getBusinessAvailableSlots(
          businessId,
          serviceId,
          date,
          staffId || undefined
        )
        if (cancelled) return

        if (response.success && Array.isArray(response.data)) {
          setAvailableSlots(response.data)
        } else {
          setAvailableSlots([])
          setSlotsError(response.error || 'No open slots for this date')
        }
      } catch {
        if (!cancelled) {
          setAvailableSlots([])
          setSlotsError('Failed to load available times')
        }
      } finally {
        if (!cancelled) setLoadingSlots(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [businessId, serviceId, staffId, date])

  const missingFields = useMemo(() => {
    const missing: string[] = []
    if (!serviceId) missing.push('service')
    if (!customerName.trim()) missing.push('customer name')
    if (!date) missing.push('date')
    if (!time) missing.push('time')
    return missing
  }, [serviceId, customerName, date, time])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouchedSubmit(true)
    setError('')

    if (missingFields.length > 0 || !businessId) {
      setError(`Please fill in: ${missingFields.join(', ')}`)
      return
    }

    try {
      setSubmitting(true)
      const startTime = new Date(`${date}T${time}:00`).toISOString()

      const response = await bookingsApi.createManualBooking({
        businessId,
        serviceId,
        staffId: staffId || undefined,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        startTime,
        notes: notes.trim() || undefined,
      })

      if (!response.success) {
        setError(response.error || 'Failed to create booking')
        return
      }

      router.push('/dashboard/bookings')
    } catch {
      setError('Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  if (fetchingBusinessId || loadingOptions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Sidebar userRole="BUSINESS_OWNER" />
        <main className="min-h-screen px-4 pb-8 pt-20 sm:px-6 md:ml-64 md:px-8 md:pt-8">
          <div className="flex h-64 items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Sidebar userRole="BUSINESS_OWNER" />

      <main className="min-h-screen px-4 pb-8 pt-20 sm:px-6 md:ml-64 md:px-8 md:pt-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Bookings', href: '/dashboard/bookings' },
            { label: 'New Booking' },
          ]}
        />

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10">
            <CalendarPlus className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Add Booking</h1>
            <p className="text-slate-500">Create a booking on behalf of a customer</p>
          </div>
        </div>

        {loadError && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <p className="text-red-900">{loadError}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <p className="text-red-900">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              {/* Appointment details */}
              <Card className="border-slate-200 bg-white/80 p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  Appointment
                </h2>

                {services.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No services set up yet. Add a service before creating a booking.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="serviceId">Service *</Label>
                      <select
                        id="serviceId"
                        value={serviceId}
                        onChange={(e) => {
                          setServiceId(e.target.value)
                          setTime('')
                        }}
                        className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 ${
                          touchedSubmit && !serviceId ? 'border-red-400' : 'border-slate-200'
                        }`}
                      >
                        <option value="">Select a service</option>
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} — {s.duration} min — Rs.{(s.offerPrice ?? s.price).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="staffId">Staff</Label>
                      <select
                        id="staffId"
                        value={staffId}
                        onChange={(e) => {
                          setStaffId(e.target.value)
                          setTime('')
                        }}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                      >
                        <option value="">Any / unassigned</option>
                        {staffMembers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.firstName} {s.lastName}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1.5 text-xs text-slate-400">
                        Leave as "Any" to see combined open time across all staff for this service.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={date}
                          onChange={(e) => {
                            setDate(e.target.value)
                            setTime('')
                          }}
                          className={touchedSubmit && !date ? 'border-red-400' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Time *</Label>
                        <Input
                          id="time"
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className={touchedSubmit && !time ? 'border-red-400' : ''}
                        />
                      </div>
                    </div>
                    <p className="-mt-2 text-xs text-slate-400">
                      Pick a free slot from the panel, or type any time — manual bookings aren't restricted to open slots.
                    </p>
                  </div>
                )}
              </Card>

              {/* Customer details */}
              <Card className="border-slate-200 bg-white/80 p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <User className="h-4 w-4 text-blue-600" />
                  Customer details
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customerName">Name *</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer name"
                      className={touchedSubmit && !customerName.trim() ? 'border-red-400' : ''}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerPhone">Phone</Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special requests or information..."
                      rows={3}
                    />
                  </div>
                </div>
              </Card>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => router.push('/dashboard/bookings')}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || services.length === 0}
                  className="w-full sm:w-auto"
                >
                  {submitting ? 'Creating...' : 'Create Booking'}
                </Button>
              </div>
            </div>

            {/* Right rail */}
            <div className="space-y-6">
              {/* Live summary — builds as fields are filled */}
              {(selectedService || date || time || customerName) && (
                <Card className="border-blue-100 bg-blue-50/50 p-5">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Booking summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    {selectedService && (
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Service</span>
                        <span className="text-right font-medium text-slate-900">{selectedService.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Staff</span>
                      <span className="text-right font-medium text-slate-900">
                        {selectedStaff ? `${selectedStaff.firstName} ${selectedStaff.lastName}` : 'Any available'}
                      </span>
                    </div>
                    {date && (
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Date</span>
                        <span className="text-right font-medium text-slate-900">{formatDateDisplay(date)}</span>
                      </div>
                    )}
                    {time && (
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Time</span>
                        <span className="text-right font-medium text-slate-900">{formatTimeDisplay(time)}</span>
                      </div>
                    )}
                    {customerName && (
                      <div className="flex justify-between gap-2 border-t border-blue-100 pt-2">
                        <span className="text-slate-500">Customer</span>
                        <span className="text-right font-medium text-slate-900">{customerName}</span>
                      </div>
                    )}
                    {selectedService && (
                      <div className="flex justify-between gap-2 pt-1">
                        <span className="text-slate-500">Amount</span>
                        <span className="text-right font-semibold text-blue-700">
                          Rs.{(selectedService.offerPrice ?? selectedService.price).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Open times panel */}
              <Card className="border-slate-200 bg-white/80 p-5 shadow-sm">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Open times
                  </h3>
                  {availableSlots.length > 0 && (
                    <Badge className="bg-emerald-100 text-emerald-800">{availableSlots.length} open</Badge>
                  )}
                </div>
                <p className="mb-4 text-xs text-slate-500">
                  {!serviceId
                    ? 'Select a service to see free time.'
                    : !date
                      ? 'Pick a date to see free time.'
                      : staffId
                        ? "Based on this staff member's schedule and existing bookings."
                        : 'Combined across all staff who can perform this service.'}
                </p>

                {!serviceId || !date ? (
                  <div className="flex h-28 items-center justify-center text-sm text-slate-400">
                    No date selected
                  </div>
                ) : loadingSlots ? (
                  <div className="flex h-28 items-center justify-center gap-2 text-sm text-slate-500">
                    <Loader className="h-4 w-4 animate-spin" />
                    Checking availability...
                  </div>
                ) : slotsError ? (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    {slotsError}
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    No open slots found for this date.
                  </div>
                ) : (
                  <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1">
                    {availableSlots.map((slot, idx) => {
                      const hhmm = extractHHMM(slot)
                      const isSelected = time === hhmm
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTime(hhmm)}
                          className={`rounded-lg border-2 p-2 text-xs font-medium transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400'
                          }`}
                        >
                          {formatTimeDisplay(hhmm)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}