'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { bookingsApi } from '@/lib/api'
import { Calendar, Loader, AlertCircle, Eye, Plus } from 'lucide-react'
import Link from 'next/link'
import { useBusinessId } from '@/hooks/useBusinessId'

// Define Booking interface
interface Booking {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  serviceId: string
  service?: { name: string; price: number; duration?: number }
  startTime: string
  endTime: string
  status: string
  isEmailVerified?: boolean
  notes?: string
  staff?: { firstName: string; lastName: string }
}

// Main component
export default function BookingsPage() {
  const router = useRouter()
  const { businessId, loading: fetchingBusinessId } = useBusinessId()

  // State variables
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [page, setPage] = useState(1)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [filterRange, setFilterRange] = useState<'today' | 'tomorrow' | 'week' | 'nextWeek' | 'month'>('month')

  // Load bookings when dependencies change
  useEffect(() => {
    if (businessId) {
      loadBookings()
    }
  }, [page, filterStatus, filterRange, businessId])

  // Load bookings function
  const loadBookings = async () => {
    if (!businessId) return
    try {
      setLoading(true)
      // Compute date range based on filterRange
      const { startDate, endDate } = getDateRange()
      
      const response = await bookingsApi.getBusinessBookings(
        businessId,
        page,
        10,
        filterStatus !== 'ALL' ? filterStatus : undefined,
        startDate,
        endDate
      )
      
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.bookings || []
      
      setBookings(data)
      setError(null)
    } catch (err) {
      console.error('[v0] Error loading bookings:', err)
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  // Helper to get date range based on filterRange
  const getDateRange = () => {
    const end = new Date()
    const start = new Date(end)

    switch (filterRange) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        break
      case 'tomorrow':
        start.setDate(end.getDate() + 1)
        start.setHours(0, 0, 0, 0)
        end.setDate(end.getDate() + 1)
        break
      case 'week':
        start.setDate(end.getDate() - 7)
        break
      case 'nextWeek':
        start.setDate(end.getDate() + 1) // Tomorrow
        start.setHours(0, 0, 0, 0)
        end.setDate(end.getDate() + 7) // Next 7 days
        break
      case 'month':
        start.setDate(end.getDate() - 30)
        break
    }
    end.setHours(23, 59, 59, 999)
    return { startDate: start.toISOString(), endDate: end.toISOString() }
  }

  // Handle booking status update
  const handleUpdateStatus = async () => {
    if (!selectedBookingId || !newStatus) return
    try {
      setUpdatingStatus(true)
      setUpdateError('')
      const response = await bookingsApi.updateBookingStatus(selectedBookingId, newStatus)
      if (response.success) {
        setBookings(prev => prev.map(b => b.id === selectedBookingId ? { ...b, status: newStatus } : b))
        setSelectedBookingId(null)
        setNewStatus(null)
      } else {
        setUpdateError(response.error || 'Failed to update booking status')
      }
    } catch (err) {
      setUpdateError('Error updating booking status')
      console.error('[v0] Error updating status:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Helper to get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // Render component
  if (fetchingBusinessId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Sidebar userRole="BUSINESS_OWNER" />
        <main className="md:ml-64 pt-6 px-4 md:px-8 py-8 flex items-center justify-center h-screen">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </main>
      </div>
    )
  }

  if (!businessId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Sidebar userRole="BUSINESS_OWNER" />
        <main className="md:ml-64 pt-6 px-4 md:px-8 py-8">
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-900 text-lg font-medium">Unable to load business information</p>
            <p className="text-slate-500 text-sm">Please try again or contact support</p>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Sidebar userRole="BUSINESS_OWNER" />

      <main className="md:ml-64 pt-6 px-4 md:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Bookings</h1>
          <p className="text-slate-600 mt-1">Manage all customer bookings</p>
        </div>

        {/* New Booking Button */}
        <div className="mb-6">
          <Link href="/dashboard/bookings/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </Link>
        </div>

        {/* Filters: Status & Date Range */}
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          {/* Status Filters */}
          {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((status) => (
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

          {/* Date Range Filters */}
          <div className="ml-4">
            <label className="mr-2 text-sm font-semibold text-slate-700">Date Range:</label>
            <select
              value={filterRange}
              onChange={(e) => {
                setFilterRange(e.target.value as typeof filterRange)
                setPage(1)
              }}
              className="h-10 w-40 rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">Last 7 days</option>
              <option value="nextWeek">Next 7 days</option>
              <option value="month">Last 30 days</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-900">{error}</p>
          </div>
        )}

        {/* Loading Indicator */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : bookings.length === 0 ? (
          // No bookings message
          <Card className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg font-medium">No bookings found</p>
            <p className="text-slate-500 text-sm">Start by creating your first booking</p>
          </Card>
        ) : (
          // Bookings table
          <Card className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Service</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date & Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Verified</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Amount</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                    {/* Customer info */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{booking.customerName}</p>
                        <p className="text-sm text-slate-500">{booking.customerEmail}</p>
                      </div>
                    </td>
                    {/* Phone */}
                    <td className="px-6 py-4 text-sm">{booking.customerPhone || 'N/A'}</td>
                    {/* Service */}
                    <td className="px-6 py-4">{booking.service?.name || 'N/A'}</td>
                    {/* Date & Time */}
                    <td className="px-6 py-4 text-sm">
                      {new Date(booking.startTime).toLocaleDateString()} <br />
                      <span className="text-xs text-slate-500">
                        {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                    </td>
                    {/* Verified */}
                    <td className="px-6 py-4">
                      <Badge className={booking.isEmailVerified ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                        {booking.isEmailVerified ? 'Yes' : 'Pending'}
                      </Badge>
                    </td>
                    {/* Amount */}
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      Rs.{booking.service?.price || 0}
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/bookings/${booking.id}`}>
                          <Button size="sm" variant="ghost" title="View details">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {/* Update status buttons */}
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
                              {booking.status === 'PENDING' ? 'Confirm' : 'Complete'}
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
          </Card>
        )}

        {/* Pagination */}
        {!loading && bookings.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}

        {/* Modal for status update confirmation */}
        {selectedBookingId && newStatus && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-lg font-bold mb-4 text-slate-900">Update Booking Status</h2>
              {updateError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-900">
                  {updateError}
                </div>
              )}
              <p className="mb-6 text-slate-600">
                Are you sure you want to change the status to <strong>{newStatus}</strong>?
                <br /> The customer will be notified via email and SMS.
              </p>
              <div className="flex justify-end gap-2">
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