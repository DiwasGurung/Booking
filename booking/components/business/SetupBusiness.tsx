"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/label"
import { AlertCircle, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { BUSINESS_CATEGORIES } from "@/components/constants/businessCategories"
import { useAuth } from "@/context/authContext"

interface BusinessFormData {
  userId: string
  name: string
  email: string
  phone: string
  category: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  website: string
  description: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export const SetupBusinessForm = () => {
  const { user, refreshUser, token } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentStep, setCurrentStep] = useState<"basic" | "location" | "details" | "review">("basic")

  const [formData, setFormData] = useState<BusinessFormData>({
    userId: user?.id || "", 
    name: "",
    email: "",
    phone: "",
    category: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    website: "",
    description: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
    }))
  }

  const isBasicStepValid = () => {
    return formData.name && formData.email && formData.phone && formData.category
  }

  const isLocationStepValid = () => {
    return formData.address && formData.city && formData.state && formData.zipCode && formData.country
  }

  const handleNextStep = () => {
    if (currentStep === "basic" && !isBasicStepValid()) {
      toast.error("Please fill in all required fields in this section")
      return
    }
    if (currentStep === "location" && !isLocationStepValid()) {
      toast.error("Please fill in all location fields")
      return
    }

    const steps: Array<"basic" | "location" | "details" | "review"> = ["basic", "location", "details", "review"]
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const handlePrevStep = () => {
    const steps: Array<"basic" | "location" | "details" | "review"> = ["basic", "location", "details", "review"]
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Check if user is authenticated
    if (!user) {
      setError("You must be logged in to create a business")
      setIsLoading(false)
      return
    }

    try {
      // Prioritize localStorage token (most reliable), then fall back to context token
      let currentToken = null
      if (typeof window !== 'undefined') {
        currentToken = localStorage.getItem('authToken')
      }
      if (!currentToken) {
        currentToken = token
      }

      console.log('[v0] SetupBusinessForm: token from localStorage:', !!(typeof window !== 'undefined' && localStorage.getItem('authToken')))
      console.log('[v0] SetupBusinessForm: token from context:', !!token)
      console.log('[v0] SetupBusinessForm: using token:', !!currentToken)
      console.log('[v0] SetupBusinessForm: user data:', { userId: user?.id, role: user?.role, email: user?.email })

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`
        console.log('[v0] SetupBusinessForm: Authorization header set')
      } else {
        console.warn('[v0] SetupBusinessForm: No token available!')
      }

      const response = await fetch(`${API_URL}/api/businesses`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(formData),
      })

      console.log('[v0] SetupBusinessForm: API response status:', response.status)

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const errorMsg = data.error || data.message || data.details || "Failed to register business"
        console.error('[v0] Business setup error response:', data)
        throw new Error(errorMsg)
      }

      const businessData = await response.json()
      console.log("[v0] Business registered successfully:", businessData.id)

      // Refresh user to update role and business info
      console.log("[v0] Refreshing user data after business registration...")
      await refreshUser()
      console.log("[v0] User data refreshed")
      
      // Small delay to ensure role update is processed
      await new Promise(resolve => setTimeout(resolve, 500))

      toast.success("Business registered successfully!")
      console.log("[v0] About to redirect to /subscription")
      // Add a parameter to indicate we're coming from setup to prevent auto-redirects
      router.push("/subscription?from=setup")
      console.log("[v0] Redirect call made")
    } catch (error: any) {
      console.error("[v0] Business registration error:", error)
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Setup Your Business</h1>
          <p className="text-muted-foreground text-sm">
            Follow the steps to complete your business registration
          </p>
        </div>

        {/* Step Progress Indicator */}
        <div className="mb-8 flex gap-2">
          {(["basic", "location", "details", "review"] as const).map((step, index) => {
            const steps: Array<"basic" | "location" | "details" | "review"> = ["basic", "location", "details", "review"]
            const currentIndex = steps.indexOf(currentStep)
            const stepIndex = steps.indexOf(step)
            const isCompleted = stepIndex < currentIndex
            const isCurrent = step === currentStep

            return (
              <div key={step} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => setCurrentStep(step)}
                  className={`w-8 h-8 rounded-full font-semibold text-sm flex items-center justify-center transition ${
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </button>
                {index < 3 && (
                  <div
                    className={`flex-1 h-1 rounded-full ${
                      isCompleted ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Basic Information */}
          {currentStep === "basic" && (
            <div className="bg-card/50 border border-border rounded-lg p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Business Information</h2>
                <p className="text-sm text-muted-foreground">Enter your basic business details</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Business Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Business Name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Business Email *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="business@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Business Category *
                </Label>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your business category" />
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
            </div>
          )}

          {/* STEP 2: Location */}
          {currentStep === "location" && (
            <div className="bg-card/50 border border-border rounded-lg p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Business Location</h2>
                <p className="text-sm text-muted-foreground">Where is your business located?</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Street Address *
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Business Street"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City *
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    State / Province *
                  </Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-sm font-medium">
                    Zip / Postal Code *
                  </Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="12345"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium">
                    Country *
                  </Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Country"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Additional Details */}
          {currentStep === "details" && (
            <div className="bg-card/50 border border-border rounded-lg p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Additional Details</h2>
                <p className="text-sm text-muted-foreground">Tell us more about your business</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-medium">
                  Website (Optional)
                </Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Business Description (Optional)
                </Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell us about your business, services, and what makes you unique..."
                  rows={5}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {currentStep === "review" && (
            <div className="bg-card/50 border border-border rounded-lg p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Review Your Information</h2>
                <p className="text-sm text-muted-foreground">Please confirm all details are correct</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Business Name</p>
                    <p className="font-medium">{formData.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium">{formData.category || "—"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{formData.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{formData.phone || "—"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Address</p>
                    <p className="font-medium">{formData.address || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">City, State</p>
                    <p className="font-medium">{formData.city && formData.state ? `${formData.city}, ${formData.state}` : "—"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Zip Code</p>
                    <p className="font-medium">{formData.zipCode || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Country</p>
                    <p className="font-medium">{formData.country || "—"}</p>
                  </div>
                </div>

                {formData.website && (
                  <div>
                    <p className="text-muted-foreground">Website</p>
                    <p className="font-medium">{formData.website}</p>
                  </div>
                )}

                {formData.description && (
                  <div>
                    <p className="text-muted-foreground">Description</p>
                    <p className="font-medium line-clamp-2">{formData.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handlePrevStep}
              disabled={currentStep === "basic"}
            >
              Back
            </Button>
            {currentStep !== "review" ? (
              <Button type="button" onClick={handleNextStep} className="flex-1 gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading} className="flex-1 gap-2">
                {isLoading ? (
                  "Completing Setup..."
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
