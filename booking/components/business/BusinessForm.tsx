"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/card"
import { 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Mail, 
  Lock, 
  Building2, 
  User, 
  MapPin,
  Phone,
  CheckCircle2,
  Loader2
} from "lucide-react"
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

type RegistrationPath = "pending" | "login" | "new-user"
type Step = 1 | 2 | 3

export const UnifiedBusinessRegister = () => {
  const { user, loading, refreshUser, setToken } = useAuth()
  const router = useRouter()

  const [path, setPath] = useState<RegistrationPath>("pending")
  const [step, setStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Login form
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  })

  // User registration
  const [userForm, setUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Business registration
  const [businessForm, setBusinessForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Nepal",
    description: "",
  })

  // Check if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      setPath("new-user")
      setStep(2) // Skip to business info
    }
  }, [user, loading])

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError("")
  }

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError("")
  }

  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBusinessForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError("")
  }

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const result = await login(loginForm.email, loginForm.password)

      if (!result.success) {
        throw new Error(result.message || "Invalid email or password")
      }

      await refreshUser()
      await new Promise(resolve => setTimeout(resolve, 300))

      toast.success("Logged in successfully!")
      router.push("/register-business")
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Validate user form
  const validateUserForm = () => {
    if (!userForm.firstName.trim()) return "First name is required"
    if (!userForm.lastName.trim()) return "Last name is required"
    if (!userForm.email.trim()) return "Email is required"
    if (!userForm.password) return "Password is required"
    if (userForm.password.length < 6) return "Password must be at least 6 characters"
    if (userForm.password !== userForm.confirmPassword) return "Passwords do not match"
    return null
  }

  // Validate business form
  const validateBusinessForm = () => {
    if (!businessForm.name.trim()) return "Business name is required"
    if (!businessForm.email.trim()) return "Business email is required"
    if (!businessForm.phone.trim()) return "Phone number is required"
    if (!businessForm.category) return "Please select a category"
    if (!businessForm.address.trim()) return "Address is required"
    if (!businessForm.city.trim()) return "City is required"
    return null
  }

  // Handle next step
  const handleNextStep = () => {
    if (step === 1) {
      const validationError = validateUserForm()
      if (validationError) {
        setError(validationError)
        return
      }
    }
    setError("")
    setStep((step + 1) as Step)
  }

  // Handle previous step
  const handlePrevStep = () => {
    setError("")
    // If on step 1 or logged in user on step 2, go back to initial selection
    if (step === 1 || (step === 2 && user)) {
      setPath("pending")
      setStep(1)
      return
    }
    // Otherwise go to previous step
    if (step > 1) {
      setStep((step - 1) as Step)
    }
  }

  // Submit combined registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateBusinessForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      let token = ""
      let userId = user?.id

      // If new user, register first
      if (!user) {
        const userRes = await fetch(`${API_URL}/api/users/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: userForm.firstName,
            lastName: userForm.lastName,
            email: userForm.email,
            password: userForm.password,
          }),
        })

        if (!userRes.ok) {
          const data = await userRes.json().catch(() => ({}))
          throw new Error(data.error || data.message || "User registration failed")
        }

        const userData = await userRes.json()
        token = userData.token
        userId = userData.user.id

        if (token) {
          setToken(token)
        }
      }

      // Register business
      const businessRes = await fetch(`${API_URL}/api/businesses/setup/basic`, {
        method: "POST",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...businessForm,
          userId,
        }),
      })

      if (!businessRes.ok) {
        const data = await businessRes.json().catch(() => ({}))
        throw new Error(data.error || data.message || "Business registration failed")
      }

      if (token) {
        await refreshUser(token)
      } else {
        window.dispatchEvent(new Event('authStateChanged'))
      }

      await new Promise(resolve => setTimeout(resolve, 300))
      toast.success("Business registered successfully!")
      router.push("/subscription")

    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Initial selection screen
  if (path === "pending") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">Register Your Business</h1>
          <p className="text-muted-foreground">Start accepting bookings online in minutes</p>
        </div>

        <div className="grid gap-4">
          {/* New User */}
          <Card 
            className="p-6 cursor-pointer hover:border-primary hover:shadow-md transition-all group"
            onClick={() => { setPath("new-user"); setStep(1) }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground">I&apos;m new here</h3>
                <p className="text-sm text-muted-foreground">Create an account and set up your business</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </Card>

          {/* Existing User */}
          <Card 
            className="p-6 cursor-pointer hover:border-primary hover:shadow-md transition-all group"
            onClick={() => setPath("login")}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground">I have an account</h3>
                <p className="text-sm text-muted-foreground">Log in and add a new business</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </Card>

          {/* Customer signup */}
          <Link href="/register">
            <Card className="p-6 cursor-pointer hover:border-primary hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground">Just a customer</h3>
                  <p className="text-sm text-muted-foreground">Sign up to book appointments</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          </Link>
        </div>
      </div>
    )
  }

  // Login screen
  if (path === "login") {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <button 
          onClick={() => setPath("pending")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Log in to add a new business to your account</p>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                className="pl-10"
                value={loginForm.email}
                onChange={handleLoginChange}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                className="pl-10"
                value={loginForm.password}
                onChange={handleLoginChange}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : "Sign in"}
          </Button>
        </form>

        <div className="my-6">
          <Separator />
        </div>

        <GoogleSignInButton />

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <button 
            onClick={() => { setPath("new-user"); setStep(1) }}
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </button>
        </p>
      </div>
    )
  }

  // Multi-step registration form
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header with back button */}
      <button 
        onClick={handlePrevStep}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Progress indicator */}
      <div className="flex items-center gap-3 mb-8">
        {!user && (
          <>
            <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step > 1 ? "bg-primary text-primary-foreground" : step === 1 ? "border-2 border-primary text-primary" : "border-2 border-muted-foreground"
              }`}>
                {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : "1"}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Account</span>
            </div>
            <div className="flex-1 h-0.5 bg-muted">
              <div className={`h-full bg-primary transition-all ${step > 1 ? "w-full" : "w-0"}`} />
            </div>
          </>
        )}
        
        <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step > 2 ? "bg-primary text-primary-foreground" : step === 2 ? "border-2 border-primary text-primary" : "border-2 border-muted-foreground"
          }`}>
            {step > 2 ? <CheckCircle2 className="w-5 h-5" /> : user ? "1" : "2"}
          </div>
          <span className="text-sm font-medium hidden sm:inline">Business Info</span>
        </div>

        <div className="flex-1 h-0.5 bg-muted">
          <div className={`h-full bg-primary transition-all ${step > 2 ? "w-full" : "w-0"}`} />
        </div>

        <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 3 ? "border-2 border-primary text-primary" : "border-2 border-muted-foreground"
          }`}>
            {user ? "2" : "3"}
          </div>
          <span className="text-sm font-medium hidden sm:inline">Location</span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNextStep() }}>
        {/* Step 1: Account Info (only for new users) */}
        {step === 1 && !user && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Create your account</h2>
              <p className="text-muted-foreground">Enter your personal details to get started</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={userForm.firstName}
                  onChange={handleUserChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={userForm.lastName}
                  onChange={handleUserChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userEmail">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="userEmail"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10"
                  value={userForm.email}
                  onChange={handleUserChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userPassword">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="userPassword"
                  name="password"
                  type="password"
                  placeholder="At least 6 characters"
                  className="pl-10"
                  value={userForm.password}
                  onChange={handleUserChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  className="pl-10"
                  value={userForm.confirmPassword}
                  onChange={handleUserChange}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button 
                type="button"
                onClick={() => setPath("login")}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        )}

        {/* Step 2: Business Info */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Business information</h2>
              <p className="text-muted-foreground">Tell us about your business</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="businessName"
                  name="name"
                  placeholder="Your Business Name"
                  className="pl-10"
                  value={businessForm.name}
                  onChange={handleBusinessChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="businessEmail"
                    name="email"
                    type="email"
                    placeholder="business@example.com"
                    className="pl-10"
                    value={businessForm.email}
                    onChange={handleBusinessChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessPhone">Phone number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="businessPhone"
                    name="phone"
                    placeholder="98XXXXXXXX"
                    className="pl-10"
                    value={businessForm.phone}
                    onChange={handleBusinessChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Business category</Label>
              <Select
                value={businessForm.category}
                onValueChange={(value) => setBusinessForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
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

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <textarea
                id="description"
                name="description"
                placeholder="Tell customers about your business..."
                className="w-full min-h-24 p-3 border border-input rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                value={businessForm.description}
                onChange={handleBusinessChange}
              />
            </div>

            <Button type="submit" className="w-full">
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Business location</h2>
              <p className="text-muted-foreground">Where is your business located?</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Street address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="address"
                  name="address"
                  placeholder="123 Main Street"
                  className="pl-10"
                  value={businessForm.address}
                  onChange={handleBusinessChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="Kathmandu"
                  value={businessForm.city}
                  onChange={handleBusinessChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  name="state"
                  placeholder="Bagmati"
                  value={businessForm.state}
                  onChange={handleBusinessChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP/Postal code</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  placeholder="44600"
                  value={businessForm.zipCode}
                  onChange={handleBusinessChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  placeholder="Nepal"
                  value={businessForm.country}
                  onChange={handleBusinessChange}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating your business...
                </>
              ) : (
                <>
                  Complete Registration
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
