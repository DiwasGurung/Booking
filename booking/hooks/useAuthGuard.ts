'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/authContext'

export type AuthGuardMode = 'public' | 'protected' | 'business-only' | 'customer-only' | 'admin-only'

interface UseAuthGuardOptions {
  mode: AuthGuardMode
  redirectTo?: string
  onUnauthorized?: () => void
}

interface AuthGuardState {
  isReady: boolean
  isAuthenticated: boolean
  userRole?: string
  isRedirecting: boolean
}

/**
 * Comprehensive auth guard hook for client-side route protection
 * Handles all authentication and authorization checks
 */
export function useAuthGuard({ mode, redirectTo, onUnauthorized }: UseAuthGuardOptions): AuthGuardState {
  const router = useRouter()
  const { user, loading, isAuthenticated } = useAuth()

  useEffect(() => {
    // Still loading auth check, wait
    if (loading) return

    // user.role can come from different sources; widen type to allow runtime comparisons
    const userRole = (user as any)?.role as string | undefined

    console.log('[useAuthGuard]', {
      mode,
      isAuthenticated,
      userRole,
      timestamp: new Date().toISOString(),
    })

    // PUBLIC MODE - Redirect authenticated users away
    if (mode === 'public') {
      if (isAuthenticated) {
        console.log('[useAuthGuard] Public page - redirecting authenticated user')

        // Role-based redirects for authenticated users
        if (userRole === 'BUSINESS_OWNER') {
          router.replace('/dashboard')
        } else if (userRole === 'ADMIN') {
          router.replace('/admin')
        } else if (userRole === 'CUSTOMER') {
          router.replace('/search')
        } else {
          router.replace(redirectTo || '/dashboard')
        }
      }
      return
    }

    // PROTECTED MODE - Redirect unauthenticated users
    if (mode === 'protected') {
      if (!isAuthenticated) {
        console.log('[useAuthGuard] Protected page - redirecting to login')
        router.replace('/login')
        onUnauthorized?.()
      }
      return
    }

    // BUSINESS-ONLY MODE - Check BUSINESS_OWNER role
    if (mode === 'business-only') {
      if (!isAuthenticated) {
        console.log('[useAuthGuard] Business page - not authenticated, redirecting to login')
        router.replace('/login')
        onUnauthorized?.()
        return
      }

      if (userRole !== 'BUSINESS_OWNER') {
        console.log('[useAuthGuard] Business page - wrong role, redirecting to', redirectTo || '/dashboard')
        router.replace(redirectTo || '/dashboard')
        onUnauthorized?.()
      }
      return
    }

    // CUSTOMER-ONLY MODE - Check CUSTOMER role
    if (mode === 'customer-only') {
      if (!isAuthenticated) {
        console.log('[useAuthGuard] Customer page - not authenticated, redirecting to login')
        router.replace('/login')
        onUnauthorized?.()
        return
      }

      if (userRole !== 'CUSTOMER') {
        console.log('[useAuthGuard] Customer page - wrong role, redirecting to', redirectTo || '/search')
        router.replace(redirectTo || '/search')
        onUnauthorized?.()
      }
      return
    }

    // ADMIN-ONLY MODE - Check ADMIN role
    if (mode === 'admin-only') {
      if (!isAuthenticated) {
        console.log('[useAuthGuard] Admin page - not authenticated, redirecting to login')
        router.replace('/login')
        onUnauthorized?.()
        return
      }

      if (userRole !== 'ADMIN') {
        console.log('[useAuthGuard] Admin page - wrong role, redirecting to', redirectTo || '/dashboard')
        router.replace(redirectTo || '/dashboard')
        onUnauthorized?.()
      }
      return
    }
  }, [loading, isAuthenticated, user?.role, mode, redirectTo, router, onUnauthorized])

  return {
    isReady: !loading,
    isAuthenticated,
    userRole: user?.role,
    isRedirecting: loading,
  }
}
