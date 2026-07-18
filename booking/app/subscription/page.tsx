import SubscriptionComponent from '@/components/subscription/subscriptionPage'
import { Suspense } from 'react'

// Route-level component for /subscription
export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div>Loading subscription...</div>}>
      <SubscriptionComponent />
    </Suspense>
  )
}
