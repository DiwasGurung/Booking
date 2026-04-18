import Subscription from '@/components/subscription/subscriptionPage'
import { Suspense } from 'react'
// Move your logic here

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div>Loading subscription...</div>}>
      <Subscription/>
    </Suspense>
  )
}
