'use client'

import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { BarChart3 } from 'lucide-react'

export interface ChartBooking {
  id: string
  startTime: string
  price: number
  status: string
  service?: { name: string } | null
}

type Range = 7 | 30 | 90

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#16a34a',
  CONFIRMED: '#2563eb',
  PENDING: '#eab308',
  UNVERIFIED: '#f97316',
  CANCELLED: '#ef4444',
  NO_SHOW: '#64748b',
}
const FALLBACK_COLOR = '#94a3b8'

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function EmptyChart({ text = 'No data for this period' }: { text?: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-slate-400">
      <BarChart3 className="w-8 h-8 mb-2" />
      <p className="text-sm">{text}</p>
    </div>
  )
}

export function DashboardCharts({ bookings }: { bookings: ChartBooking[] }) {
  const [range, setRange] = useState<Range>(30)

  const { daily, statusData, serviceData, totals } = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - (range - 1))

    // Pre-fill every day so empty days show as zero instead of gaps
    const map = new Map<string, { date: string; label: string; bookings: number; revenue: number }>()
    for (let i = 0; i < range; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      map.set(dayKey(d), {
        date: dayKey(d),
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        bookings: 0,
        revenue: 0,
      })
    }

    const statusCount: Record<string, number> = {}
    const serviceCount: Record<string, number> = {}
    let totalBookings = 0
    let totalRevenue = 0

    for (const b of bookings) {
      const when = new Date(b.startTime)
      if (Number.isNaN(when.getTime()) || when < start) continue

      const key = dayKey(when)
      const row = map.get(key)
      const status = (b.status || 'UNKNOWN').toUpperCase()

      // Status + service breakdowns cover the whole selected range
      statusCount[status] = (statusCount[status] || 0) + 1
      const svc = b.service?.name || 'Unknown'
      serviceCount[svc] = (serviceCount[svc] || 0) + 1

      if (row) {
        row.bookings += 1
        // Revenue counts completed bookings only
        if (status === 'COMPLETED') {
          row.revenue += Number(b.price) || 0
          totalRevenue += Number(b.price) || 0
        }
      }
      totalBookings += 1
    }

    return {
      daily: Array.from(map.values()),
      statusData: Object.entries(statusCount).map(([name, value]) => ({ name, value })),
      serviceData: Object.entries(serviceCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      totals: { bookings: totalBookings, revenue: totalRevenue },
    }
  }, [bookings, range])

  const hasData = totals.bookings > 0
  // Keep x-axis readable on long ranges
  const tickInterval = range === 7 ? 0 : range === 30 ? 4 : 13

  return (
    <div className="mb-6 md:mb-8 space-y-3 md:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Analytics
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            {totals.bookings} bookings · Rs.{totals.revenue.toFixed(2)} completed revenue in the last {range} days
          </p>
        </div>
        <div className="flex gap-1">
          {([7, 30, 90] as Range[]).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={range === r ? 'default' : 'outline'}
              onClick={() => setRange(r)}
            >
              {r}d
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Bookings over time */}
        <Card className="border border-slate-200 shadow-sm p-4 md:p-6 bg-white">
          <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-4">Bookings over time</h3>
          <div className="h-64">
            {!hasData ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bookingsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={tickInterval} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    name="Bookings"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="url(#bookingsFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Revenue over time */}
        <Card className="border border-slate-200 shadow-sm p-4 md:p-6 bg-white">
          <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-4">Revenue (completed)</h3>
          <div className="h-64">
            {!hasData ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={tickInterval} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`Rs.${Number(v).toFixed(2)}`, 'Revenue']} />
                  <Bar dataKey="revenue" name="Revenue" fill="#9333ea" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Status breakdown */}
        <Card className="border border-slate-200 shadow-sm p-4 md:p-6 bg-white">
          <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-4">Booking status</h3>
          <div className="h-64">
            {statusData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {statusData.map((s) => (
                      <Cell key={s.name} fill={STATUS_COLORS[s.name] ?? FALLBACK_COLOR} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Top services */}
        <Card className="border border-slate-200 shadow-sm p-4 md:p-6 bg-white">
          <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-4">Top services</h3>
          <div className="h-64">
            {serviceData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
                  />
                  <Tooltip />
                  <Bar dataKey="value" name="Bookings" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}