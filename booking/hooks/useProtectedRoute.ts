'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/authContext'

export type ProtectionMode = 'public' | 'protected' | 'business-only'

interface UseProtectedRouteOptions {
  mode: ProtectionMode
  redirectTo?: string
}

/**
 * Hook to protect routes based on authentication status
 * 
 * Modes:
 * - 'public': Accessible to anyone (redirects authenticated users away)
 * - 'protected': Requires authentication (redirects unauthenticated users to login)
 * - 'business-only': Requires authentication with BUSINESS_OWNER role
 */
export function useProtectedRoute({ mode, redirectTo }: UseProtectedRouteOptions) {
  const router = useRouter()
  const { user, loading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (loading) return // Wait for auth check to complete

    console.log('[v0] Route protection check:', { mode, isAuthenticated, userRole: user?.role })

    if (mode === 'public') {
      // Public pages: redirect authenticated users
      if (isAuthenticated) {
        console.log('[v0] Redirecting authenticated user from public page to dashboard')
        router.replace('/dashboard')
      }
    } else if (mode === 'protected') {
      // Protected pages: redirect unauthenticated users
      if (!isAuthenticated) {
        console.log('[v0] Redirecting unauthenticated user to login')
        router.replace('/login')
      }
    } else if (mode === 'business-only') {
      // Business-only pages: check role
      if (!isAuthenticated) {
        console.log('[v0] Redirecting unauthenticated user to login')
        router.replace('/login')
      } else if (user?.role !== 'BUSINESS_OWNER') {
        console.log('[v0] Redirecting non-business user away from business page')
        router.replace(redirectTo || '/dashboard')
      }
    }
  }, [loading, isAuthenticated, user?.role, mode, redirectTo, router])

  return {
    isReady: !loading,
    isAuthenticated,
    user,
  }
}
