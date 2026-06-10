'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { MapPin } from 'lucide-react'

export default function SitemapPage() {
  const sections = [
    {
      title: 'For Customers',
      items: [
        { label: 'Browse Services', href: '/search' },
        { label: 'My Bookings', href: '/bookings/my-bookings' },
        { label: 'Account Settings', href: '/account' },
        { label: 'Notifications', href: '/account/notifications' },
      ],
    },
    {
      title: 'For Business Owners',
      items: [
        { label: 'Get Started', href: '/business/setup' },
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'My Services', href: '/dashboard/services' },
        { label: 'Booking Management', href: '/dashboard/bookings' },
      ],
    },
    {
      title: 'Help & Support',
      items: [
        { label: 'FAQ & Help Center', href: '/help' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Contact Us', href: '/contact' },
      ],
    },
    {
      title: 'Main Pages',
      items: [
        { label: 'Home', href: '/' },
        { label: 'Login', href: '/login' },
        { label: 'Sign Up', href: '/register' },
        { label: 'Sitemap', href: '/sitemap' },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <Breadcrumbs />
        
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Sitemap</h1>
          </div>
          <p className="text-muted-foreground">Complete navigation guide for Appoint-Nepal</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {sections.map((section) => (
            <Card key={section.title} className="border border-border shadow-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">{section.title}</h2>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-left hover:bg-primary/10 text-foreground"
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Navigation */}
        <Card className="border border-border shadow-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/">
              <Button variant="outline" className="w-full">Home</Button>
            </Link>
            <Link href="/search">
              <Button variant="outline" className="w-full">Search</Button>
            </Link>
            <Link href="/bookings/my-bookings">
              <Button variant="outline" className="w-full">Bookings</Button>
            </Link>
            <Link href="/account">
              <Button variant="outline" className="w-full">Account</Button>
            </Link>
            <Link href="/help">
              <Button variant="outline" className="w-full">Help</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full">Login</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="w-full">Sign Up</Button>
            </Link>
            <Link href="/business/setup">
              <Button variant="outline" className="w-full">Get Started</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
