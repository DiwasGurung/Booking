'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { BranchSelector } from '@/components/BranchSelector'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { bookingsApi, staffApi, type Staff } from '@/lib/api'
import { Calendar, Loader, AlertCircle, Search, X, Download, Bell, Plus } from 'lucide-react'
import Link from 'next/link'
import { useBusinessId } from '@/hooks/useBusinessId'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useBranches } from '@/context/branchContext'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Booking {
  id: string
  customerName: string
  customerEmail?: string
  serviceId: string
  customerPhone?: string
  service?: { name: string; price: number; offerPrice?: number | null }
  price: number
  startTime: string
  endTime: string
  status: string
  notes?: string
  staff?: { firstName: string; lastName: string }
  branch?: { id?: string; name: string } | null
}

type StatusFilter = 'ALL' | 'UNVERIFIED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
type RangeFilter = 'ALL' | 'today' | 'tomorrow' | 'week' | 'nextWeek' | 'month'

const STATUS_FILTERS: StatusFilter[] = ['ALL', 'UNVERIFIED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
const SERVER_SUPPORTED: StatusFilter[] = ['UNVERIFIED', 'COMPLETED', 'CONFIRMED', 'CANCELLED']
const PAGE_SIZE = 10

export default function BookingsPage() {
  const { businessId } = useBusinessId()
  const { hasMultipleBranches, branchParam, selectedBranchId, branches } = useBranches()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const { subscriptionStatus, hasValidSubscription } = useSubscriptionStatus()
  const planName = (subscriptionStatus?.planName || '').toUpperCase()

  const canExportBookings = hasValidSubscription && ['PROFESSIONAL', 'ENTERPRISE'].includes(planName)
  const isEnterprisePlan = planName === 'ENTERPRISE'
  const isProPlan = planName === 'PRO' || planName === 'PROFESSIONAL'
  const canSendReminders = hasValidSubscription && (isEnterprisePlan || isProPlan)

  const [sendingReminders, setSendingReminders] = useState(false)
  const [reminderMessage, setReminderMessage] = useState<string | null>(null)
  const [reminderError, setReminderError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStaffId, setFilterStaffId] = useState<string>('ALL')
  const [filterRange, setFilterRange] = useState<RangeFilter>('ALL')
  const [staff, setStaff] = useState<Staff[]>([])
  const [page, setPage] = useState(1)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [hasRemindableBookings, setHasRemindableBookings] = useState(true)

  const selectedBranchName =
    selectedBranchId !== 'ALL' ? branches.find((b) => b.id === selectedBranchId)?.name : null

  // Reminders are sent business-wide by the backend, so this probe is intentionally NOT branch-filtered.
  const checkRemindableBookings = async () => {
    if (!businessId) return
    try {
      const now = new Date()
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(now)
      endOfDay.setHours(23, 59, 59, 999)

      const response = await bookingsApi.getBusinessBookings(
        businessId, 1, 100, 'CONFIRMED',
        startOfDay.toISOString(), endOfDay.toISOString(), undefined
      )

      if (!response.success) {
        setHasRemindableBookings(true)
        return
      }

      const fetched: Booking[] = Array.isArray(response.data)
        ? (response.data as Booking[])
        : ((response.data as any)?.bookings ?? [])

      setHasRemindableBookings(fetched.filter((b) => new Date(b.startTime) > now).length > 0)
    } catch {
      setHasRemindableBookings(true)
    }
  }

  useEffect(() => {
    if (!businessId || !canSendReminders) return
    checkRemindableBookings()
    const interval = setInterval(checkRemindableBookings, 60 * 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, canSendReminders])

  const downloadBookingsPdf = () => {
    if (!canExportBookings || visibleBookings.length === 0) return

    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Bookings', 14, 18)
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(
      `${selectedBranchName ? `${selectedBranchName} · ` : ''}Filtered bookings · ${new Date().toLocaleDateString()}`,
      14, 24
    )

    const head = ['Customer', 'Email', 'Phone', 'Service']
    if (hasMultipleBranches) head.push('Branch')
    head.push('Date & Time', 'Status', 'Amount')

    autoTable(doc, {
      startY: 30,
      head: [head],
      body: visibleBookings.map((booking) => {
        const row = [
          booking.customerName || 'N/A',
          booking.customerEmail || 'N/A',
          booking.customerPhone || 'N/A',
          booking.service?.name || 'N/A',
        ]
        if (hasMultipleBranches) row.push(booking.branch?.name || 'N/A')
        row.push(
          new Date(booking.startTime).toLocaleString(),
          booking.status,
          `Rs. ${(booking.service?.offerPrice ?? booking.service?.price ?? 0).toFixed(2)}`
        )
        return row
      }),
      headStyles: { fillColor: [241, 245, 249], textColor: 20, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      theme: 'grid',
    })

    doc.save(`bookings-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const getDateRange = () => {
    if (filterRange === 'ALL') return { startDate: null, endDate: null }
    const end = new Date()
    const start = new Date(end)
    if (filterRange === 'today') {
      start.setHours(0, 0, 0, 0)
    } else if (filterRange === 'tomorrow') {
      start.setDate(end.getDate() + 1)
      start.setHours(0, 0, 0, 0)
      end.setDate(end.getDate() + 1)
    } else if (filterRange === 'week') {
      start.setDate(end.getDate() - 7)
    } else if (filterRange === 'nextWeek') {
      start.setDate(end.getDate() + 1)
      end.setDate(end.getDate() + 7)
    } else if (filterRange === 'month') {
      start.setDate(end.getDate() - 30)
    }
    end.setHours(23, 59, 59, 999)
    return { startDate: start.toISOString(), endDate: end.toISOString() }
  }

  // A different branch means a different result set: go back to page 1 and clear the staff filter
  useEffect(() => {
    setPage(1)
    setFilterStaffId('ALL')
  }, [branchParam])

  useEffect(() => {
    if (businessId) loadBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterStatus, filterStaffId, filterRange, businessId, branchParam])

  useEffect(() => {
    if (businessId) {
      staffApi
        .getBusinessStaff(businessId)
        .then((response) => setStaff(response.data?.staff || []))
        .catch(() => setStaff([]))
    }
  }, [businessId])

  // Staff dropdown only lists people who work at the selected branch (staff with no branch work anywhere)
  const staffOptions = useMemo(
    () => staff.filter((s) => !branchParam || !s.branchId || s.branchId === branchParam),
    [staff, branchParam]
  )

  const [remindersSentToday, setRemindersSentToday] = useState(false)

  const handleSendReminders = async () => {
    if (!businessId || !canSendReminders || sendingReminders || remindersSentToday) return

    try {
      setSendingReminders(true)
      setReminderMessage(null)
      setReminderError(false)

      const response = await bookingsApi.sendTodayReminders(businessId)

      if (response.success) {
        const { count, channel } = response.data!
        setReminderMessage(`Reminders sent to ${count} customers via ${channel === 'sms' ? 'SMS' : 'email'}.`)
        if (count > 0) setRemindersSentToday(true)
      } else if (response.error?.toLowerCase().includes('already sent today')) {
        setReminderError(true)
        setReminderMessage(response.error)
        setRemindersSentToday(true)
      } else {
        setReminderError(true)
        setReminderMessage(response.error || 'Failed to send reminders')
      }
    } catch (err) {
      setReminderError(true)
      setReminderMessage('Error sending reminders')
    } finally {
      setSendingReminders(false)
    }
  }

  const loadBookings = async () => {
    if (!businessId) return
    try {
      setLoading(true)
      setError(null)
      const { startDate, endDate } = getDateRange()
      const staffParam = filterStaffId !== 'ALL' ? filterStaffId : undefined
      const statusParam = SERVER_SUPPORTED.includes(filterStatus) ? filterStatus : undefined

      const response = await bookingsApi.getBusinessBookings(
        businessId,
        page,
        PAGE_SIZE,
        statusParam,
        startDate || undefined,
        endDate || undefined,
        staffParam,
        branchParam // undefined = all branches
      )

      if (!response.success) {
        setError(response.error || 'Failed to load bookings')
        setBookings([])
        setHasMore(false)
        return
      }

      const fetched: Booking[] = Array.isArray(response.data)
        ? (response.data as Booking[])
        : ((response.data as any)?.bookings ?? [])

      setBookings(fetched)
      setHasMore(fetched.length === PAGE_SIZE)
    } catch (err) {
      setError('Error loading bookings')
      setBookings([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  const visibleBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return bookings.filter((b) => {
      const statusMatch = filterStatus === 'ALL' || (b.status || '').toUpperCase() === filterStatus
      const nameMatch = query === '' || (b.customerName || '').toLowerCase().includes(query)
      return statusMatch && nameMatch
    })
  }, [bookings, filterStatus, searchQuery])

  const handleUpdateStatus = async () => {
    if (!selectedBookingId || !newStatus) return
    try {
      setUpdatingStatus(true)
      setUpdateError('')
      const response = await bookingsApi.updateBookingStatus(selectedBookingId, newStatus)
      if (response.success) {
        setBookings((prev) => prev.map((b) => (b.id === selectedBookingId ? { ...b, status: newStatus } : b)))
      } else {
        setUpdateError(response.error || 'Failed to update booking status')
      }
    } catch (err) {
      setUpdateError('Error updating booking status')
    } finally {
      setSelectedBookingId(null)
      setNewStatus(null)
      setUpdatingStatus(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      UNVERIFIED: 'bg-orange-100 text-orange-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const BookingActions = ({ booking }: { booking: Booking }) => {
    if (booking.status === 'UNVERIFIED') {
      return (
        <>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => { setSelectedBookingId(booking.id); setNewStatus('CONFIRMED') }}
            title="Confirm booking"
          >
            Confirm
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => { setSelectedBookingId(booking.id); setNewStatus('CANCELLED') }}
            title="Cancel booking"
          >
            Cancel
          </Button>
        </>
      )
    }
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') return null
    return (
      <>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => {
            setSelectedBookingId(booking.id)
            setNewStatus(
              booking.status === 'PENDING' ? 'CONFIRMED' : booking.status === 'CONFIRMED' ? 'COMPLETED' : null
            )
          }}
          title={booking.status === 'PENDING' ? 'Confirm booking' : 'Mark as completed'}
        >
          {booking.status === 'PENDING' ? 'Confirm' : booking.status === 'CONFIRMED' ? 'Complete' : null}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => { setSelectedBookingId(booking.id); setNewStatus('CANCELLED') }}
          title="Cancel booking"
        >
          Cancel
        </Button>
      </>
    )
  }

  const BookingAmount = ({ booking }: { booking: Booking }) => <span>Rs.{booking.price.toFixed(2)}</span>

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Sidebar userRole="BUSINESS_OWNER" />

      <main className="min-h-screen px-4 pb-8 pt-20 sm:px-6 md:ml-64 md:px-8 md:pt-8">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Bookings' }]} />

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Bookings</h1>
            <p className="text-slate-500">
              {selectedBranchName ? `Bookings at ${selectedBranchName}` : 'Manage all customer bookings'}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link href="/dashboard/bookings/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Booking
              </Button>
            </Link>

            {canSendReminders && (
              <Button
                onClick={handleSendReminders}
                disabled={sendingReminders || remindersSentToday || !hasRemindableBookings}
                variant="outline"
                className="w-full sm:w-auto"
                title={
                  !hasRemindableBookings
                    ? 'No confirmed bookings remaining today'
                    : hasMultipleBranches
                      ? 'Sends reminders for all branches'
                      : undefined
                }
              >
                <Bell className="mr-2 h-4 w-4" />
                {sendingReminders
                  ? 'Sending...'
                  : remindersSentToday
                    ? 'Reminders Sent Today'
                    : !hasRemindableBookings
                      ? 'No Bookings Left Today'
                      : "Remind Today's Customers"}
              </Button>
            )}

            {canExportBookings && (
              <Button
                onClick={downloadBookingsPdf}
                disabled={loading || visibleBookings.length === 0}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>
        </div>

        {reminderMessage && (
          <div
            className={`mb-6 rounded-lg border p-3 text-sm ${
              reminderError ? 'border-red-200 bg-red-50 text-red-900' : 'border-green-200 bg-green-50 text-green-900'
            }`}
          >
            {reminderMessage}
            {!reminderError && hasMultipleBranches && ' (all branches)'}
          </div>
        )}

        {/* Status Filters */}
        <div className="mb-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {STATUS_FILTERS.map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              className="shrink-0"
              onClick={() => { setFilterStatus(status); setPage(1) }}
            >
              {status}
            </Button>
          ))}
        </div>

        <Card className="mb-6 border-slate-200 bg-white/80 p-4 shadow-sm">
          <div className={`grid gap-3 sm:grid-cols-2 ${hasMultipleBranches ? 'lg:grid-cols-3' : ''}`}>
            <div className={hasMultipleBranches ? 'sm:col-span-2 lg:col-span-3' : 'sm:col-span-2'}>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search customer
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by customer name..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {hasMultipleBranches && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Branch
                </label>
                <BranchSelector />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Staff member
              </label>
              <select
                value={filterStaffId}
                onChange={(event) => { setFilterStaffId(event.target.value); setPage(1) }}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
              >
                <option value="ALL">All staff</option>
                {staffOptions.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date range
              </label>
              <select
                value={filterRange}
                onChange={(event) => { setFilterRange(event.target.value as RangeFilter); setPage(1) }}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
              >
                <option value="ALL">All Time</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="week">Last 7 days</option>
                <option value="nextWeek">Next 7 days</option>
                <option value="month">Last 30 days</option>
              </select>
            </div>
            <div className={`flex items-end ${hasMultipleBranches ? 'sm:col-span-2 lg:col-span-3' : 'sm:col-span-2'}`}>
              <Link href="/dashboard/staff/performance" className="text-sm font-semibold text-blue-700 hover:underline">
                View staff performance
              </Link>
            </div>
          </div>
        </Card>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <p className="text-red-900">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : visibleBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-600">No bookings found</p>
            <p className="text-sm text-slate-500">
              {filterStatus === 'ALL'
                ? selectedBranchName
                  ? `No bookings at ${selectedBranchName} for this range`
                  : 'Try a different date range'
                : `No ${filterStatus.toLowerCase()} bookings in this range`}
            </p>
          </Card>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {visibleBookings.map((booking) => (
                <Card key={booking.id} className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{booking.customerName}</p>
                      {booking.customerEmail && (
                        <p className="truncate text-sm text-slate-500">{booking.customerEmail}</p>
                      )}
                    </div>
                    <Badge className={`shrink-0 ${getStatusColor(booking.status)}`}>{booking.status}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Service</p>
                      <p className="text-slate-900">{booking.service?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Amount</p>
                      <p className="text-slate-900">Rs.{booking.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Date & time</p>
                      <p className="text-slate-900">
                        {new Date(booking.startTime).toLocaleDateString()}{' '}
                        {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Staff</p>
                      <p className="text-slate-900">
                        {booking.staff ? `${booking.staff.firstName} ${booking.staff.lastName}` : 'N/A'}
                      </p>
                    </div>
                    {hasMultipleBranches && (
                      <div className="col-span-2">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Branch</p>
                        <p className="text-slate-900">{booking.branch?.name || 'N/A'}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Phone</p>
                      <p className="text-slate-900">{booking.customerPhone || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <BookingActions booking={booking} />
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop table */}
            <Card className="hidden overflow-hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Customer</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Phone</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Service</th>
                      {hasMultipleBranches && (
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Branch</th>
                      )}
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date & Time</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Staff</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Amount</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {visibleBookings.map((booking) => (
                      <tr key={booking.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900">{booking.customerName}</p>
                            <p className="text-sm text-slate-500">{booking.customerEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{booking.customerPhone || 'N/A'}</td>
                        <td className="px-6 py-4 text-slate-900">{booking.service?.name || 'N/A'}</td>
                        {hasMultipleBranches && (
                          <td className="px-6 py-4 text-sm text-slate-700">{booking.branch?.name || 'N/A'}</td>
                        )}
                        <td className="px-6 py-4 text-slate-900">
                          {new Date(booking.startTime).toLocaleDateString()}
                          <br />
                          <span className="text-sm text-slate-500">
                            {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {booking.staff ? `${booking.staff.firstName} ${booking.staff.lastName}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <BookingAmount booking={booking} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <BookingActions booking={booking} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* Pagination */}
        {!loading && visibleBookings.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={!hasMore}>
              Next
            </Button>
          </div>
        )}

        {/* Status Update Confirmation Modal */}
        {selectedBookingId && newStatus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md p-6">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Update Booking Status</h2>

              {updateError && (
                <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                  {updateError}
                </div>
              )}

              <p className="mb-6 text-slate-600">
                Are you sure you want to change the status to <strong>{newStatus}</strong>?
                <br />
                The booking status will be updated without sending a customer email.
              </p>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => { setSelectedBookingId(null); setNewStatus(null); setUpdateError('') }}
                  disabled={updatingStatus}
                >
                  Cancel
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleUpdateStatus} disabled={updatingStatus}>
                  {updatingStatus ? 'Updating...' : 'Confirm'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}