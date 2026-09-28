'use client'

import dynamic from 'next/dynamic'

const LocationPicker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-muted" />,
})

export function BusinessMap({ lat, lng }: { lat: number; lng: number }) {
  return <LocationPicker value={{ lat, lng }} readOnly height={256} />
}