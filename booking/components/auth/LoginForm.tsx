"use client"

import type React from "react"
import { useState } from "react"
import { login } from "@/lib/auth"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Lock, Mail, CheckCircle, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/context/authContext"
import { GoogleSignInButton } from "@/components/google-signin-button"
import { Separator } from "@/components/ui/separator"

export const LoginForm = () => {
  const { refreshUser, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
   const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Validate inputs
      if (!email || !password) {
        setError("Please enter both email and password")
        setIsLoading(false)
        return
      }

      console.log("[v0] Attempting login for:", email)

      // Call the centralized login function from auth.ts
      const result = await login(email, password)

      if (!result.success) {
        // Check if email verification is needed
        if (result.emailNotVerified) {
          console.log("[v0] Email not verified, showing inline verification prompt:", email)
          setNeedsEmailVerification(true)
          setUnverifiedEmail(email)
          setError("")
          setIsLoading(false)
          return
        }

        console.log("[v0] Login failed:", result.message)
        setError(result.message || "Invalid email or password")
        setIsLoading(false)
        return
      }

      console.log("[v0] Login successful, refreshing auth context...")

      // Refresh the auth context to get the latest user data via cookies
      await refreshUser()

      // Small delay to ensure context updates before navigation
      await new Promise(resolve => setTimeout(resolve, 500))

      console.log("[v0] Login completed, determining redirect path...")
      console.log("[v0] User:", user, "User role:", result.user?.role, "returnTo:", returnTo)

      // If returnTo is specified (e.g., from home page "Setup Business" button), use it
      if (returnTo) {
        console.log("[v0] Redirecting to returnTo:", returnTo)
        router.push(returnTo)
        return
      }

      // Role-based redirects
      if (result.user?.role === 'BUSINESS_OWNER') {
        // Get business ID for business owners
        const businessId = user?.business?.id
    
        if (businessId) {
          console.log("[v0] Redirecting BUSINESS_OWNER to dashboard with businessId:", businessId)
          router.push(`/dashboard/${businessId}`)
        } else {
          console.log("[v0] BUSINESS_OWNER but no businessId, redirecting to /dashboard")
          router.push("/dashboard")
        }
      } else if (result.user?.role === 'CUSTOMER') {
        // Customers go to search/bookings page
        console.log("[v0] Redirecting CUSTOMER to search page")
        router.push("/search")
      } else if (result.user?.role === 'ADMIN') {
        // Admins go to admin dashboard
        console.log("[v0] Redirecting ADMIN to admin dashboard")
        router.push("/admin")
      } else {
        // Default fallback
        console.log("[v0] Unknown role or no role, redirecting to search")
        router.push("/search")
      }

    } catch (error) {
      console.error("[v0] Login error:", error)
      const errorMessage = error instanceof Error ? error.message : "An error occurred"

      if (errorMessage.includes("Failed to fetch")) {
        setError(
          "Cannot reach the server. Make sure the backend is running at " +
          (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001")
        )
      } else if (errorMessage.includes("Unauthorized") || errorMessage.includes("401")) {
        setError("Invalid email or password. Please try again.")
      } else {
        setError(errorMessage || "An error occurred. Please try again.")
      }
      setIsLoading(false)
    }
  }

  const handleVerifyEmail = () => {
    console.log("[v0] Navigating to verify email page for:", unverifiedEmail)
    router.push(`/verify-email?email=${unverifiedEmail}`)
  }

  const handleResendCode = () => {
    console.log("[v0] Navigating to verify email page with resend action for:", unverifiedEmail)
    router.push(`/verify-email?email=${unverifiedEmail}&action=resend`)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {needsEmailVerification ? (
        // Verification Prompt Card
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Verify Your Email</h1>
            <p className="text-muted-foreground text-sm">Complete your account setup to continue</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <Mail className="w-6 h-6 text-blue-600 mt-1" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Email Verification Required</h3>
                <p className="text-sm text-blue-800 mb-3">
                  A 6-digit verification code was sent to <strong>{unverifiedEmail}</strong>
                </p>
                <p className="text-sm text-blue-700">
                  Check your inbox (and spam folder) for the verification code.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleVerifyEmail}
              size="lg"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Enter Verification Code
            </Button>

            <Button 
              onClick={handleResendCode}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Didn&apos;t receive the code? Resend
            </Button>
          </div>

          <div className="text-center pt-4 border-t border-border">
            <button
              onClick={() => {
                setNeedsEmailVerification(false)
                setEmail("")
                setPassword("")
                setUnverifiedEmail("")
              }}
              className="text-sm text-primary hover:underline"
            >
              Try with a different email
            </button>
          </div>
        </div>
      ) : (
        // Login Form
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground text-sm">Sign in to your booking account to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-destructive text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

             <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="pl-9 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-10 font-medium" size="lg">
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <Separator />
            <GoogleSignInButton />
          </div>

          <div className="mt-6 pt-6 border-t border-border space-y-4">
            <p className="text-xs text-muted-foreground text-center">🔒 Your data is secure and encrypted</p>

            <div className="text-center text-sm">
              <p className="text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}


