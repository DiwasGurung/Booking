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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

interface Plan {
  id: string
  name: string
  price: string
  period: string
  description: string
}
545
const PLANS: Plan[] = [
  { id: 'free', name: 'Free', price: '$0', period: '/month', description: 'Get started' },
  { id: 'pro', name: 'Pro', price: '$29', period: '/month', description: 'For growing businesses' },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', period: 'pricing', description: 'For large teams' },
]

const NEPAL_DISTRICTS = [
  'Kathmandu', 'Bhaktapur', 'Lalitpur', 'Pokhara', 'Biratnagar', 'Janakpur', 'Butwal', 'Nepalgunj',
  'Dharan', 'Itahari', 'Birgunj', 'Chitwan', 'Jhapa', 'Morang', 'Sunsari', 'Illam', 'Panchthar',
  'Taplejung', 'Dhankuta', 'Khotang', 'Udayapur', 'Okhaldhunga', 'Sindhuli', 'Ramechhap', 'Dolakha',
  'Nuwakot', 'Rasuwa', 'Sindhpalchok', 'Kavre', 'Makwanpur', 'Rautahat', 'Bara', 'Parsa', 'Saptari',
  'Sarlahi', 'Mahottari', 'Dhanusa', 'Banke', 'Bardiya', 'Kailali', 'Kanchanpur', 'Doti', 'Achham',
  'Baitadi', 'Dadeldhura', 'Bajhang', 'Bajura', 'Humla', 'Jumla', 'Kalikot', 'Mugu', 'Gorkha',
  'Lamjung', 'Tanahu', 'Syangja', 'Palpa', 'Nawalparasi', 'Rupandehi', 'Arghakhanchi', 'Gulmi',
  'Pyuthan', 'Baglung', 'Myagdi', 'Parbat', 'Dolpa', 'Mustang', 'Manang',
]

export const UnifiedBusinessRegister = () => {
  const router = useRouter()
  const { refreshUser } = useAuth()

  // Main flow: 1=Register, 2=VerifyEmail, 3=BusinessSetup, 4=SelectPlan
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [businessStep, setBusinessStep] = useState<'basic' | 'location' | 'plan'>('basic')
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
  const [businessCity, setBusinessCity] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [useSameEmail, setUseSameEmail] = useState(true)

  // Step 4: Plan Selection
  const [selectedPlan, setSelectedPlan] = useState('')

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

      await refreshUser()
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
    } else if (businessStep === 'location') {
      if (!businessAddress || !businessCity) {
        toast.error('Please fill in all location fields')
        return
      }
      setBusinessStep('plan')
    }
  }

  const handleBusinessPrev = () => {
    if (businessStep === 'location') {
      setBusinessStep('basic')
    } else if (businessStep === 'plan') {
      setBusinessStep('location')
    }
  }

  // Step 3+4: Create Business with Plan
  const handleBusinessCreation = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedPlan) {
      setError('Please select a subscription plan')
      return
    }

    setIsLoading(true)

    try {
      const userId = registeredUserId
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(`${API_URL}/api/businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: userId,
          name: businessName,
          email: useSameEmail ? businessEmail : businessEmail,
          phone: businessPhone,
          category: businessCategory,
          address: businessAddress,
          city: businessCity,
          state: 'Nepal',
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
      
      // Redirect to subscription with plan info
      router.push(`/subscription?plan=${selectedPlan}&from=setup`)
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
              <p className="text-sm text-muted-foreground">Step 1 of 4: Personal Information</p>
              <div className="mt-4 h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full w-1/4 bg-primary rounded-full transition-all" />
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
              <p className="text-sm text-muted-foreground">Step 2 of 4: Email Verification</p>
              <div className="mt-4 h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full w-2/4 bg-primary rounded-full transition-all" />
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

  // RENDER: Step 3+4 - Business Setup with Plan Selection
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Setup Your Business</h1>
            <p className="text-muted-foreground text-sm">
              {businessStep === 'plan' ? 'Step 4 of 4: Choose Your Plan' : 'Step 3 of 4: Business Information'}
            </p>
          </div>

          <div className="mb-8 flex gap-2">
            {(['basic', 'location', 'plan'] as const).map((s, idx) => (
              <button
                key={s}
                onClick={() => {
                  if (s === 'basic' || (s === 'location' && businessStep !== 'plan')) {
                    setBusinessStep(s)
                  }
                }}
                className={`flex-1 h-2 rounded-full transition ${
                  s === businessStep
                    ? 'bg-primary'
                    : ['basic', 'location', 'plan'].indexOf(s) < ['basic', 'location', 'plan'].indexOf(businessStep)
                    ? 'bg-primary/30'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={businessStep === 'plan' ? handleBusinessCreation : (e) => { e.preventDefault(); handleBusinessNext() }} className="space-y-6">
            {/* BASIC INFO */}
            {businessStep === 'basic' && (
              <Card className="p-6 space-y-4">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="My Awesome Business"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>

                <div>
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

                <div>
                  <Label htmlFor="businessPhone">Phone Number *</Label>
                  <Input
                    id="businessPhone"
                    placeholder="+977 98..."
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="businessCategory">Business Category *</Label>
                  <Input
                    id="businessCategory"
                    placeholder="Restaurant, Salon, Clinic, etc."
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    required
                  />
                </div>

                <div>
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
              <Card className="p-6 space-y-4">
                <div>
                  <Label htmlFor="businessAddress">Street Address *</Label>
                  <Input
                    id="businessAddress"
                    placeholder="123 Business Street"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="businessCity">District *</Label>
                  <select
                    id="businessCity"
                    value={businessCity}
                    onChange={(e) => setBusinessCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
                    required
                  >
                    <option value="">Select a district</option>
                    {NEPAL_DISTRICTS.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
            )}

            {/* PLAN SELECTION */}
            {businessStep === 'plan' && (
              <Card className="p-6 space-y-4">
                <h2 className="font-semibold mb-4">Select Your Subscription Plan</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedPlan === plan.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <h3 className="font-semibold">{plan.name}</h3>
                      <p className="text-2xl font-bold my-2">{plan.price}</p>
                      <p className="text-xs text-muted-foreground mb-2">{plan.period}</p>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  ))}
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
                    {businessStep === 'plan' ? 'Complete Setup' : 'Next'}
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
