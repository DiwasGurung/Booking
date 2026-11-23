'use client'

import { useEffect } from 'react'
import { Loader, ArrowRight, Building2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { useBusinessId } from '@/hooks/useBusinessId'
import { AuthWrapper } from '@/components/AuthWrapper'

function Spinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader className="w-8 h-8 animate-spin text-primary" />
    </div>
  )
}

/**
 * Rendered INSIDE AuthWrapper so useBusinessId only runs once auth is resolved.
 */
function DashboardRedirect() {
  const router = useRouter()
  const { businessId, loading, error } = useBusinessId()

  useEffect(() => {
    if (!loading && businessId) {
      router.replace(`/dashboard/${businessId}`)
    }
  }, [businessId, loading, router])

  // Loading, or redirect in progress
  if (loading || businessId) return <Spinner />

  // Only a genuine "no business" result shows the setup card
  if (error === 'NO_BUSINESS') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border border-border shadow-lg p-8">
          <div className="text-center">
            <Building2 className="w-16 h-16 mx-auto text-primary mb-4 opacity-80" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to Appoint-Nepal!</h1>
            <p className="text-muted-foreground mb-6">
              To access your dashboard, you first need to set up your business profile.
            </p>
            <Link href="/business/setup-business" className="block">
              <Button className="w-full" size="lg">
                Set Up Business Profile
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // Network failure / not authenticated: offer retry instead of setup
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border shadow-lg p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Couldn&apos;t load your account</h1>
          <p className="text-muted-foreground mb-6">
            {error === 'UNAUTHENTICATED'
              ? 'Your session could not be verified. Please try again or log in again.'
              : 'Something went wrong while loading your business. Please try again.'}
          </p>
          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={() => window.location.reload()}>
              Retry
            </Button>
            {error === 'UNAUTHENTICATED' && (
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full">
                  Go to Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthWrapper mode="business-only">
      <DashboardRedirect />
    </AuthWrapper>
  )
}