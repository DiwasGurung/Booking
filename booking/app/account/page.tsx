'use client'

import { useAuth } from '@/context/authContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { User, Bell, LogOut, Loader } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

export default function AccountPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Loader className="w-8 h-8 animate-spin text-primary mx-auto" />
        </div>
      </div>
    )
  }

  const accountMenuItems = [
    {
      icon: User,
      title: 'Profile',
      description: 'Manage your personal information',
      href: '/account/profile',
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Configure notification preferences',
      href: '/account/notifications',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <Breadcrumbs />
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and personal information</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {accountMenuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.title} href={item.href}>
                <Card className="border border-border shadow-lg p-6 hover:shadow-xl transition cursor-pointer h-full">
                  <Icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Account Info Card */}
        <Card className="border border-border shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Name</p>
              <p className="text-lg font-semibold text-foreground">{user.name || user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="text-lg font-semibold text-foreground">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Account Type</p>
              <p className="text-lg font-semibold text-foreground">
                {user.role === 'BUSINESS_OWNER' ? 'Business Owner' : 'Customer'}
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/bookings/my-bookings">
            <Card className="border border-border shadow-lg p-4 hover:shadow-xl transition cursor-pointer">
              <h3 className="font-semibold text-foreground mb-2">My Bookings</h3>
              <p className="text-sm text-muted-foreground">View your upcoming and past bookings</p>
            </Card>
          </Link>
          <Link href="/help">
            <Card className="border border-border shadow-lg p-4 hover:shadow-xl transition cursor-pointer">
              <h3 className="font-semibold text-foreground mb-2">Help & Support</h3>
              <p className="text-sm text-muted-foreground">Find answers and get help</p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
