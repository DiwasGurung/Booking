import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find & Book Local Businesses | Appointment Directory',
  description: 'Search local businesses by name, category, or location and book appointments directly.',
  alternates: { canonical: '/search' },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}