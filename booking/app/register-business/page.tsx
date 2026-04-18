'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/authContext'

export default function RegisterBusinessPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User not authenticated, redirect to signup
        router.push('/signup-business')
      } else {
        // User is authenticated, redirect to business setup
        router.push('/businesses/setup')
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/30">
      <div className="text-center">
        <div className="animate-spin inline-block w-12 h-12 border-4 border-secondary border-t-primary rounded-full"></div>
        <p className="mt-4 text-muted-foreground">Redirecting to business registration...</p>
      </div>
    </div>
  )
}