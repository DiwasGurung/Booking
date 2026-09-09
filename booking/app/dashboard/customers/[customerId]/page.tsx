'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import {
  Loader,
  AlertCircle,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Wallet,
  Clock,
  User as UserIcon,
  ChevronRight,
} from 'lucide-react'
import { customerApi } from '@/lib/api'
import { useBusinessId } from '@/hooks/useBusinessId'

// ---- Types, mirroring the Prisma schema (Customer -> Booking -> Service, Staff) ----

type BookingStatus = 'UNVERIFIED' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

interface CustomerBooking {
  id: string
  startTime: string
  endTime: string
  status: BookingStatus
  notes: string | null
  service: { id: string; name: string; price: number; offerPrice: number | null }
  staff: { id: string; firstName: string; lastName: string } | null
}

interface CustomerDetail {
  id: string
  name: string
  email: string
  phone: string
  notes: string | null
  totalBookings: number
  totalSpent: number
  lastVisit: string | null
  createdAt: string
  bookings: CustomerBooking[]
}

const statusStyles: Record<BookingStatus, string> = {
  COMPLETED: 'bg-green-100 text-green-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-amber-100 text-amber-800',
  UNVERIFIED: 'bg-slate-100 text-slate-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-red-100 text-red-700',
}

const statusLabels: Record<BookingStatus, string> = {
  COMPLETED: 'Completed',
  CONFIRMED: 'Confirmed',
  PENDING: 'Pending',
  UNVERIFIED: 'Unverified',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show',
}

function loyaltyTier(totalBookings: number): { label: string; styles: string } {
  if (totalBookings >= 10) return { label: 'VIP', styles: 'bg-purple-100 text-purple-800' }
  if (totalBookings >= 4) return { label: 'Loyal', styles: 'bg-teal-100 text-teal-800' }
  if (totalBookings >= 1) return { label: 'Regular', styles: 'bg-blue-100 text-blue-800' }
  return { label: 'New', styles: 'bg-slate-100 text-slate-700' }
}

function formatCurrency(amount: number) {
  return `Rs. ${amount.toLocaleString('en-NP')}`
}

