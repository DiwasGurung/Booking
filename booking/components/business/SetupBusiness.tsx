"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { BUSINESS_CATEGORIES } from "@/components/constants/businessCategories"
import { NEPAL_PROVINCES, getDistrictsByProvince } from "@/components/constants/nepalLocations"
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

const STEPS = ["basic", "location", "details", "review"] as const
type Step = (typeof STEPS)[number]

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export const SetupBusinessForm = () => {
  const { user, refreshUser, token } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentStep, setCurrentStep] = useState<Step>("basic")

  // The email the user registered their account with, offered as a shortcut below.
  const accountEmail = user?.email?.trim() || ""
  const [useAccountEmail, setUseAccountEmail] = useState(false)

  const [formData, setFormData] = useState<BusinessFormData>({
    userId: user?.id || "",
    name: "",
    email: "",
    phone: "",
    category: "",
    address: "",
    city: "",
    state: "",
    zipCode: "0000",
    country: "Nepal",
    website: "",
    description: "",
  })

  // Districts available for the currently selected province.
  const availableDistricts = getDistrictsByProvince(formData.state)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    // Editing the email by hand means it is no longer mirroring the account email.
    if (name === "email" && useAccountEmail) {
      setUseAccountEmail(false)
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Checking the box copies the registered account email in; unchecking clears it for a fresh entry.
  const handleUseAccountEmailChange = (checked: boolean) => {
    if (checked && !accountEmail) return
    setUseAccountEmail(checked)
    setFormData((prev) => ({
      ...prev,
      email: checked ? accountEmail : "",
    }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
    }))
  }

  // Selecting a new province resets the city so you can never submit a mismatched pair.
  const handleStateChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      state: value,
      city: getDistrictsByProvince(value).includes(prev.city) ? prev.city : "",
    }))
  }

  const handleCityChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      city: value,
    }))
  }

  const isBasicStepValid = () => {
    return formData.name && formData.email && formData.phone && formData.category
  }

  const isLocationStepValid = () => {
    return formData.address && formData.state && formData.city && formData.country
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

    const currentIndex = STEPS.indexOf(currentStep)
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1])
    }
  }

  const handlePrevStep = () => {
    const currentIndex = STEPS.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!user) {
      setError("You must be logged in to create a business")
      setIsLoading(false)
      return
    }

    if (!isLocationStepValid()) {
      setError("Please select both a province and a district before submitting")
      setIsLoading(false)
      setCurrentStep("location")
      return
    }

    try {
      // Prioritize localStorage token (most reliable), then fall back to context token
      let currentToken: string | null = null
      if (typeof window !== "undefined") {
        currentToken = localStorage.getItem("authToken")
      }
      if (!currentToken) {
        currentToken = token
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (currentToken) {
        headers["Authorization"] = `Bearer ${currentToken}`
      } else {
      }

      const response = await fetch(`${API_URL}/api/businesses`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const errorMsg = data.error || data.message || data.details || "Failed to register business"
        throw new Error(errorMsg)
      }

      await response.json()

      // Refresh user to update role and business info
      await refreshUser()

      // Small delay to ensure role update is processed
      await new Promise((resolve) => setTimeout(resolve, 500))

      toast.success("Business registered successfully!")
      router.push("/subscription?from=setup")
    } catch (error: unknown) {
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
          <p className="text-muted-foreground text-sm">Follow the steps to complete your business registration</p>
        </div>

        {/* Step Progress Indicator */}
        <div className="mb-8 flex gap-2">
          {STEPS.map((step, index) => {
            const currentIndex = STEPS.indexOf(currentStep)
            const stepIndex = STEPS.indexOf(step)
            const isCompleted = stepIndex < currentIndex
            const isCurrent = step === currentStep

            return (
              <div key={step} className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => setCurrentStep(step)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`w-8 h-8 rounded-full font-semibold text-sm flex items-center justify-center transition ${isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                >
                  {index + 1}
                  <span className="sr-only">{step}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 rounded-full ${isCompleted ? "bg-primary" : "bg-muted"}`} />
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
                  aria-describedby="useAccountEmail-hint"
                  required
                />

                <div className="flex items-start gap-2 pt-1">
                  <Checkbox
                    id="useAccountEmail"
                    checked={useAccountEmail}
                    onCheckedChange={(checked) => handleUseAccountEmailChange(checked === true)}
                    disabled={!accountEmail}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="useAccountEmail"
                    className={`text-sm font-normal leading-relaxed ${accountEmail ? "text-muted-foreground cursor-pointer" : "text-muted-foreground/60"
                      }`}
                  >
                    Use my registered email
                    {accountEmail ? <span className="text-foreground font-medium"> ({accountEmail})</span> : null}
                  </Label>
                </div>
                <p id="useAccountEmail-hint" className="text-xs text-muted-foreground">
                  {!accountEmail
                    ? "No email is on your account yet, so enter your business email manually."
                    : useAccountEmail
                      ? "Your business email is synced with your account email. Uncheck to enter a different one."
                      : "Check the box above to reuse the email you signed up with."}
                </p>
              </div>

              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  handleChange({
                    ...e,
                    target: { ...e.target, name: "phone", value: digits },
                  });
                }}
                placeholder="98XXXXXXXX"
                required
                maxLength={10}
              />
              {formData.phone && formData.phone.length !== 10 && (
                <p className="text-sm text-destructive">Phone number must be 10 digits</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Business Category *
                </Label>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger id="category" className="w-full">
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
                {/* Province / State first — it drives the district list */}
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    Province / State *
                  </Label>
                  <Select value={formData.state} onValueChange={handleStateChange}>
                    <SelectTrigger id="state" className="w-full">
                      <SelectValue placeholder="Select a province" />
                    </SelectTrigger>
                    <SelectContent>
                      {NEPAL_PROVINCES.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* District / City — options depend on the selected province */}
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    District / City *
                  </Label>
                  <Select value={formData.city} onValueChange={handleCityChange} disabled={!formData.state}>
                    <SelectTrigger id="city" className="w-full">
                      <SelectValue placeholder={formData.state ? "Select a district" : "Select a province first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDistricts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.state && (
                    <p className="text-xs text-muted-foreground">
                      {availableDistricts.length} districts in {formData.state} Province
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium">
                  Country *
                </Label>
                <Input id="country" name="country" value={formData.country} onChange={handleChange} readOnly required />
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
                    <p className="text-muted-foreground">District, Province</p>
                    <p className="font-medium">
                      {formData.city && formData.state ? `${formData.city}, ${formData.state}` : "—"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
              className="flex-1 bg-transparent"
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
