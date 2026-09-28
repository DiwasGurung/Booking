'use client'

import { useEffect, useState } from 'react'
import { getNowInNepal } from './OpenStatus'

interface BusinessHour {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

export function HoursTable({ hours }: { hours: BusinessHour[] }) {
  const [today, setToday] = useState<number | null>(null)

  useEffect(() => {
    setToday(getNowInNepal().day)
  }, [])

  return (
    <div className="divide-y divide-[#E4DFD1]">
      {hours.map((h) => {
        const isToday = h.dayOfWeek === today
        return (
          <div
            key={h.dayOfWeek}
            className={`flex items-center justify-between border-l-2 py-2.5 pl-3 text-sm ${
              isToday ? 'border-l-[#B9873B]' : 'border-l-transparent'
            }`}
          >
            <span className={isToday ? 'font-medium text-[#171F1B]' : 'text-[#4B554E]'}>
              {DAY_LABELS[h.dayOfWeek]}
            </span>
            <span className={isToday ? 'font-medium text-[#171F1B]' : 'text-[#4B554E]'}>
              {h.isClosed ? 'Closed' : `${formatTime(h.openTime)} – ${formatTime(h.closeTime)}`}
            </span>
          </div>
        )
      })}
    </div>
  )
}