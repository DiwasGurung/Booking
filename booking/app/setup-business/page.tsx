"use client"

import { useAuth } from "@/context/authContext"
import { SetupBusinessForm } from "@/components/business/SetupBusiness"
import { useRouter } from "next/navigation"
import { useRoleProtection } from "@/hooks/useRoleProtection"

export default function SetupBusinessPage() {
  const { loading } = useRoleProtection({ requiredRole: 'CUSTOMER' })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 py-12 px-4">
      <SetupBusinessForm />
    </div>
  )
}
