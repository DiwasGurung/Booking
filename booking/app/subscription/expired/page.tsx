'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { AuthWrapper } from '@/components/AuthWrapper'

export default function SubscriptionExpiredPage() {
  const router = useRouter()

  return (
    <AuthWrapper mode="business-only">
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border border-red-200 dark:border-red-900 shadow-lg p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Trial Period Ended</h1>
            <p className="text-muted-foreground mb-6">
              Your trial period has ended. To continue using BookFlow and accessing your dashboard, please upgrade to a paid plan.
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => router.push('/subscription/checkout')}
                className="w-full bg-primary"
                size="lg"
              >
                Upgrade Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AuthWrapper>
  )
}
