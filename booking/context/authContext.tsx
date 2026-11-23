"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
const TOKEN_KEY = "authToken"

export interface User {
  isVerified: boolean
  verified: boolean
  isPhoneVerified: boolean
  createdAt: any
  name: string
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: "CUSTOMER" | "BUSINESS_OWNER"
  googleId?: string
  authProvider?: "EMAIL" | "GOOGLE"
  isEmailVerified: boolean
  businessId?: string | null
  business?: {
    id: string
    name?: string
  } | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  isAuthenticated: boolean
  /** Re-reads the session. Await it BEFORE navigating after a login. */
  refreshUser: (token?: string) => Promise<User | null>
  setToken: (token: string) => void
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const readStoredToken = (): string | null => {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setTokenState] = useState<string | null>(null)

  // Refs always hold the latest values, so callbacks never read stale state
  const tokenRef = useRef<string | null>(null)
  const requestIdRef = useRef(0)

  const setToken = useCallback((newToken: string) => {
    tokenRef.current = newToken
    setTokenState(newToken)
    try {
      localStorage.setItem(TOKEN_KEY, newToken)
    } catch {
      // storage unavailable (private mode etc.); the cookie still works
    }
  }, [])

  const clearToken = useCallback(() => {
    tokenRef.current = null
    setTokenState(null)
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // ignore
    }
  }, [])

  const checkAuth = useCallback(
    async (authToken?: string): Promise<User | null> => {
      // Only the most recent call is allowed to change state
      const requestId = ++requestIdRef.current

      const bearer = authToken || tokenRef.current || readStoredToken()

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      let result: User | null = null
      let rejected = false // true only when the server says "not authenticated"

      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (bearer) headers["Authorization"] = `Bearer ${bearer}`

        const response = await fetch(`${API_URL}/api/users/me`, {
          credentials: "include", // httpOnly cookie
          headers,
          signal: controller.signal,
        })

        if (response.ok) {
          const data = await response.json()
          // Support both { user: {...} } and a flat user object
          result = data?.user ?? (data?.id ? data : null)
        } else if (response.status === 401 || response.status === 403) {
          rejected = true
        }
        // Other statuses (5xx): keep the current user, do not log out
      } catch {
        // Network error / timeout: keep the current user, do not log out
      } finally {
        clearTimeout(timeoutId)
      }

      // A newer request has started: ignore this (possibly stale) result
      if (requestId !== requestIdRef.current) return result

      if (result) {
        setUser(result)
      } else if (rejected) {
        setUser(null)
        clearToken() // drop an expired / invalid token
      }

      setLoading(false)
      return result
    },
    [clearToken]
  )

  const refreshUser = useCallback(
    async (authToken?: string): Promise<User | null> => {
      if (authToken) setToken(authToken)
      setLoading(true)
      return checkAuth(authToken)
    },
    [checkAuth, setToken]
  )

  // Initial auth check: hydrate the token from localStorage first
  useEffect(() => {
    const stored = readStoredToken()
    if (stored) {
      tokenRef.current = stored
      setTokenState(stored)
    }
    checkAuth(stored || undefined)
  }, [checkAuth])

  // Listen for auth changes (custom event in this tab, storage event from other tabs)
  useEffect(() => {
    const handleAuthChange = () => {
      setLoading(true)
      checkAuth()
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY || e.key === null) handleAuthChange()
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener("authStateChanged", handleAuthChange)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("authStateChanged", handleAuthChange)
    }
  }, [checkAuth])

  const logout = useCallback(async () => {
    requestIdRef.current++ // invalidate any in-flight check
    try {
      await fetch(`${API_URL}/api/users/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch {
      // ignore: we clear local state regardless
    } finally {
      setUser(null)
      clearToken()
      setLoading(false)
      // httpOnly cookie is cleared by the backend on logout
    }
  }, [clearToken])

  return (
    <AuthContext.Provider
      value={{ user, loading, logout, isAuthenticated: !!user, refreshUser, setToken, token }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}