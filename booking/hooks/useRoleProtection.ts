'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/authContext'

type UserRole = 'CUSTOMER' | 'BUSINESS_OWNER' | 'ADMIN'

interface RoleProtectionOptions {
  requiredRole?: UserRole | UserRole[]
  redirectTo?: string
  allowUnauthenticated?: boolean
}

/**
 * Hook to protect pages based on user role
 * Automatically redirects based on role requirements
 */
export const useRoleProtection = (options: RoleProtectionOptions = {}) => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const {
    requiredRole,
    redirectTo = '/login',
    allowUnauthenticated = false,
  } = options

  useEffect(() => {
    if (loading) return

    // Check authentication
    if (!user) {
      if (!allowUnauthenticated) {
        router.push(redirectTo)
      }
      return
    }

    // Check role if specified
    if (requiredRole) {
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

      if (!allowedRoles.includes(user.role as UserRole)) {
        // Redirect to appropriate page based on user role
        if (user.role === 'BUSINESS_OWNER') {
          router.push('/dashboard')
        } else if (user.role === 'CUSTOMER') {
          router.push('/search')
        } else {
          router.push('/')
        }
      }
    }
  }, [user, loading, requiredRole, router, redirectTo, allowUnauthenticated])

  return { user, loading, isAuthorized: !loading && !!user }
}

/**
 * Hook to check if user has specific role(s)
 */
export const useHasRole = (roles: UserRole | UserRole[]) => {
  const { user } = useAuth()
  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  return !!user && allowedRoles.includes(user.role as UserRole)
}

/**
 * Hook to redirect based on user role
 * Useful for landing pages that need different redirects for different user types
 */
export const useRoleBasedRedirect = () => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading || !user) return

    // Redirect based on role
    if (user.role === 'BUSINESS_OWNER') {
      router.push('/dashboard')
    } else if (user.role === 'CUSTOMER') {
      router.push('/search')
    }
  }, [user, loading, router])

  return { user, loading }
}