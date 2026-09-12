'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'
import { useBusinessId } from '@/hooks/useBusinessId'
import { servicesApi, staffApi, bookingsApi, type Service, type Staff } from '@/lib/api'

export default function NewManualBookingPage() {
    const router = useRouter()
    const { businessId, loading: fetchingBusinessId } = useBusinessId()

    const [services, setServices] = useState<Service[]>([])
    const [staffMembers, setStaffMembers] = useState<Staff[]>([])
    const [loadingOptions, setLoadingOptions] = useState(true)

    const [serviceId, setServiceId] = useState('')
    const [staffId, setStaffId] = useState('') // '' = unassigned
    const [customerName, setCustomerName] = useState('')
    const [customerEmail, setCustomerEmail] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [notes, setNotes] = useState('')

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!businessId) return
            ; (async () => {
                try {
                    setLoadingOptions(true)
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
                    setError('Failed to load services and staff.')
                } finally {
                    setLoadingOptions(false)
                }
            })()
    }, [businessId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!businessId || !serviceId || !customerName || !date || !time) {
            setError('Please fill in service, customer name, date, and time.')
            return
        }

        try {
            setSubmitting(true)
            const startTime = new Date(`${date}T${time}:00`).toISOString()

            const response = await bookingsApi.createManualBooking({
                businessId,
                serviceId,
                staffId: staffId || undefined,
                customerName,
                customerEmail: customerEmail || undefined,
                customerPhone: customerPhone || undefined,
                startTime,
                notes: notes || undefined,
            })

            if (!response.success) {
                setError(response.error || 'Failed to create booking')
                return
            }

            router.push('/dashboard/bookings')

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
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
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

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Add Booking</h1>
                    <p className="text-slate-500">Create a booking on behalf of a customer</p>
                </div>

                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                        <p className="text-red-900">{error}</p>
                    </div>
                )}

                <Card className="max-w-2xl p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <Label htmlFor="serviceId">Service *</Label>
                            <select
                                id="serviceId"
                                value={serviceId}
                                onChange={(e) => setServiceId(e.target.value)}
                                required
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
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
                            <Label htmlFor="staffId">Staff (optional)</Label>
                            <select
                                id="staffId"
                                value={staffId}
                                onChange={(e) => setStaffId(e.target.value)}
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                            >
                                <option value="">Unassigned</option>
                                {staffMembers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.firstName} {s.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="date">Date *</Label>
                                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                            </div>
                            <div>
                                <Label htmlFor="time">Time *</Label>
                                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-5">
                            <h3 className="mb-3 text-sm font-semibold text-slate-900">Customer details</h3>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="customerName">Name *</Label>
                                    <Input
                                        id="customerName"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Customer name"
                                        required
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

                        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                            <Button type="button" variant="outline" onClick={() => router.push('/dashboard/bookings')}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                                {submitting ? 'Creating...' : 'Create Booking'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </main>
        </div>
    )
}