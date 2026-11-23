'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/authContext'

export type BusinessIdError = 'UNAUTHENTICATED' | 'NO_BUSINESS' | null

interface BusinessIdState {
  businessId: string | null
  loading: boolean
  error: BusinessIdError
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

/**
 * Resolves the current user's businessId.
 *
 * 1. Use the id already in the auth context when present.
 * 2. Right after login the context user comes from the login response, which
 *    may not include `business`. In that case ask /auth/me once (that is the
 *    data a page reload would have loaded) and stay in `loading` until it answers.
 *
 * ADAPT:
 *  - `loading` below assumes useAuth() exposes `loading`; rename if yours differs.
 *  - The fetch assumes cookie auth. If you send a Bearer token instead, add the
 *    Authorization header, or replace the fetch with your API client call.
 */
export const useBusinessId = (): BusinessIdState => {
  const { user, loading: authLoading } = useAuth() as {
    user: { id?: string; business?: { id?: string }; businessId?: string } | null
    loading?: boolean
  }

  const contextId = user?.business?.id ?? user?.businessId ?? null
  const userId = user?.id

  const [fallback, setFallback] = useState<{ done: boolean; id: string | null }>({
    done: false,
    id: null,
  })

  useEffect(() => {
    if (authLoading || !user || contextId) return

    let cancelled = false
    setFallback({ done: false, id: null })

    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        setFallback({ done: true, id: data?.businessId ?? data?.business?.id ?? null })
      })
      .catch(() => {
        if (!cancelled) setFallback({ done: true, id: null })
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, userId, contextId])

  if (authLoading) return { businessId: null, loading: true, error: null }
  if (!user) return { businessId: null, loading: false, error: 'UNAUTHENTICATED' }
  if (contextId) return { businessId: contextId, loading: false, error: null }

  // Logged in, no id in context: wait for the /auth/me answer
  if (!fallback.done) return { businessId: null, loading: true, error: null }
  if (fallback.id) return { businessId: fallback.id, loading: false, error: null }

  return { businessId: null, loading: false, error: 'NO_BUSINESS' }
}