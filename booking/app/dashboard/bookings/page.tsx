'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { bookingsApi, staffApi, subscriptionApi, type Staff, type StaffPerformance } from '@/lib/api'
import { Calendar, Loader, AlertCircle, Eye, Edit, Trash2, Plus } from 'lucide-react'
import Link from 'next/link'
import { useBusinessId } from '@/hooks/useBusinessId'

interface Booking {
  id: string
  customerName: string
  customerEmail?: string
  serviceId: string
  service?: { name: string; price: number }
  startTime: string
  endTime: string
  status: string
  notes?: string
}

export default function BookingsPage() {
  const router = useRouter()
  const { businessId, loading: fetchingBusinessId, error: businessIdError } = useBusinessId()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterStaffId, setFilterStaffId] = useState('ALL')
  const [filterVerification, setFilterVerification] = useState('ALL')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('month')
  const [staff, setStaff] = useState<Staff[]>([])
  const [performance, setPerformance] = useState<StaffPerformance | null>(null)
  const [isEnterprise, setIsEnterprise] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updateError, setUpdateError] = useState('')

  const getDateRange = () => {
    const end = new Date()
    const start = new Date(end)
    if (dateRange === 'today') start.setHours(0, 0, 0, 0)
    if (dateRange === 'week') start.setDate(end.getDate() - 7)
    if (dateRange === 'month') start.setDate(end.getDate() - 30)
    return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) }
  }

  useEffect(() => {
    if (businessId) {
      loadBookings()
      subscriptionApi.getStatus(businessId).then(response => {
        setIsEnterprise(Boolean(response.data?.hasSubscription && response.data.planName?.toLowerCase().includes('enterprise')))
      }).catch(() => setIsEnterprise(false))
      staffApi.getBusinessStaff(businessId).then(response => setStaff(response.data?.staff || [])).catch(() => setStaff([]))
    }
  }, [page, filterStatus, filterStaffId, filterVerification, dateRange, businessId])

  useEffect(() => {
    if (!isEnterprise || filterStaffId === 'ALL') {
      setPerformance(null)
      return
    }
    const { startDate, endDate } = getDateRange()
    staffApi.getPerformance(filterStaffId, startDate, endDate).then(response => setPerformance(response.data || null)).catch(() => setPerformance(null))
  }, [filterStaffId, dateRange, isEnterprise])

  // Redirect to login if business ID error or not found
  useEffect(() => {
    if (!fetchingBusinessId && (businessIdError || !businessId)) {
      router.push('/login')
    }
  }, [fetchingBusinessId, businessIdError, businessId, router])

  const loadBookings = async () => {
    if (!businessId) return
    try {
      setLoading(true)
      const { startDate, endDate } = getDateRange()
      const response = await bookingsApi.getBusinessBookings(
        businessId,
        page,
        10,
        filterStatus !== 'ALL' ? filterStatus : undefined,
        filterStaffId !== 'ALL' ? filterStaffId : undefined,
        filterVerification === 'ALL' ? undefined : filterVerification === 'VERIFIED',
        startDate,
        endDate
      )
      const data = Array.isArray(response.data) ? response.data : response.data?.bookings || []
      setBookings(data)
      setError(null)
    } catch (err) {
      setError('Failed to load bookings')
      console.error('[v0] Error loading bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedBookingId || !newStatus) return

    try {
      setUpdatingStatus(true)
      setUpdateError('')
      const response = await bookingsApi.updateBookingStatus(selectedBookingId, newStatus)
      
      if (response.success) {
        // Update the booking in the list
        setBookings(bookings.map(b => 
          b.id === selectedBookingId ? { ...b, status: newStatus } : b
        ))
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
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
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Bookings' },
        ]} />

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Bookings</h1>
            <p className="text-slate-500">Manage all customer bookings</p>
          </div>
          {/* <Link href="/dashboard/bookings/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </Link> */}
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
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
        </div>

        <Card className="mb-6 border-slate-200 bg-white/80 p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Staff member</label><select value={filterStaffId} onChange={event => { setFilterStaffId(event.target.value); setPage(1) }} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value="ALL">All staff</option>{staff.map(member => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}</select></div>
            <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Customer verification</label><select value={filterVerification} onChange={event => { setFilterVerification(event.target.value); setPage(1) }} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value="ALL">All customers</option><option value="VERIFIED">Verified</option><option value="UNVERIFIED">Unverified</option></select></div>
            <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Performance period</label><select value={dateRange} onChange={event => setDateRange(event.target.value as 'today' | 'week' | 'month')} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value="today">Today</option><option value="week">Last 7 days</option><option value="month">Last 30 days</option></select></div>
          </div>
        </Card>

        {isEnterprise && performance && <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">{[['Bookings', performance.totalBookings], ['Customers served', performance.servedCustomers], ['Unique customers', performance.uniqueCustomers], ['Pending', performance.pendingBookings], ['Unverified', performance.unverifiedBookings]].map(([label, value]) => <Card key={String(label)} className="border-slate-200 p-4 shadow-sm"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p></Card>)}</div>}
        {!isEnterprise && <Card className="mb-6 border-amber-200 bg-amber-50 p-4"><p className="font-semibold text-amber-950">Staff performance analytics are available on the Enterprise plan.</p><p className="mt-1 text-sm text-amber-800">You can still filter and manage bookings by staff, status, and verification.</p><Link href="/dashboard/subscription" className="mt-3 inline-block text-sm font-semibold text-amber-950 underline">View Enterprise plan</Link></Card>}

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
        ) : bookings.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg font-medium">No bookings found</p>
            <p className="text-slate-500 text-sm">Start by creating your first booking</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Service</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date & Time</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Amount</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{booking.customerName}</p>
                          <p className="text-sm text-slate-500">{booking.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-900">{booking.service?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-900">
                        {new Date(booking.startTime).toLocaleDateString()}
                        <br />
                        <span className="text-sm text-slate-500">
                          {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        Rs.{booking.service?.price || 0}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          <Link href={`/dashboard/bookings/${booking.id}`}>
                            <Button size="sm" variant="ghost" title="View details">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => {
                                  setSelectedBookingId(booking.id)
                                  setNewStatus(booking.status === 'PENDING' ? 'CONFIRMED' : booking.status === 'CONFIRMED' ? 'COMPLETED' : null)
                                }}
                                title={booking.status === 'PENDING' ? 'Confirm booking' : 'Mark as completed'}
                              >
                                {booking.status === 'PENDING' ? 'Confirm' : booking.status === 'CONFIRMED' ? 'Complete' : 'Done'}
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
        {!loading && bookings.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
            >
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
                The customer will be notified via email.
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
