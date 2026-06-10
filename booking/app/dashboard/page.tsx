'use client'

import { useEffect } from 'react'
import { Loader, ArrowRight, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { useBusinessId } from '@/hooks/useBusinessId'
import { AuthWrapper } from '@/components/AuthWrapper'

/**
 * Dashboard root page - redirects to /dashboard/[businessId]
 * This is a simple redirect page that gets the user's business ID
 * and redirects them to their specific business dashboard
 */
export default function DashboardPage() {
  const router = useRouter()
  const { businessId, loading: fetchingBusinessId, error: businessIdError } = useBusinessId()

  // Redirect to business-specific dashboard once businessId is available
  useEffect(() => {
    if (businessId && !fetchingBusinessId) {
      console.log('[dashboard] Redirecting to business dashboard:', businessId)
      router.replace(`/dashboard/${businessId}`)
    }
  }, [businessId, fetchingBusinessId, router])

  // Show loading while checking auth and fetching businessId
  if (fetchingBusinessId) {
    return (
      <AuthWrapper mode="business-only">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AuthWrapper>
    )
  }

  // Show setup message if no business found
  if (businessIdError) {
    return (
      <AuthWrapper mode="business-only">
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-border shadow-lg p-8">
            <div className="text-center">
              <Building2 className="w-16 h-16 mx-auto text-primary mb-4 opacity-80" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to Appoint-Nepal!</h1>
              <p className="text-muted-foreground mb-6">
                To access your dashboard, you first need to set up your business profile.
              </p>
              <Link href="/business/setup" className="block">
                <Button className="w-full" size="lg">
                  Set Up Business Profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </AuthWrapper>
    )
  }

  // If we reach here, redirecting via useEffect
  return (
    <AuthWrapper mode="business-only">
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    </AuthWrapper>
  )
}
