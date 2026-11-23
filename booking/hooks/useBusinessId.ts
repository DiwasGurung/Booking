'use client'

import { useAuth } from '@/context/authContext'

export type BusinessIdError = 'UNAUTHENTICATED' | 'NO_BUSINESS' | null

interface BusinessIdState {
  businessId: string | null
  loading: boolean
  error: BusinessIdError
}

/**
 * Resolves the current user's businessId from the auth context.
 *
 * The state is DERIVED from the auth context instead of copied into local
 * state with useEffect. That removes the extra render where loading was
 * false and businessId was still null.
 *
 * Fix for the setup-screen flash: while the auth context is still loading,
 * `user` is null. The old hook treated that as "not authenticated" and
 * stopped loading. Now we stay in `loading` until auth has finished.
 *
 * ADAPT: this assumes useAuth() exposes a loading flag named `loading`.
 * If yours is called `isLoading` / `authLoading` / `initializing`, rename it below.
 */
export const useBusinessId = (): BusinessIdState => {
  const { user, loading: authLoading } = useAuth() as {
    user: { business?: { id?: string }; businessId?: string } | null
    loading?: boolean
  }

  // Auth still resolving: do not decide anything yet
  if (authLoading) {
    return { businessId: null, loading: true, error: null }
  }

  // Auth finished and there is no user
  if (!user) {
    return { businessId: null, loading: false, error: 'UNAUTHENTICATED' }
  }

  // Support both shapes: user.business.id (context) and user.businessId (/auth/me)
  const id = user.business?.id ?? user.businessId ?? null

  if (!id) {
    return { businessId: null, loading: false, error: 'NO_BUSINESS' }
  }

  return { businessId: id, loading: false, error: null }
}