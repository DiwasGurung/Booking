"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export interface User {
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
  business?: {
    id: string
    name?: string
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  isAuthenticated: boolean
  refreshUser: (token?: string) => Promise<void>
  setToken: (token: string) => void
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setTokenState] = useState<string | null>(null)

  const setToken = (newToken: string) => {
    setTokenState(newToken)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("authToken", newToken)
      } catch (e) {
        console.warn("[v0] Failed to persist token to localStorage", e)
      }
    }
  }

  const checkAuth = async (authToken?: string) => {
    try {

      // Use provided token, in-memory token, or persisted token
      const storedToken =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null
      const bearerToken = authToken || token || storedToken

      // Check if user is authenticated by calling the API
      // httpOnly cookie is automatically sent with credentials: 'include'
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      // If we have a token, send it in Authorization header
      if (bearerToken) {
        headers["Authorization"] = `Bearer ${bearerToken}`
      }

      const response = await fetch(`${API_URL}/api/users/me`, {
        credentials: "include",
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else if (response.status === 401) {
        setUser(null)
      } else if (response.status === 403) {
        setUser(null)
      } else {
        setUser(null)
      }
    } catch (error: any) {
      clearTimeout((error as any).timeoutId)
      if (error.name === "AbortError") {
        console.warn("[v0] Auth check timeout - backend not responding fast enough")
      } else {
        console.warn("[v0] Auth check error:", error.message)
      }
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async (authToken?: string) => {
    setLoading(true)
    await checkAuth(authToken)
  }

  // Initial auth check - hydrate token from localStorage first
  useEffect(() => {
    const storedToken =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    if (storedToken) {
      setTokenState(storedToken)
    }
    checkAuth(storedToken || undefined)
  }, [])

  // Listen for auth changes (e.g., after Google sign-in or register)
  useEffect(() => {
    const handleAuthChange = () => {
      setLoading(true)
      checkAuth()
    }

    // Listen for storage changes (cross-tab/window communication)
    window.addEventListener("storage", handleAuthChange)

    // Listen for custom auth event
    window.addEventListener("authStateChanged", handleAuthChange)

    return () => {
      window.removeEventListener("storage", handleAuthChange)
      window.removeEventListener("authStateChanged", handleAuthChange)
    }
  }, [])

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/users/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("[v0] Logout error:", error)
    } finally {
      setUser(null)
      setTokenState(null)
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken")
      }
      // httpOnly cookie is cleared by backend on logout
    }
  }

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

