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
 * State is derived (no useEffect/useState), and it waits for the auth
 * context to finish loading, so there is no "no business" flash.
 */
export const useBusinessId = (): BusinessIdState => {
  const { user, loading: authLoading } = useAuth()

  if (authLoading) return { businessId: null, loading: true, error: null }
  if (!user) return { businessId: null, loading: false, error: 'UNAUTHENTICATED' }

  const id = user.business?.id ?? user.businessId ?? null
  if (!id) return { businessId: null, loading: false, error: 'NO_BUSINESS' }

  return { businessId: id, loading: false, error: null }
}