function formatDate(value: string | null) {
  if (!value) return 'Never'
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

function initials(name: string) {
  return name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function CustomerHistoryPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params?.customerId as string

  const { businessId, loading: fetchingBusinessId, error: businessIdError } = useBusinessId()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL')

  useEffect(() => {
    if (!fetchingBusinessId && (businessIdError || !businessId)) {
      router.push('/login')
    }
  }, [fetchingBusinessId, businessIdError, businessId, router])

  useEffect(() => {
    if (businessId && customerId) {
      loadCustomer()
    }
  }, [businessId, customerId])

  const loadCustomer = async () => {
    if (!businessId || !customerId) return
    try {
      setLoading(true)
      const response = await customerApi.getHistory(businessId, customerId)
      setCustomer(response.data as CustomerDetail)
      setError(null)
    } catch (err) {
      setError('Failed to load customer history')
    } finally {
      setLoading(false)
    }
  }

  const bookings = customer?.bookings ?? []
  const filteredBookings = statusFilter === 'ALL' ? bookings : bookings.filter(b => b.status === statusFilter)
  const tier = customer ? loyaltyTier(customer.totalBookings) : null

  const statusFilters: Array<BookingStatus | 'ALL'> = [
    'ALL',
    'COMPLETED',
    'CONFIRMED',
    'PENDING',
    'CANCELLED',
    'NO_SHOW',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Sidebar userRole="BUSINESS_OWNER" />

      <main className="md:ml-64 pt-6 px-4 md:px-8 py-8">
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Analytics', href: '/dashboard/analytics' },
          { label: 'Customer history' },
        ]} />

        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <p className="text-red-900">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : customer ? (
          <div className="space-y-6 sm:space-y-8">
            {/* Profile header */}
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700">
                    {initials(customer.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{customer.name}</h1>
                      {tier && <Badge className={tier.styles}>{tier.label}</Badge>}
                    </div>
                    <div className="mt-2 flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:items-center sm:gap-4">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {customer.phone}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 sm:text-right">
                  Customer since {formatDate(customer.createdAt)}
                </p>
              </div>

              {customer.notes && (
                <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-sm italic text-slate-600">
                  "{customer.notes}"
                </p>
              )}
            </Card>

            {/* Stat summary */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <Card className="p-4 sm:p-6">
                <div className="mb-2 flex items-center gap-2 text-slate-500">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <p className="text-xs sm:text-sm font-medium">Bookings</p>
                </div>
                <p className="text-xl sm:text-3xl font-bold text-slate-900">{customer.totalBookings}</p>
              </Card>
              <Card className="p-4 sm:p-6">
                <div className="mb-2 flex items-center gap-2 text-slate-500">
                  <Wallet className="h-4 w-4 shrink-0" />
                  <p className="text-xs sm:text-sm font-medium">Total spent</p>
                </div>
                <p className="text-lg sm:text-3xl font-bold text-slate-900 truncate">
                  {formatCurrency(customer.totalSpent)}
                </p>
              </Card>
              <Card className="p-4 sm:p-6">
                <div className="mb-2 flex items-center gap-2 text-slate-500">
                  <Clock className="h-4 w-4 shrink-0" />
                  <p className="text-xs sm:text-sm font-medium">Last visit</p>
                </div>
                <p className="text-sm sm:text-2xl font-bold text-slate-900">{formatDate(customer.lastVisit)}</p>
              </Card>
            </div>

            {/* Booking history */}
            <Card className="p-4 sm:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Booking history</h2>
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                  {statusFilters.map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        statusFilter === status
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {status === 'ALL' ? 'All' : statusLabels[status]}
                    </button>
                  ))}
                </div>
              </div>

              {filteredBookings.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  No {statusFilter === 'ALL' ? '' : statusLabels[statusFilter].toLowerCase() + ' '}bookings found.
                </div>
              ) : (
                <div className="relative space-y-4 sm:space-y-0">
                  {/* Mobile: timeline list */}
                  <div className="space-y-3 sm:hidden">
                    {filteredBookings.map(booking => {
                      const { date, time } = formatDateTime(booking.startTime)
                      return (
                        <div key={booking.id} className="rounded-xl border border-slate-200 p-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">{booking.service.name}</p>
                              <p className="mt-0.5 text-xs text-slate-500">{date} · {time}</p>
                            </div>
                            <Badge className={`${statusStyles[booking.status]} shrink-0`}>
                              {statusLabels[booking.status]}
                            </Badge>
                          </div>
                          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2.5">
                            <span className="flex items-center gap-1.5 text-xs text-slate-500">
                              <UserIcon className="h-3.5 w-3.5 shrink-0" />
                              {booking.staff ? `${booking.staff.firstName} ${booking.staff.lastName}` : 'Unassigned'}
                            </span>
                            <span className="text-sm font-semibold text-slate-900">
                              {formatCurrency(booking.service.offerPrice ?? booking.service.price)}
                            </span>
                          </div>
                          {booking.notes && (
                            <p className="mt-2 text-xs text-slate-500">{booking.notes}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Desktop/tablet: table */}
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full">
                      <thead className="border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-3 text-left text-sm font-semibold text-slate-900">Service</th>
                          <th className="px-3 py-3 text-left text-sm font-semibold text-slate-900">Date & time</th>
                          <th className="px-3 py-3 text-left text-sm font-semibold text-slate-900">Staff</th>
                          <th className="px-3 py-3 text-left text-sm font-semibold text-slate-900">Price</th>
                          <th className="px-3 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredBookings.map(booking => {
                          const { date, time } = formatDateTime(booking.startTime)
                          return (
                            <tr key={booking.id}>
                              <td className="px-3 py-4">
                                <p className="font-medium text-slate-900">{booking.service.name}</p>
                                {booking.notes && (
                                  <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">{booking.notes}</p>
                                )}
                              </td>
                              <td className="px-3 py-4 text-sm text-slate-600">
                                {date}<span className="text-slate-400"> · </span>{time}
                              </td>
                              <td className="px-3 py-4 text-sm text-slate-600">
                                {booking.staff ? `${booking.staff.firstName} ${booking.staff.lastName}` : 'Unassigned'}
                              </td>
                              <td className="px-3 py-4 text-sm font-semibold text-slate-900">
                                {formatCurrency(booking.service.offerPrice ?? booking.service.price)}
                              </td>
                              <td className="px-3 py-4">
                                <Badge className={statusStyles[booking.status]}>{statusLabels[booking.status]}</Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  )
}