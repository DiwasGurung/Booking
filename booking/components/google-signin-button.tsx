"use client"

import { useGoogleLogin } from "@react-oauth/google"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { AlertCircle } from "lucide-react"
import Image from "next/image"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export const GoogleSignInButton = () => {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setIsLoading(true)
      setError("")

      try {
        
        const response = await fetch(`${API_URL}/api/auth/google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Important for sending cookies
          body: JSON.stringify({
            access_token: codeResponse.access_token,
          }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          console.error("[v0] Google sign-in failed:", response.status, data)
          
          // Check if it's a backend connection error
          if (response.status === 0 || !response.statusText) {
            throw new Error("Backend server is not running. Make sure your Express server is running on port 5001.")
          }
          
          throw new Error(data.error || data.message || "Google sign-in failed")
        }

        const data = await response.json()

        // Dispatch custom event to notify auth context of state change
        // httpOnly cookie is automatically sent and stored by backend
        window.dispatchEvent(new Event('authStateChanged'))

        // Redirect to appropriate page
        if (data.user?.role === "BUSINESS_OWNER") {
          router.push(`/dashboard/${data.user.businessId}`)
        } else {
          router.push("/search")
        }
      } catch (err: any) {
        console.error("[v0] Google sign-in error:", err.message)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    },
    onError: (error) => {
      console.error("[v0] Google login error:", error)
      setError("Failed to sign in with Google")
    },
    flow: "implicit",
  })

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
          <p className="text-destructive text-sm font-medium">{error}</p>
        </div>
      )}
      
      <Button
        type="button"
        onClick={() => login()}
        disabled={isLoading}
        variant="outline"
        className="w-full h-10 font-medium flex items-center justify-center gap-2"
        size="lg"
      >
        <Image
          src="/google-svg.png"
          alt="Google logo"
          width={20}
          height={20}
        />
        {isLoading ? "Signing in..." : "Continue with Google"}
      </Button>
    </div>
  )
}
