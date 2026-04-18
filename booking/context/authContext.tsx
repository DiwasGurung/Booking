"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export interface User {
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setTokenState] = useState<string | null>(null)

  const setToken = (newToken: string) => {
    console.log("[v0] Token stored in auth context")
    setTokenState(newToken)
  }

  const checkAuth = async (authToken?: string) => {
    try {
      console.log("[v0] Checking authentication with backend:", API_URL)

      // Use provided token or stored token
      const bearerToken = authToken || token
  
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
        console.log("[v0] Using Bearer token for authentication")
      }

      const response = await fetch(`${API_URL}/api/users/me`, {
        credentials: "include",
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const userData = await response.json()
        console.log("[v0] User authenticated successfully:", userData.user?.id || userData.user?.email)
        console.log("[v0] User data:", userData.user)
        setUser(userData.user)
      } else if (response.status === 401) {
        console.log("[v0] User not authenticated (401)")
        setUser(null)
      } else {
        console.log("[v0] Auth check returned status:", response.status)
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
    console.log("[v0] Refreshing user data...")
    setLoading(true)
    await checkAuth(authToken)
  }

  // Initial auth check
  useEffect(() => {
    checkAuth()
  }, [])

  // Listen for auth changes (e.g., after Google sign-in or register)
  useEffect(() => {
    const handleAuthChange = () => {
      console.log("[v0] Auth state change detected, refreshing user data")
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
      console.log("[v0] Logging out...")
      await fetch(`${API_URL}/api/users/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("[v0] Logout error:", error)
    } finally {
      setUser(null)
      // httpOnly cookie is cleared by backend on logout
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, logout, isAuthenticated: !!user, refreshUser, setToken }}
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

