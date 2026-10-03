'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Clock, MapPin, Phone, CheckCircle, AlertCircle } from 'lucide-react'
import { usePublicBusiness } from '@/hooks/usePublicBusiness'

const API_URL = process.env.NEXT_PUBLIC_API_URL // e.g. https://api.appoint-nepal.com

/* ------------------------------------------------------------------ */
/* ADJUST THESE TWO CALLS to match your existing endpoints.            */
/* Both receive the REAL business id, never the slug.                  */
/* ------------------------------------------------------------------ */

// Expected result: array of "HH:mm" strings, or { slots: [...] } / { data: [...] }
async function fetchSlots(businessId: string, serviceId: string, date: string): Promise<string[]> {
  const qs = new URLSearchParams({ businessId, serviceId, date })
  const res = await fetch(`${API_URL}/api/bookings/availability?${qs}`)
  if (!res.ok) throw new Error('Could not load times')
  const data = await res.json()
  const list = Array.isArray(data) ? data : data.slots ?? data.data ?? []
  return list.map((s: any) => (typeof s === 'string' ? s : s.time ?? s.startTime))
}

async function createBooking(payload: {
  businessId: string
  serviceId: string
  startTime: string // ISO string
  customerName: string
  customerEmail: string
  customerPhone: string
  notes?: string
}) {
  const res = await fetch(`${API_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || data.error || 'Booking failed')
  return data
}

/* ------------------------------------------------------------------ */

interface Service {
  id: string
  name: string
  description?: string
  price: number
  offerPrice?: number | null
  duration: number
  capacity: number
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function todayISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export default function BookingPage() {
  const params = useParams()
  const identifier = params.businessId as string // slug or old id from the URL

  const { business, loading, notFound, error } = usePublicBusiness(identifier)

  // The REAL id. Use this everywhere instead of the URL param.
  const businessId: string | undefined = business?.id
  const services: Service[] = business?.services ?? []
  const hours: any[] = business?.hours ?? []

  const [serviceId, setServiceId] = useState<string | null>(null)
  const [date, setDate] = useState(todayISO())
  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId]
  )

  // Load available times once we have the real id, a service and a date
  useEffect(() => {
    if (!businessId || !serviceId || !date) return
    let cancelled = false
    setTime(null)
    setSlotsLoading(true)
    setSlotsError(null)
    fetchSlots(businessId, serviceId, date)
      .then((s) => !cancelled && setSlots(s))
      .catch((e) => {
        if (!cancelled) {
          setSlots([])
          setSlotsError(e.message)
        }
      })
      .finally(() => !cancelled && setSlotsLoading(false))
    return () => {
      cancelled = true
    }
  }, [businessId, serviceId, date])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId || !serviceId || !time) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await createBooking({
        businessId, // real id, not the slug
        serviceId,
        startTime: new Date(`${date}T${time}`).toISOString(),
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        notes: notes.trim() || undefined,
      })
      setDone(true)
    } catch (err: any) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------------- render states ---------------- */

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex h-screen items-center justify-center px-4 text-center">
        <p className="text-slate-600">This booking page doesn&apos;t exist or is no longer active.</p>
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="flex h-screen items-center justify-center px-4 text-center">
        <p className="text-slate-600">Something went wrong loading this page. Please refresh and try again.</p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center bg-white">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
          <h1 className="text-xl font-semibold text-slate-900">Booking received</h1>
          <p className="mt-2 text-sm text-slate-600">
            {selectedService?.name} at {business.name} on {new Date(`${date}T${time}`).toLocaleString()}.
            Check {email} to confirm your booking.
          </p>
        </Card>
      </div>
    )
  }

  const hoursByDay = [...hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
  const canSubmit = !!serviceId && !!time && name.trim() && email.trim() && phone.trim() && !submitting

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        {business.coverImage && (
          <img src={business.coverImage} alt="" className="h-40 w-full object-cover md:h-56" />
        )}
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-5">
          {business.logo && (
            <img
              src={business.logo}
              alt={`${business.name} logo`}
              className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-bold text-slate-900">{business.name}</h1>
              {business.isVerified && <Badge className="bg-green-600 text-white">Verified</Badge>}
            </div>
            {business.description && (
              <p className="mt-1 text-sm text-slate-600">{business.description}</p>
            )}
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {business.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[business.address, business.city].filter(Boolean).join(', ')}
                </span>
              )}
              {business.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {business.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">
          {/* 1. Service */}
          <Card className="p-4 md:p-6 bg-white">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Choose a service</h2>
            {services.length === 0 ? (
              <p className="text-sm text-slate-500">This business has no services available to book yet.</p>
            ) : (
              <div className="space-y-2">
                {services.map((s) => {
                  const selected = s.id === serviceId
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setServiceId(s.id)}
                      aria-pressed={selected}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{s.name}</p>
                          {s.description && <p className="text-xs text-slate-500">{s.description}</p>}
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {s.duration} min
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          {s.offerPrice ? (
                            <>
                              <p className="text-xs text-slate-400 line-through">Rs.{s.price.toFixed(2)}</p>
                              <p className="font-semibold text-green-700">Rs.{s.offerPrice.toFixed(2)}</p>
                            </>
                          ) : (
                            <p className="font-semibold text-slate-900">Rs.{s.price.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </Card>

          {/* 2. Date and time */}
          {serviceId && (
            <Card className="p-4 md:p-6 bg-white">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Pick a date and time</h2>
              <div className="mb-4 max-w-xs space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>

              {slotsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              ) : slotsError ? (
                <p className="flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  {slotsError}. Try another date.
                </p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-slate-500">No times available on this date. Try another day.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {slots.map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setTime(t)}
                      aria-pressed={time === t}
                      className={`rounded-md border px-2 py-2 text-sm transition-colors ${
                        time === t
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* 3. Your details */}
          {time && (
            <Card className="p-4 md:p-6 bg-white">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Your details</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>

                {submitError && (
                  <p className="flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    {submitError}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={!canSubmit}>
                  {submitting ? 'Booking...' : 'Confirm booking'}
                </Button>
              </div>
            </Card>
          )}
        </form>

        {/* Hours */}
        <aside>
          <Card className="p-4 md:p-6 bg-white">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Opening hours</h2>
            {hoursByDay.length === 0 ? (
              <p className="text-sm text-slate-500">Hours not listed.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {hoursByDay.map((h) => (
                  <li key={h.dayOfWeek} className="flex justify-between">
                    <span className="text-slate-700">{DAY_NAMES[h.dayOfWeek]}</span>
                    <span className="text-slate-500">{h.isClosed ? 'Closed' : `${h.openTime} - ${h.closeTime}`}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </main>
  )
}
