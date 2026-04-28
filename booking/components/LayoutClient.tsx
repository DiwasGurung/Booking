'use client'

import React from 'react'
import { usePagePreservation } from '@/hooks/usePagePreservation'

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  // Preserve page state and scroll during navigation
  usePagePreservation()

  return <>{children}</>
}