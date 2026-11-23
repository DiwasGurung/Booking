'use client'

import { useEffect, useState } from 'react'

export type BusinessIdError = 'UNAUTHENTICATED' | 'NO_BUSINESS' | 'FETCH_FAILED' | null

interface State {
  businessId: string | null
  loading: boolean
  error: BusinessIdError
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 400

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Resolves the current user's businessId.
 *
 * Key behaviours:
 *  - `loading` starts as TRUE, so there is never a render with
 *    loading=false + businessId=null before the first fetch finishes
 *    (that was what flashed the "Set up business" card).
 *  - Only a real "user has no business" result yields NO_BUSINESS.
 *    Network errors / 401 right after login are retried and reported
 *    as FETCH_FAILED, never as "no business".
 *  - Cancels on unmount so a stale response can't overwrite state.
 *
 * ADAPT: replace the fetch below with your own API client call if you
 * have one (e.g. authApi.getCurrentUser()). It must return an object
 * with an optional `businessId`.
 */
export function useBusinessId(): State & { refetch: () => void } {
  const [state, setState] = useState<State>({
    businessId: null,
    loading: true,
    error: null,
  })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      setState((s) => ({ ...s, loading: true, error: null }))

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            credentials: 'include', // send the authToken cookie
            headers: { 'Content-Type': 'application/json' },
          })

          if (cancelled) return

          if (res.status === 401) {
            // Cookie may not be attached yet right after login: retry first
            if (attempt < MAX_ATTEMPTS) {
              await sleep(RETRY_DELAY_MS * attempt)
              continue
            }
            setState({ businessId: null, loading: false, error: 'UNAUTHENTICATED' })
            return
          }

          if (!res.ok) throw new Error(`HTTP ${res.status}`)

          const user = await res.json()
          if (cancelled) return

          if (user?.businessId) {
            setState({ businessId: user.businessId, loading: false, error: null })
          } else {
            // Authenticated, request succeeded, and user truly has no business
            setState({ businessId: null, loading: false, error: 'NO_BUSINESS' })
          }
          return
        } catch {
          if (cancelled) return
          if (attempt < MAX_ATTEMPTS) {
            await sleep(RETRY_DELAY_MS * attempt)
            continue
          }
          setState({ businessId: null, loading: false, error: 'FETCH_FAILED' })
        }
      }
    }

    resolve()
    return () => {
      cancelled = true
    }
  }, [nonce])

  return { ...state, refetch: () => setNonce((n) => n + 1) }
}