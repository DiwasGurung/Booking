"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/Button"
import { AlertCircle, ArrowRight, Mail, Lock } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { BUSINESS_CATEGORIES } from "@/components/constants/businessCategories"
import { useAuth } from "@/context/authContext"
import { login } from "@/lib/auth"
import { GoogleSignInButton } from "@/components/google-signin-button"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export const UnifiedBusinessRegister = () => {
  const { user, loading, refreshUser, setToken } = useAuth()
  const router = useRouter()

  const [registrationStatus, setRegistrationStatus] = useState<"pending" | "registered" | "new">("pending")
  const [mode, setMode] = useState<"user-business" | "business-only" | "login">("user-business")
  const [isLoadingForm, setIsLoadingForm] = useState(false)
  const [error, setError] = useState("")

  // Login form fields
  const [loginFormData, setLoginFormData] = useState({
    email: "",
    password: "",
  })

  // User registration fields
  const [userFormData, setUserFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Business registration fields
  const [businessFormData, setBusinessFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    description: "",
    website: "",
  })

  // Determine mode based on auth state
  useEffect(() => {
    if (!loading) {
      if (user) {
        setMode("business-only")
        setRegistrationStatus("registered")
      } else {
        setMode("user-business")
        setRegistrationStatus("pending")
      }
    }
  }, [user, loading])

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setUserFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleBusinessChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setBusinessFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleBusinessCategoryChange = (value: string) => {
    setBusinessFormData((prev) => ({ ...prev, category: value }))
  }

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoadingForm(true)
    setError("")

    try {
      const result = await login(loginFormData.email, loginFormData.password)

      if (!result.success) {
        setError(result.message || "Invalid email or password")
        setIsLoadingForm(false)
        return
      }

      console.log("[v0] Login successful, refreshing user from cookies...")
      
      // Refresh auth context to load user data via httpOnly cookies
      await refreshUser()
      await new Promise(resolve => setTimeout(resolve, 300))

      console.log("[v0] Login successful, navigating to business registration")
      toast.success("Logged in successfully!")
      
      // Navigate to business registration page
      router.push("/register-business")

    } catch (error: any) {
      console.error("[v0] Login error:", error)
      setError(error.message || "Login failed")
      toast.error(error.message || "Login failed")
    } finally {
      setIsLoadingForm(false)
    }
  }

  // Combined registration (user + business)
  const handleCombinedSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoadingForm(true)
    setError("")

    try {
      if (userFormData.password !== userFormData.confirmPassword) {
        throw new Error("Passwords do not match")
      }

      console.log("[v0] Starting combined user and business registration")

      // Step 1: Register user
      console.log("[v0] Registering user account")
      const userRes = await fetch(`${API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: userFormData.firstName,
          lastName: userFormData.lastName,
          email: userFormData.email,
          password: userFormData.password,
        }),
      })

      if (!userRes.ok) {
        const data = await userRes.json().catch(() => ({}))
        throw new Error(data.error || data.message || "User registration failed")
      }

      const userData = await userRes.json()
      console.log("[v0] User registered successfully, setting up business")

      // Store token in auth context for future requests
      if (userData.token) {
        setToken(userData.token)
      }

      // Step 2: Register business for the new user
      console.log("[v0] Registering business for new user")
      const businessRes = await fetch(`${API_URL}/api/businesses/setup/basic`, {
        method: "POST",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
          // Send the token from user registration in Authorization header
          "Authorization": `Bearer ${userData.token}`
        },
        body: JSON.stringify({
          ...businessFormData,
          userId: userData.user.id,
        }),
      })

      if (!businessRes.ok) {
        const data = await businessRes.json().catch(() => ({}))
        throw new Error(data.error || data.message || "Business registration failed")
      }

      const businessData = await businessRes.json()
      console.log("[v0] Business created successfully:", businessData.id)

      // Refresh user data with token
      await refreshUser(userData.token)
      await new Promise(resolve => setTimeout(resolve, 300))

      toast.success("Account and business registered successfully!")
      router.push("/subscription")

    } catch (err: any) {
      console.error("[v0] Combined registration error:", err.message)
      setError(err.message)
      toast.error(err.message)
    } finally {
      setIsLoadingForm(false)
    }
  }

  // Business-only registration (for logged-in users)
  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoadingForm(true)
    setError("")

    try {
      if (!user) {
        throw new Error("You must be logged in to register a business")
      }

      console.log("[v0] Registering business for logged-in user:", user.id)

      const res = await fetch(`${API_URL}/api/businesses/setup/basic`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...businessFormData,
          userId: user.id,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || data.message || "Business registration failed")
      }

      const data = await res.json()
      console.log("[v0] Business registered successfully:", data.id)

      window.dispatchEvent(new Event('authStateChanged'))

      toast.success("Business registered successfully!")
      router.push("/subscription")

    } catch (err: any) {
      console.error("[v0] Business registration error:", err.message)
      setError(err.message)
      toast.error(err.message)
    } finally {
      setIsLoadingForm(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // STEP 1: Ask if user is registered or new
  if (registrationStatus === "pending") {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Register Your Business</h1>
          <p className="text-muted-foreground">Let's get started with your business setup</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Already Registered Option */}
          <button
            onClick={() => {
              setRegistrationStatus("registered")
              setMode("login")
            }}
            className="p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition space-y-3 text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">I&apos;m already registered</h3>
                <p className="text-sm text-muted-foreground">Log in and add a new business</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>

          {/* New User Option */}
          <button
            onClick={() => {
              setRegistrationStatus("new")
              setMode("user-business")
            }}
            className="p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition space-y-3 text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">I&apos;m new here</h3>
                <p className="text-sm text-muted-foreground">Create account and set up business</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>

          {/* Simple User Option */}
          <Link
            href="/signup"
            className="p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition space-y-3 text-left block"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">Just a customer</h3>
                <p className="text-sm text-muted-foreground">Register as a simple user</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-2">Register Your Business</h1>
      <p className="text-muted-foreground mb-8">
        {mode === "login"
          ? "Log in to your account"
          : user
          ? "Add a new business to your account"
          : "Create your account and register your business"}
      </p>

      {error && (
        <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-destructive text-sm font-medium">{error}</p>
        </div>
      )}

      {/* LOGIN FORM - for registered users */}
      {mode === "login" && (
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-muted-foreground text-sm">Log in to your account and set up your business</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-sm font-medium">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="name@company.com"
                  className="pl-9"
                  name="email"
                  value={loginFormData.email}
                  onChange={handleLoginChange}
                  disabled={isLoadingForm}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-9"
                  name="password"
                  value={loginFormData.password}
                  onChange={handleLoginChange}
                  disabled={isLoadingForm}
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoadingForm} className="w-full h-10 font-medium" size="lg">
              {isLoadingForm ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <Separator />
            <GoogleSignInButton />
          </div>

          <div className="mt-6 pt-6 border-t border-border space-y-4">
            <button
              type="button"
              onClick={() => setRegistrationStatus("pending")}
              className="w-full text-sm text-muted-foreground hover:text-primary transition"
            >
              Back to options
            </button>
          </div>
        </div>
      )}

      {/* NEW USER + BUSINESS REGISTRATION */}
      {mode === "user-business" && registrationStatus === "new" && (
        <form onSubmit={handleCombinedSubmit} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 pb-4 border-b">Create Your Account</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="First Name"
                name="firstName"
                value={userFormData.firstName}
                onChange={handleUserChange}
                required
              />
              <InputField
                label="Last Name"
                name="lastName"
                value={userFormData.lastName}
                onChange={handleUserChange}
                required
              />
            </div>
            <InputField
              label="Email"
              name="email"
              type="email"
              value={userFormData.email}
              onChange={handleUserChange}
              required
            />
            <InputField
              label="Password"
              name="password"
              type="password"
              value={userFormData.password}
              onChange={handleUserChange}
              required
            />
            <InputField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={userFormData.confirmPassword}
              onChange={handleUserChange}
              required
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 pb-4 border-b">Business Information</h2>
            <InputField
              label="Business Name"
              name="name"
              value={businessFormData.name}
              onChange={handleBusinessChange}
              required
            />
            <InputField
              label="Business Email"
              name="email"
              type="email"
              value={businessFormData.email}
              onChange={handleBusinessChange}
              required
            />
            <InputField
              label="Phone"
              name="phone"
              value={businessFormData.phone}
              onChange={handleBusinessChange}
              required
            />

            <div className="space-y-2 mb-4">
              <Label>Category</Label>
              <Select
                value={businessFormData.category}
                onValueChange={handleBusinessCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business category" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <InputField
              label="Address"
              name="address"
              value={businessFormData.address}
              onChange={handleBusinessChange}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="City"
                name="city"
                value={businessFormData.city}
                onChange={handleBusinessChange}
                required
              />
              <InputField
                label="State"
                name="state"
                value={businessFormData.state}
                onChange={handleBusinessChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Zip Code"
                name="zipCode"
                value={businessFormData.zipCode}
                onChange={handleBusinessChange}
                required
              />
              <InputField
                label="Country"
                name="country"
                value={businessFormData.country}
                onChange={handleBusinessChange}
                required
              />
            </div>

            <InputField
              label="Website"
              name="website"
              value={businessFormData.website}
              onChange={handleBusinessChange}
            />
            <InputField
              label="Description"
              name="description"
              value={businessFormData.description}
              onChange={handleBusinessChange}
              textarea
            />
          </div>

          <Button type="submit" disabled={isLoadingForm} className="w-full h-10 font-medium">
            {isLoadingForm ? "Registering..." : "Create Account & Register Business"}
          </Button>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setRegistrationStatus("pending")}
            >
              Back
            </Button>
          </div>
        </form>
      )}

      {/* BUSINESS-ONLY REGISTRATION (for logged-in users) */}
      {mode === "business-only" && (
        <form onSubmit={handleBusinessSubmit} className="space-y-4">
          <InputField
            label="Business Name"
            name="name"
            value={businessFormData.name}
            onChange={handleBusinessChange}
            required
          />
          <InputField
            label="Business Email"
            name="email"
            type="email"
            value={businessFormData.email}
            onChange={handleBusinessChange}
            required
          />
          <InputField
            label="Phone"
            name="phone"
            value={businessFormData.phone}
            onChange={handleBusinessChange}
            required
          />

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={businessFormData.category}
              onValueChange={handleBusinessCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business category" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <InputField
            label="Address"
            name="address"
            value={businessFormData.address}
            onChange={handleBusinessChange}
            required
          />
          <InputField
            label="City"
            name="city"
            value={businessFormData.city}
            onChange={handleBusinessChange}
            required
          />
          <InputField
            label="State"
            name="state"
            value={businessFormData.state}
            onChange={handleBusinessChange}
            required
          />
          <InputField
            label="Zip Code"
            name="zipCode"
            value={businessFormData.zipCode}
            onChange={handleBusinessChange}
            required
          />
          <InputField
            label="Country"
            name="country"
            value={businessFormData.country}
            onChange={handleBusinessChange}
            required
          />
          <InputField
            label="Website"
            name="website"
            value={businessFormData.website}
            onChange={handleBusinessChange}
          />
          <InputField
            label="Description"
            name="description"
            value={businessFormData.description}
            onChange={handleBusinessChange}
            textarea
          />

          <Button type="submit" disabled={isLoadingForm} className="w-full h-10 font-medium">
            {isLoadingForm ? "Registering..." : "Register Business"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setRegistrationStatus("pending")}
          >
            Back
          </Button>
        </form>
      )}
    </div>
  )
}

interface InputFieldProps {
  label: string
  name: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  required?: boolean
  textarea?: boolean
}

const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  textarea = false,
}: InputFieldProps) => {
  return (
    <div className="space-y-1 mb-4">
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
      </Label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full p-2 border border-border rounded-md resize-none"
          rows={4}
        />
      ) : (
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
        />
      )}
    </div>
  )
}
