'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { bookingsApi, staffApi, type Staff } from '@/lib/api'
import { Calendar, Loader, AlertCircle, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useBusinessId } from '@/hooks/useBusinessId'

interface Booking {
  id: string
  customerName: string
  customerEmail?: string
  serviceId: string
  customerPhone?: string
  service?: { name: string; price: number }
  startTime: string
  endTime: string
  status: string
  notes?: string
  staff?: { firstName: string; lastName: string }
}

type StatusFilter = 'ALL' | 'UNVERIFIED' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
type RangeFilter = 'today' | 'tomorrow' | 'week' | 'nextWeek' | 'month'

const STATUS_FILTERS: StatusFilter[] = ['ALL', 'UNVERIFIED', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

// Statuses the backend endpoint actually validates/accepts as a `status` query param.
// Anything else must be filtered on the client (the server ignores unknown values
// and returns everything, which is what made the filters look broken).
const SERVER_SUPPORTED: StatusFilter[] = ['PENDING', 'CONFIRMED', 'CANCELLED']

const PAGE_SIZE = 10

export default function BookingsPage() {
  const { businessId, loading: fetchingBusinessId, error: businessIdError } = useBusinessId()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStaffId, setFilterStaffId] = useState<string>('ALL')
  const [filterRange, setFilterRange] = useState<RangeFilter>('week')
  const [staff, setStaff] = useState<Staff[]>([])
  const [page, setPage] = useState(1)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [hasMore, setHasMore] = useState(false)

  const getDateRange = () => {
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

  useEffect(() => {
    if (businessId) {
      loadBookings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterStatus, filterStaffId, filterRange, businessId])

  useEffect(() => {
    if (businessId) {
      staffApi
        .getBusinessStaff(businessId)
        .then((response) => setStaff(response.data?.staff || []))
        .catch(() => setStaff([]))
    }
  }, [businessId])

  const loadBookings = async () => {
    if (!businessId) return
    try {
      setLoading(true)
      setError(null)
      const { startDate, endDate } = getDateRange()
      const staffParam = filterStaffId !== 'ALL' ? filterStaffId : undefined

      // Only send `status` when the backend actually supports it. For UNVERIFIED /
      // COMPLETED / ALL we fetch broadly and narrow on the client below.
      const statusParam = SERVER_SUPPORTED.includes(filterStatus) ? filterStatus : undefined

      const response = await bookingsApi.getBusinessBookings(
        businessId,
        page,
        PAGE_SIZE,
        statusParam,
        startDate,
        endDate,
        staffParam
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
      // Fix: derive hasMore from the data we JUST fetched, not stale state.
      setHasMore(fetched.length === PAGE_SIZE)
    } catch (err) {
      console.error('[v0] Error loading bookings:', err)
      setError('Error loading bookings')
      setBookings([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  // Final client-side guard so the displayed rows ALWAYS match the selected filter,
  // even for statuses the server can't filter (UNVERIFIED, COMPLETED) or when it
  // ignores an unknown value and returns everything.
  const visibleBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return bookings.filter((b) => {
      const statusMatch =
        filterStatus === 'ALL' || (b.status || '').toUpperCase() === filterStatus
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
        setBookings((prev) =>
          prev.map((b) => (b.id === selectedBookingId ? { ...b, status: newStatus } : b))
        )
      } else {
        setUpdateError(response.error || 'Failed to update booking status')
      }
    } catch (err) {
      setUpdateError('Error updating booking status')
      console.error('[v0] Error updating status:', err)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Sidebar userRole="BUSINESS_OWNER" />

      <main className="min-h-screen px-4 pb-8 pt-20 sm:px-6 md:ml-64 md:px-8 md:pt-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Bookings' },
          ]}
        />

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Bookings</h1>
            <p className="text-slate-500">Manage all customer bookings</p>
          </div>
        </div>

        {/* Status Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilterStatus(status)
                setPage(1)
              }}
            >
              {status}
            </Button>
          ))}
        </div>

        <Card className="mb-6 border-slate-200 bg-white/80 p-4 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
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
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Staff member
              </label>
              <select
                value={filterStaffId}
                onChange={(event) => {
                  setFilterStaffId(event.target.value)
                  setPage(1)
                }}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
              >
                <option value="ALL">All staff</option>
                {staff.map((member) => (
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
                onChange={(event) => {
                  setFilterRange(event.target.value as RangeFilter)
                  setPage(1)
                }}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
              >
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="week">Last 7 days</option>
                <option value="nextWeek">Next 7 days</option>
                <option value="month">Last 30 days</option>
              </select>
            </div>
            <div className="flex items-end">
              <Link
                href="/dashboard/staff/performance"
                className="text-sm font-semibold text-blue-700 hover:underline"
              >
                View staff performance
              </Link>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-900">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : visibleBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg font-medium">No bookings found</p>
            <p className="text-slate-500 text-sm">
              {filterStatus === 'ALL'
                ? 'Try a different date range'
                : `No ${filterStatus.toLowerCase()} bookings in this range`}
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Service</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date & Time</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Staff</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Amount</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {visibleBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{booking.customerName}</p>
                          <p className="text-sm text-slate-500">{booking.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{booking.customerPhone || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-900">{booking.service?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-900">
                        {new Date(booking.startTime).toLocaleDateString()}
                        <br />
                        <span className="text-sm text-slate-500">
                          {new Date(booking.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {booking.staff ? `${booking.staff.firstName} ${booking.staff.lastName}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        Rs.{booking.service?.price || 0}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => {
                                  setSelectedBookingId(booking.id)
                                  setNewStatus(
                                    booking.status === 'PENDING'
                                      ? 'CONFIRMED'
                                      : booking.status === 'CONFIRMED'
                                        ? 'COMPLETED'
                                        : null
                                  )
                                }}
                                title={booking.status === 'PENDING' ? 'Confirm booking' : 'Mark as completed'}
                              >
                                {booking.status === 'PENDING'
                                  ? 'Confirm'
                                  : booking.status === 'CONFIRMED'
                                    ? 'Complete'
                                    : null}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedBookingId(booking.id)
                                  setNewStatus('CANCELLED')
                                }}
                                title="Cancel booking"
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Pagination */}
        {!loading && visibleBookings.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Update Booking Status</h2>

              {updateError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-900">
                  {updateError}
                </div>
              )}

              <p className="text-slate-600 mb-6">
                Are you sure you want to change the status to <strong>{newStatus}</strong>?
                <br />
                The booking status will be updated without sending a customer email.
              </p>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedBookingId(null)
                    setNewStatus(null)
                    setUpdateError('')
                  }}
                  disabled={updatingStatus}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleUpdateStatus}
                  disabled={updatingStatus}
                >
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
