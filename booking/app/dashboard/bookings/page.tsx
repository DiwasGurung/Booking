'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { bookingsApi, staffApi, type Staff } from '@/lib/api'
import { Calendar, Loader, AlertCircle, Eye, Download, LayoutGrid, List } from 'lucide-react'
import Link from 'next/link'
import { useBusinessId } from '@/hooks/useBusinessId'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'

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
  const { businessId,loading: fetchingBusinessId, error: businessIdError } = useBusinessId()
  const { subscriptionStatus } = useSubscriptionStatus()
  const canExportBookings = ['PROFESSIONAL', 'ENTERPRISE', 'PRO'].includes((subscriptionStatus?.planName || '').toUpperCase())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterStaffId, setFilterStaffId] = useState('ALL')
  const [filterVerification, setFilterVerification] = useState('ALL')
  const [filterRange, setFilterRange] = useState<'today' | 'week' | 'month'>('month')
  const [staff, setStaff] = useState<Staff[]>([])
  const [page, setPage] = useState(1)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [bookingView, setBookingView] = useState<'comfortable' | 'compact'>('comfortable')

  const getDateRange = () => {
    const end = new Date()
    const start = new Date(end)
    if (filterRange === 'today') start.setHours(0, 0, 0, 0)
    if (filterRange === 'week') start.setDate(end.getDate() - 7)
    if (filterRange === 'month') start.setDate(end.getDate() - 30)
    end.setHours(23, 59, 59, 999)
    return { startDate: start.toISOString(), endDate: end.toISOString() }
  }

  useEffect(() => {
    if (businessId) {
      loadBookings()
    }
  }, [page, filterStatus, filterStaffId, filterVerification, filterRange, businessId])

  useEffect(() => {
    if (businessId) {
      staffApi.getBusinessStaff(businessId).then(response => setStaff(response.data?.staff || [])).catch(() => setStaff([]))
    }
  }, [businessId])


  const loadBookings = async () => {
    if (!businessId) return
    try {
      setIsLoading(true)
      const { startDate, endDate } = getDateRange()
      const response = await bookingsApi.getBusinessBookings(
        businessId,
        page,
        10,
        filterStatus !== 'ALL' ? filterStatus : undefined,
        filterStaffId !== 'ALL' ? filterStaffId : undefined,
        filterVerification === 'ALL' ? undefined : filterVerification === 'VERIFIED',
        startDate,
        endDate,
      )
      const data = Array.isArray(response.data) ? response.data : response.data?.bookings || []
      setBookings(data)
      setError(null)
    } catch (err) {
      setError('Failed to load bookings')
      console.error('[v0] Error isLoading bookings:', err)
    } finally {
      setIsLoading(false)
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

  const downloadBookingsPdf = () => {
    if (!canExportBookings || bookings.length === 0) return
    const rows = bookings.map((booking) => `
      <tr><td>${booking.customerName || 'N/A'}</td><td>${booking.customerEmail || 'N/A'}</td><td>${booking.service?.name || 'N/A'}</td><td>${new Date(booking.startTime).toLocaleString()}</td><td>${booking.status}</td><td>Rs. ${booking.service?.price || 0}</td></tr>`).join('')
    const printWindow = window.open('', '_blank', 'noopener,noreferrer')
    if (!printWindow) return
    printWindow.document.write(`<!doctype html><html><head><title>Bookings</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#0f172a}h1{margin-bottom:4px}p{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{border:1px solid #cbd5e1;padding:9px;text-align:left;font-size:12px}th{background:#f1f5f9}</style></head><body><h1>Bookings</h1><p>Filtered bookings · ${new Date().toLocaleDateString()}</p><table><thead><tr><th>Customer</th><th>Email</th><th>Service</th><th>Date & Time</th><th>Status</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table></body></html>`)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
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
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Bookings</h1>
            <p className="text-sm text-slate-500 sm:text-base">Manage all customer bookings</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="flex flex-1 rounded-lg border border-slate-200 bg-white p-1 sm:flex-none" aria-label="Booking view density">
              <Button type="button" variant={bookingView === 'comfortable' ? 'secondary' : 'ghost'} size="sm" className="flex-1 px-2 sm:flex-none" onClick={() => setBookingView('comfortable')} aria-label="Comfortable booking view">
                <LayoutGrid className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Comfortable</span>
              </Button>
              <Button type="button" variant={bookingView === 'compact' ? 'secondary' : 'ghost'} size="sm" className="flex-1 px-2 sm:flex-none" onClick={() => setBookingView('compact')} aria-label="Compact booking view">
                <List className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Compact</span>
              </Button>
            </div>
            {canExportBookings && (
              <Button onClick={downloadBookingsPdf} disabled={isLoading || bookings.length === 0} variant="outline" className="shrink-0 px-3 sm:px-4">
                <Download className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Download PDF</span>
              </Button>
            )}
          </div>
          {/* <Link href="/dashboard/bookings/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </Link> */}
        </div>

        {/* Filters */}
        <div className="mb-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mb-6">
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
            <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Date range</label><select value={filterRange} onChange={event => { setFilterRange(event.target.value as typeof filterRange); setPage(1) }} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value="today">Today</option><option value="week">Last 7 days</option><option value="month">Last 30 days</option></select></div>
            <div className="flex items-end"><Link href="/dashboard/staff/performance" className="text-sm font-semibold text-blue-700 hover:underline">View staff performance</Link></div>
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
        {isLoading ? (
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
          <Card className="overflow-hidden border-slate-200 bg-white/90 shadow-sm">
            <div className="space-y-3 p-3 md:hidden">
              {bookings.map((booking) => (
                <div key={booking.id} className={`rounded-xl border border-slate-200 bg-white p-4 ${bookingView === 'compact' ? 'space-y-2' : 'space-y-4'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{booking.customerName}</p>
                      <p className="truncate text-xs text-slate-500">{booking.customerEmail || 'No email provided'}</p>
                    </div>
                    <Badge className={`${getStatusColor(booking.status)} shrink-0`}>{booking.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-slate-500">Service</p><p className="truncate font-medium text-slate-900">{booking.service?.name || 'N/A'}</p></div>
                    <div><p className="text-xs text-slate-500">Amount</p><p className="font-semibold text-slate-900">Rs.{booking.service?.price || 0}</p></div>
                    <div className="col-span-2"><p className="text-xs text-slate-500">Date & time</p><p className="font-medium text-slate-900">{new Date(booking.startTime).toLocaleDateString()} · {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    <Link href={`/dashboard/bookings/${booking.id}`} className="flex-1 sm:flex-none"><Button size="sm" variant="outline" className="w-full"><Eye className="mr-1.5 h-4 w-4" />View</Button></Link>
                    {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && <>
                      <Button size="sm" className="flex-1 bg-blue-600 text-white hover:bg-blue-700" onClick={() => { setSelectedBookingId(booking.id); setNewStatus(booking.status === 'PENDING' ? 'CONFIRMED' : booking.status === 'CONFIRMED' ? 'COMPLETED' : null) }}>{booking.status === 'PENDING' ? 'Confirm' : 'Complete'}</Button>
                      <Button size="sm" variant="destructive" className="flex-1" onClick={() => { setSelectedBookingId(booking.id); setNewStatus('CANCELLED') }}>Cancel</Button>
                    </>}
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
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
        {!isLoading && bookings.length > 0 && (
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
