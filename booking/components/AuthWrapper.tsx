'use client'

import { ReactNode } from 'react'
import { useAuthGuard, type AuthGuardMode } from '@/hooks/useAuthGuard'
import { Loader } from 'lucide-react'

interface AuthWrapperProps {
  mode: AuthGuardMode
  redirectTo?: string
  children: ReactNode
  loadingComponent?: ReactNode
  fallbackComponent?: ReactNode
}

/**
 * Universal auth wrapper for all pages
 * Handles loading, redirects, and role-based access
 */
export function AuthWrapper({
  mode,
  redirectTo,
  children,
  loadingComponent,
  fallbackComponent,
}: AuthWrapperProps) {
  const { isReady, isRedirecting } = useAuthGuard({
    mode,
    redirectTo,
  })

  // Still checking auth or redirecting
  if (!isReady || isRedirecting) {
    return (
      loadingComponent || (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    )
  }

  // If there's a fallback (for access denied), show it
  if (fallbackComponent) {
    return fallbackComponent
  }

  // Render the protected content
  return <>{children}</>
}
