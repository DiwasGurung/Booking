'use client'

import dynamic from 'next/dynamic'
import { ToastProvider } from '@/components/ui/toast'

const Toaster = dynamic(() => import('@/components/ui/toaster').then(mod => ({ default: mod.Toaster })), {
  ssr: false,
})

export function ToasterProvider() {
  return (
    <ToastProvider>
      <Toaster />
    </ToastProvider>
  )
}
