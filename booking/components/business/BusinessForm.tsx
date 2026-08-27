'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/authContext'
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { BUSINESS_CATEGORIES } from '@/components/constants/businessCategories'
import { NEPAL_PROVINCES, getNepalDistricts, isValidNepalLocation } from '@/components/constants/nepalLocations'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export const UnifiedBusinessRegister = () => {
  const router = useRouter()
  const { refreshUser, setToken } = useAuth()

  // Main flow: 1=Register, 2=VerifyEmail, 3=BusinessSetup
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [businessStep, setBusinessStep] = useState<'basic' | 'location'>('basic')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Registration
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')

  // Step 2: Email Verification
  const [verificationCode, setVerificationCode] = useState('')
  const [registeredUserId, setRegisteredUserId] = useState('')
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  // Step 3: Business Setup
  const [businessName, setBusinessName] = useState('')
  const [businessEmail, setBusinessEmail] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessCategory, setBusinessCategory] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [businessProvince, setBusinessProvince] = useState('')
  const [businessCity, setBusinessCity] = useState('')
  const [businessCountry, setBusinessCountry] = useState('Nepal')
  const [businessDescription, setBusinessDescription] = useState('')
  const [useSameEmail, setUseSameEmail] = useState(true)

  // Step 1: Register User
  const handleUserRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phone,
          role: 'CUSTOMER',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setRegisteredUserId(data.user.id)
      setRegisteredEmail(data.user.email)
      setBusinessEmail(data.user.email)
      setStep(2)
      toast.success('Registration successful! Check your email for verification code.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Verify Email
  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/users/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: registeredEmail,
          code: verificationCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      // Store token and authenticate the user (cookie is also set by backend)
      if (data.token) {
        setToken(data.token)
        await refreshUser(data.token)
      } else {
        await refreshUser()
      }
      setStep(3)
      toast.success('Email verified! Now set up your business.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Resend verification code
  const handleResendVerification = async () => {
    setResendLoading(true)
    setResendMessage('')
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/users/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: registeredEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification code')
      }

      setResendMessage('Verification code has been resent to your email!')
      setVerificationCode('')
      setTimeout(() => setResendMessage(''), 5000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setResendLoading(false)
    }
  }

  // Business Setup Navigation
  const handleBusinessNext = () => {
    if (businessStep === 'basic') {
      if (!businessName || !businessEmail || !businessPhone || !businessCategory) {
        toast.error('Please fill in all required fields')
        return
      }
      setBusinessStep('location')
    }
  }

  const handleBusinessPrev = () => {
    if (businessStep === 'location') {
      setBusinessStep('basic')
    }
  }

  // Step 3: Create Business then redirect to subscription
  const handleBusinessCreation = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!businessName || !businessEmail || !businessPhone || !businessCategory) {
      toast.error('Please fill in all business details')
      return
    }

    if (!businessAddress || !businessProvince || !businessCity || !businessCountry || !isValidNepalLocation(businessProvince, businessCity)) {
      toast.error('Please select a valid province and district')
      return
    }

    setIsLoading(true)

    try {
      // Get the token from localStorage if available
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_URL}/api/businesses`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          name: businessName,
          email: businessEmail,
          phone: businessPhone,
          category: businessCategory,
          address: businessAddress,
          city: businessCity,
          state: businessProvince,
          zipCode: '00000',
          country: 'Nepal',
          description: businessDescription,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create business')
      }

      toast.success('Business created successfully!')
      await refreshUser()
      
      // Redirect to subscription page to choose a plan
      router.push('/subscription?from=setup')
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // RENDER: Step 1 - Registration
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
              <p className="text-sm text-muted-foreground">Step 1 of 3: Personal Information</p>
              <div className="mt-4 h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-primary rounded-full transition-all" />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleUserRegistration} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+977 98..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Continue
              </Button>

              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="text-primary hover:text-primary/80 font-semibold underline"
                  >
                    Login here
                  </button>
                </p>
              </div>
            </form>
          </div>
        </Card>
      </div>
    )
  }

  // RENDER: Step 2 - Email Verification
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Verify Email</h1>
              <p className="text-sm text-muted-foreground">Step 2 of 3: Email Verification</p>
              <div className="mt-4 h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-primary rounded-full transition-all" />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleEmailVerification} className="space-y-4">
              <div>
                <Label htmlFor="code">Verification Code *</Label>
                <Input
                  id="code"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.trim().slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                  required
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Check your email spam folder if you don&apos;t see the code. It expires in 15 minutes.
              </p>

              {resendMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md flex gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">{resendMessage}</p>
                </div>
              )}

              <Button className="w-full" disabled={isLoading || verificationCode.length !== 6}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Verify Email
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendVerification}
                disabled={resendLoading || isLoading}
              >
                {resendLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Resend Code
              </Button>
            </form>
          </div>
        </Card>
      </div>
    )
  }

  // RENDER: Step 3 - Business Setup
  if (step === 3) {
    const isLocation = businessStep === 'location'

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Setup Your Business</h1>
            <p className="text-muted-foreground text-sm">
              Step 3 of 3: {isLocation ? 'Business Location' : 'Business Information'}
            </p>
          </div>

          {/* Substep progress */}
          <div className="mb-8 flex items-center gap-3">
            {(['basic', 'location'] as const).map((s, idx) => {
              const order = ['basic', 'location']
              const active = s === businessStep
              const completed = order.indexOf(s) < order.indexOf(businessStep)
              return (
                <div key={s} className="flex items-center gap-3 flex-1">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : completed
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-sm font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {s === 'basic' ? 'Details' : 'Location'}
                  </span>
                  {idx === 0 && <div className="flex-1 h-0.5 bg-muted rounded-full" />}
                </div>
              )
            })}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <form
            onSubmit={isLocation ? handleBusinessCreation : (e) => { e.preventDefault(); handleBusinessNext() }}
            className="space-y-6"
          >
            {/* BASIC INFO */}
            {businessStep === 'basic' && (
              <Card className="p-6 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">Business Details</h2>
                  <p className="text-sm text-muted-foreground">Tell us about your business</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="My Awesome Business"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Business Email *</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      placeholder="business@example.com"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessPhone">Phone Number *</Label>
                    <Input
                      id="businessPhone"
                      placeholder="+977 98..."
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessCategory">Business Category *</Label>
                  <Select value={businessCategory} onValueChange={setBusinessCategory}>
                    <SelectTrigger id="businessCategory">
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

                <div className="space-y-2">
                  <Label htmlFor="businessDescription">Business Description (Optional)</Label>
                  <textarea
                    id="businessDescription"
                    placeholder="Tell us about your business..."
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground min-h-24"
                  />
                </div>
              </Card>
            )}

            {/* LOCATION */}
            {businessStep === 'location' && (
              <Card className="border-border/80 bg-card p-7 shadow-sm md:p-10">
                <div className="mb-8 space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">Business Location</h2>
                  <p className="text-base leading-6 text-muted-foreground">Where is your business located?</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress" className="text-base font-semibold">Street Address *</Label>
                  <Input
                    id="businessAddress"
                    placeholder="123 Business Street"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="h-12 text-base"
                    required
                  />
                </div>

                <div className="my-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessProvince" className="text-base font-semibold">City *</Label>
                    <Select
                      value={businessProvince}
                      onValueChange={(value) => {
                        setBusinessProvince(value)
                        setBusinessCity('')
                      }}
                    >
                      <SelectTrigger id="businessProvince" className="h-12 text-base">
                        <SelectValue placeholder="Select your city" />
                      </SelectTrigger>
                      <SelectContent>
                        {NEPAL_PROVINCES.map((province) => (
                          <SelectItem key={province} value={province}>{province}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessCity" className="text-base font-semibold">District *</Label>
                    <Select value={businessCity} onValueChange={setBusinessCity} disabled={!businessProvince}>
                      <SelectTrigger id="businessCity" className="h-12 text-base">
                        <SelectValue placeholder={businessProvince ? 'Select your district' : 'Select a city first'} />
                      </SelectTrigger>
                      <SelectContent>
                        {getNepalDistricts(businessProvince).map((district) => (
                          <SelectItem key={district} value={district}>{district}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessCountry" className="text-base font-semibold">Country *</Label>
                  <Input
                    id="businessCountry"
                    value={businessCountry}
                    readOnly
                    className="h-12 bg-muted/40 text-base"
                    required
                  />
                </div>
              </Card>
            )}

            {/* BUTTONS */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleBusinessPrev}
                disabled={businessStep === 'basic'}
              >
                Back
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1 gap-2">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isLocation ? 'Complete & Choose Plan' : 'Next'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return null
}
