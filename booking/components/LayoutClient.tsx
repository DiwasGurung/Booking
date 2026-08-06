'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { usePagePreservation } from '@/hooks/usePagePreservation'

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  usePagePreservation()

  useEffect(() => {
    // Determine if header and footer should be hidden
    const isDashboard = pathname?.startsWith('/dashboard') || pathname?.startsWith('/bookings') || pathname?.startsWith('/subscription')
    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/staff/login'
    const isPublicBooking = pathname?.startsWith('/book/')
    const isStaff = pathname?.startsWith('/staff/')
    const headerHidden = isDashboard || isAuthPage || isPublicBooking || isStaff

    const body = document.body
    const footer = document.querySelector('footer') // select your footer element

    // Toggle body padding
    if (headerHidden) {
      body.classList.remove('pt-16')
    } else {
      body.classList.add('pt-16')
    }

    // Show/hide footer
    if (footer) {
      if (headerHidden) {
        footer.classList.add('hidden') // hide footer
      } else {
        footer.classList.remove('hidden') // show footer
      }
    }
  }, [pathname])

  return <>{children}</>
}