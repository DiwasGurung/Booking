'use client'

import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL // e.g. https://api.appoint-nepal.com

export function usePublicBusiness(identifier: string) {
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!identifier) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setNotFound(false)
      setError(false)
      try {
        const res = await fetch(
          `${API_URL}/api/businesses/public/${encodeURIComponent(identifier)}`
        )
        if (res.status === 404) {
          if (!cancelled) setNotFound(true)
          return
        }
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        if (cancelled) return
        setBusiness(data)

        // Old ID link: swap the address bar to the slug without a reload
        if (data.slug && identifier !== data.slug) {
          window.history.replaceState(null, '', `/book/${data.slug}`)
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [identifier])

  return { business, loading, notFound, error }
}