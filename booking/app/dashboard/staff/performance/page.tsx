'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { AlertCircle, ArrowLeft, BarChart3, CalendarDays, CheckCircle2, Loader2, Users, type LucideIcon } from 'lucide-react'
import { staffApi, subscriptionApi, type Staff, type StaffPerformance } from '@/lib/api'
import { useBusinessId } from '@/hooks/useBusinessId'

export default function StaffPerformancePage() {
  const { businessId, loading: businessLoading } = useBusinessId()
  const [staff, setStaff] = useState<Staff[]>([])
  const [staffId, setStaffId] = useState('')
  const [range, setRange] = useState<'today' | 'week' | 'month'>('month')
  const [performance, setPerformance] = useState<StaffPerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEnterprise, setIsEnterprise] = useState(false)

  const dates = useMemo(() => {
    const end = new Date()
    const start = new Date(end)
    if (range === 'today') start.setHours(0, 0, 0, 0)
    if (range === 'week') start.setDate(start.getDate() - 7)
    if (range === 'month') start.setDate(start.getDate() - 30)
    end.setHours(23, 59, 59, 999)
    return { start: start.toISOString(), end: end.toISOString() }
  }, [range])

  useEffect(() => {
    if (!businessId) return
    Promise.all([staffApi.getBusinessStaff(businessId), subscriptionApi.getStatus(businessId)])
      .then(([staffResponse, subscriptionResponse]) => {
        const members = staffResponse.data?.staff || []
        setStaff(members)
        setStaffId(current => current || members[0]?.id || '')
        const subscription = subscriptionResponse.data
        const planName = String(subscription?.planName || subscription?.planName || '').trim().toLowerCase()
         const isActive = subscription?.status === 'ACTIVE' || subscription?.status === 'CANCELLED' || subscription?.hasSubscription === true
        setIsEnterprise(Boolean(isActive && planName.includes('enterprise')))
      })
      .catch(() => setError('Unable to load staff performance.'))
      .finally(() => setLoading(false))
  }, [businessId])

  useEffect(() => {
    if (!staffId || !isEnterprise) return
    setError(null)
    staffApi.getPerformance(staffId, dates.start, dates.end)
      .then(response => setPerformance(response.data || null))
      .catch(() => { setPerformance(null); setError('Unable to load performance for this period.') })
  }, [staffId, dates, isEnterprise])

  const selectedStaff = staff.find(member => member.id === staffId)
  const metrics: Array<{ label: string; value: string | number; Icon: LucideIcon }> = performance ? [
    { label: 'Total bookings', value: performance.totalBookings, Icon: CalendarDays },
    { label: 'Completed', value: performance.servedCustomers, Icon: CheckCircle2 },
    { label: 'Unique customers', value: performance.uniqueCustomers, Icon: Users },
    { label: 'Completion rate', value: `${performance.completionRate.toFixed(0)}%`, Icon: BarChart3 },
  ] : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Sidebar userRole="BUSINESS_OWNER" />
      <main className="min-h-screen px-4 pb-10 pt-20 sm:px-6 md:ml-64 md:px-8 md:pt-8">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Staff performance' }]} />
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/dashboard/bookings" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />Back to bookings</Link>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff performance</h1>
            <p className="mt-1 text-slate-500">Track completed work and booking trends without mixing analytics into operations.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm"><BarChart3 className="h-5 w-5 text-blue-600" />Enterprise analytics</div>
        </div>

        {!businessLoading && !loading && !isEnterprise ? (
          <Card className="border-amber-200 bg-amber-50 p-6"><h2 className="font-semibold text-amber-950">Performance analytics require Enterprise</h2><p className="mt-1 text-sm text-amber-800">Upgrade to compare staff activity and completion rates.</p><Link href="/dashboard/subscription" className="mt-4 inline-block text-sm font-semibold text-amber-950 underline">View plans</Link></Card>
        ) : (
          <>
            <Card className="mb-6 border-slate-200 bg-white/85 p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-[1fr_220px]"><div><label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Staff member</label><div className="flex items-center gap-3"><Users className="h-5 w-5 text-blue-600" /><select value={staffId} onChange={event => setStaffId(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value="">Select staff</option>{staff.map(member => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}</select></div></div><div><label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Reporting period</label><select value={range} onChange={event => setRange(event.target.value as typeof range)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value="today">Today</option><option value="week">Last 7 days</option><option value="month">Last 30 days</option></select></div></div></Card>
            {error && <Card className="mb-6 flex items-start gap-3 border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="h-5 w-5 shrink-0" />{error}</Card>}
            {loading ? <Card className="flex items-center justify-center p-12 text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading performance data...</Card> : performance ? <><div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(({ label, value, Icon }) => <Card key={label} className="border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm text-slate-500">{label}</p><Icon className="h-5 w-5 text-blue-600" /></div><p className="mt-3 text-3xl font-bold text-slate-900">{value}</p></Card>)}</div><Card className="border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold text-slate-900">{selectedStaff ? `${selectedStaff.firstName} ${selectedStaff.lastName}` : 'Staff member'} overview</h2><p className="mt-2 text-sm text-slate-500">{performance.startDate} to {performance.endDate}. Completion metrics are based on bookings marked completed by the business.</p></Card></> : <Card className="p-12 text-center text-slate-500">Select a staff member to view performance.</Card>}
          </>
        )}
      </main>
    </div>
  )
}
