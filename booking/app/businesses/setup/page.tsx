'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowRight, Building2, MapPin, Phone, Globe, Info, Loader } from 'lucide-react'

interface BusinessFormData {
  businessName: string
  businessEmail: string
  businessPhone: string
  address: string
  city: string
  state: string
  zipCode: string
  description: string
  website?: string
  businessType: string
  taxId?: string
  businessHours: {
    monday: { open: string; close: string; closed: boolean }
    tuesday: { open: string; close: string; closed: boolean }
    wednesday: { open: string; close: string; closed: boolean }
    thursday: { open: string; close: string; closed: boolean }
    friday: { open: string; close: string; closed: boolean }
    saturday: { open: string; close: string; closed: boolean }
    sunday: { open: string; close: string; closed: boolean }
  }
}

export default function BusinessProfileSetupPage() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [useSameEmail, setUseSameEmail] = useState(true) // Default to same email
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)
  const [emailVerificationCode, setEmailVerificationCode] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [verifyingEmail, setVerifyingEmail] = useState(false)
  const [formData, setFormData] = useState<BusinessFormData>({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    description: '',
    website: '',
    businessType: 'salon',
    taxId: '',
    businessHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: true },
    }
  })

  // Check if business owner already has a business and fetch user email
  useEffect(() => {
    const checkExistingBusinessAndFetchEmail = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
        
        // Check if business exists
        const businessResponse = await fetch(`${baseUrl}/api/businesses/current`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (businessResponse.ok) {
          // Business already exists, redirect to dashboard
          console.log('[v0] Business already exists, redirecting to dashboard')
          router.push('/dashboard')
          return
        }

        // Fetch user email
        const userResponse = await fetch(`${baseUrl}/api/users/me`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (userResponse.ok) {
          const userData = await userResponse.json()
          const fetchedUserEmail = userData.email || userData.user?.email
          
          if (fetchedUserEmail) {
            // Store user email and pre-fill business email
            setUserEmail(fetchedUserEmail)
            setFormData(prev => ({
              ...prev,
              businessEmail: fetchedUserEmail
            }))
            console.log('[v0] Pre-filled business email with user email:', fetchedUserEmail)
          }
        }
      } catch (err) {
        // Business doesn't exist or error checking, allow to proceed with setup
        console.log('[v0] No existing business found, allowing setup')
      } finally {
        setChecking(false)
      }
    }

    checkExistingBusinessAndFetchEmail()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Send verification email if business email is different from user email
  const sendVerificationEmail = async () => {
    if (useSameEmail || formData.businessEmail === userEmail) {
      // Same email, no verification needed
      return true
    }

    try {
      setLoading(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      const response = await fetch(`${baseUrl}/api/users/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: formData.businessEmail }),
      })

      if (!response.ok) throw new Error('Failed to send verification email')
      
      setEmailVerificationSent(true)
      console.log('[v0] Email verification sent to:', formData.businessEmail)
      return false // Need verification
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification email')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Verify the business email with the code using existing endpoint
  const verifyBusinessEmail = async () => {
    try {
      setVerifyingEmail(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      const response = await fetch(`${baseUrl}/api/users/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          email: formData.businessEmail,
          code: verificationCode
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Invalid verification code')
      }
      
      console.log('[v0] Business email verified successfully')
      setEmailVerificationSent(false)
      setVerificationCode('')
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify email')
      return false
    } finally {
      setVerifyingEmail(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if business email verification is needed and done
      if (formData.businessEmail !== userEmail && !emailVerificationSent) {
        // Different email - need to verify first
        const needsVerification = await sendVerificationEmail()
        if (!needsVerification) {
          return // Verification email sent, wait for user to verify
        }
      }

      // If verification was sent but not yet completed
      if (emailVerificationSent) {
        setError('Please verify your business email first')
        return
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      const response = await fetch(`${baseUrl}/api/businesses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create business profile')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business profile')
      console.error('[v0] Error creating business:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
      {/* Loading state while checking for existing business */}
      {checking && (
        <div className="flex items-center justify-center min-h-screen">
          <Card className="p-8 text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Checking your business profile...</p>
          </Card>
        </div>
      )}

      {/* Setup form - only show when not checking */}
      {!checking && (
      <div className="mx-auto max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {[1, 2, 3].map(step => (
              <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                activeStep >= step ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
                {step}
              </div>
            ))}
          </div>
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((activeStep - 1) / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Set Up Your Business Profile</h1>
          <p className="text-muted-foreground">Let's get your business online. Fill in your details to get started.</p>
        </div>

        {/* Error */}
        {error && (
          <Card className="border border-red-200 bg-red-50 p-4 mb-6">
            <p className="text-red-900">{error}</p>
          </Card>
        )}

        {/* Form */}
        <Card className="border border-border shadow-lg p-8 mb-6">
          {/* Step 1: Basic Information */}
          {activeStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Basic Information</h2>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Business Name</label>
                <Input
                  name="businessName"
                  placeholder="Your business name"
                  value={formData.businessName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Email</label>
                  <Input
                    name="businessEmail"
                    type="email"
                    placeholder="business@example.com"
                    value={formData.businessEmail}
                    onChange={handleInputChange}
                    disabled={useSameEmail}
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="checkbox"
                      id="useSameEmail"
                      checked={useSameEmail}
                      onChange={(e) => {
                        const isChecked = e.target.checked
                        setUseSameEmail(isChecked)
                        if (isChecked && userEmail) {
                          console.log('[v0] Using same personal email:', userEmail)
                          setFormData(prev => ({
                            ...prev,
                            businessEmail: userEmail
                          }))
                        } else if (!isChecked) {
                          setFormData(prev => ({
                            ...prev,
                            businessEmail: ''
                          }))
                        }
                      }}
                      className="w-4 h-4 rounded border border-input cursor-pointer"
                    />
                    <label htmlFor="useSameEmail" className="text-sm font-medium text-foreground cursor-pointer">
                      {userEmail ? `Use my personal email (${userEmail})` : 'Loading personal email...'}
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Phone</label>
                  <Input
                    name="businessPhone"
                    placeholder="(555) 123-4567"
                    value={formData.businessPhone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Business Type</label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="salon">Beauty Salon</option>
                  <option value="gym">Gym & Fitness</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="consulting">Consulting</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Business Description</label>
                <Textarea
                  name="description"
                  placeholder="Tell customers about your business..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                />
              </div>
            </div>
          )}

          {/* Step 2: Location & Contact */}
          {activeStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Location & Contact</h2>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Street Address</label>
                <Input
                  name="address"
                  placeholder="123 Main Street"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">City</label>
                  <Input
                    name="city"
                    placeholder="New York"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">State</label>
                  <Input
                    name="state"
                    placeholder="NY"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Zip Code</label>
                  <Input
                    name="zipCode"
                    placeholder="10001"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Website (Optional)</label>
                <Input
                  name="website"
                  placeholder="https://yourbusiness.com"
                  value={formData.website}
                  onChange={handleInputChange}
                />
              </div>

              <div className="p-4 bg-secondary/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <Info className="w-4 h-4 inline mr-2" />
                  This information will be displayed on your business profile.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Business Hours */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Business Hours</h2>
              </div>

              <div className="space-y-3">
                {Object.entries(formData.businessHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                    <span className="w-20 font-semibold text-foreground capitalize">{day}</span>
                    <div className="flex-1 flex gap-2">
                      <Input
                        type="time"
                        value={hours.open}
                        disabled={hours.closed}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          businessHours: {
                            ...prev.businessHours,
                            [day]: { ...hours, open: e.target.value }
                          }
                        }))}
                        className="flex-1"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={hours.close}
                        disabled={hours.closed}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          businessHours: {
                            ...prev.businessHours,
                            [day]: { ...hours, close: e.target.value }
                          }
                        }))}
                        className="flex-1"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hours.closed}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          businessHours: {
                            ...prev.businessHours,
                            [day]: { ...hours, closed: e.target.checked }
                          }
                        }))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-muted-foreground">Closed</span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-foreground font-semibold mb-2">Ready to launch?</p>
                <p className="text-sm text-muted-foreground">
                  Once you submit, you can start adding services and accepting bookings immediately.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Email Verification Modal */}
        {emailVerificationSent && (
          <Card className="border border-primary bg-primary/5 p-6 mb-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Verify Your Business Email</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We've sent a verification code to <strong>{formData.businessEmail}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Verification Code</label>
                <Input
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Check your email inbox (or spam folder) for the verification code. It will expire in 15 minutes.
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailVerificationSent(false)
                    setVerificationCode('')
                  }}
                  disabled={verifyingEmail}
                >
                  Change Email
                </Button>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
                  onClick={verifyBusinessEmail}
                  disabled={verifyingEmail || verificationCode.length !== 6}
                >
                  {verifyingEmail ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Email'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
            disabled={activeStep === 1}
          >
            Back
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              if (activeStep < 3) {
                setActiveStep(activeStep + 1)
              } else {
                handleSubmit()
              }
            }}
            disabled={loading}
          >
            {activeStep === 3 ? 'Create Business' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
      )}
    </div>
  )
}
