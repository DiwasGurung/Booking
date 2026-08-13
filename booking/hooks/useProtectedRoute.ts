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


    if (mode === 'public') {
      // Public pages: redirect authenticated users
      if (isAuthenticated) {
        router.replace('/dashboard')
      }
    } else if (mode === 'protected') {
      // Protected pages: redirect unauthenticated users
      if (!isAuthenticated) {
        router.replace('/login')
      }
    } else if (mode === 'business-only') {
      // Business-only pages: check role
      if (!isAuthenticated) {
        router.replace('/login')
      } else if (user?.role !== 'BUSINESS_OWNER') {
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
