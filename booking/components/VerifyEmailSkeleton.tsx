'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function VerifyEmailSkeleton() {
  return (
    <Card className="w-full max-w-md border-border shadow-lg">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5 mx-auto" />
        </div>

        {/* Timer alert */}
        <Skeleton className="h-10 w-full" />

        {/* Code inputs */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2 justify-center">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="w-12 h-12 rounded" />
            ))}
          </div>
        </div>

        {/* Submit button */}
        <Skeleton className="h-11 w-full" />

        {/* Footer text */}
        <Skeleton className="h-4 w-2/3 mx-auto" />
      </div>
    </Card>
  )
}
