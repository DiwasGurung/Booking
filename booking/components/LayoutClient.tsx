'use client'

import React, { useEffect } from 'react'
import { usePagePreservation } from '@/hooks/usePagePreservation'
import { usePathname } from 'next/navigation'

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  usePagePreservation()

  useEffect(() => {
    // Check if header should be visible
    const isDashboard = pathname?.startsWith('/dashboard') || pathname?.startsWith('/bookings') || pathname?.startsWith('/subscription')
    const isAuthPage = pathname === '/login' || pathname === '/signup'  || pathname === '/staff/login'
    const isPublicBooking = pathname?.startsWith('/book/')
    const headerHidden = isDashboard || isAuthPage || isPublicBooking

    const body = document.body
    
    // Remove pt-16 if header is hidden, add it back if header should be visible
    if (headerHidden) {
      body.classList.remove('pt-16')
    } else {
      body.classList.add('pt-16')
    }
  }, [pathname])

  return <>{children}</>
}
