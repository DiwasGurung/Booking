'use client'

import React, { useEffect } from 'react'
import { usePagePreservation } from '@/hooks/usePagePreservation'

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  // Preserve page state and scroll during navigation
  usePagePreservation()

  // Apply body styles on client side to avoid hydration mismatch
  useEffect(() => {
    const body = document.body
    body.className = 'font-sans antialiased pt-16 flex flex-col min-h-screen'
  }, [])

  return <>{children}</>
}
