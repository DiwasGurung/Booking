import SubscriptionCheckout from '@/components/subscription/checkoutPage'

import { Suspense } from 'react'
// Move your logic here

export default function SubscriptionCheckoutPage() {
  return (
    <Suspense fallback={<div>Loading subscription...</div>}>
      <SubscriptionCheckout/>
    </Suspense>
  )
}
