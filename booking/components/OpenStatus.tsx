// components/OpenStatus.tsx
'use client'

import { useEffect, useState } from 'react'

interface BusinessHour {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

const TZ = 'Asia/Kathmandu'
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function getNowInNepal() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return {
    day: WEEKDAYS.indexOf(get('weekday')),
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  }
}

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function computeOpen(hours: BusinessHour[]) {
  const { day, minutes } = getNowInNepal()
  const today = hours.find((h) => h.dayOfWeek === day)
  if (!today || today.isClosed) return false
  const open = toMinutes(today.openTime)
  const close = toMinutes(today.closeTime)
  // handles overnight ranges like 18:00–02:00 (same-day portion only)
  return close > open ? minutes >= open && minutes < close : minutes >= open || minutes < close
}

export function OpenStatus({ hours }: { hours: BusinessHour[] }) {
  const [open, setOpen] = useState<boolean | null>(null)

  useEffect(() => {
    setOpen(computeOpen(hours))
    const id = setInterval(() => setOpen(computeOpen(hours)), 60_000)
    return () => clearInterval(id)
  }, [hours])

  if (open === null) return null // avoids hydration mismatch

  return (
    <span className={`text-xs font-medium ${open ? 'text-primary' : 'text-muted-foreground'}`}>
      {open ? 'Open now' : 'Closed now'}
    </span>
  )
}