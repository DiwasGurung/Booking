'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown, Menu, X, LayoutDashboard, Calendar, Settings, BarChart3, CreditCard, Users, Home, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/authContext'

interface NavItem {
  label: string
  href: string
  icon?: any
  children?: NavItem[]
  roles?: string[]
}

interface SidebarProps {
  userRole?: string
}

export const Sidebar = ({ userRole = 'BUSINESS_OWNER' }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false) // Start closed
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  const businessOwnerNav: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    {
      label: 'Bookings',
      href: '/dashboard/bookings',
      icon: Calendar,
      children: [
        { label: 'All Bookings', href: '/dashboard/bookings', icon: Calendar },
        { label: 'Pending', href: '/dashboard/bookings?status=PENDING', icon: Calendar },
        { label: 'Completed', href: '/dashboard/bookings?status=COMPLETED', icon: Calendar },
      ]
    },
    {
      label: 'Services',
      href: '/dashboard/services',
      icon: Users,
    },
    {
      label: 'Payments',
      href: '/dashboard/payments',
      icon: CreditCard,
      children: [
        { label: 'Overview', href: '/dashboard/payments', icon: CreditCard },
        { label: 'History', href: '/dashboard/payments?view=history', icon: CreditCard },
      ]
    },
    {
      label: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3,
      children: [
        { label: 'Revenue', href: '/dashboard/analytics?tab=revenue', icon: BarChart3 },
        { label: 'Bookings', href: '/dashboard/analytics?tab=bookings', icon: BarChart3 },
        { label: 'Customers', href: '/dashboard/analytics?tab=customers', icon: BarChart3 },
      ]
    },
    { label: 'Subscription', href: '/dashboard/subscription', icon: CreditCard },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const customerNav: NavItem[] = [
    { label: 'Home', href: '/book', icon: Home },
    { label: 'My Bookings', href: '/bookings/my-bookings', icon: Calendar },
    { label: 'My Payments', href: '/subscription/my-payments', icon: CreditCard },
  ]

  const navItems = userRole === 'BUSINESS_OWNER' ? businessOwnerNav : customerNav

  const toggleExpandItem = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const handleLogout = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      await fetch(`${baseUrl}/api/users/logout`, {
        method: 'POST',
        credentials: 'include',
      })
      await logout()
      router.push('/')
    } catch (error) {
      console.error('[v0] Logout failed:', error)
    }
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-card border-r border-border transition-transform duration-300 ease-in-out z-30 w-64
          transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:w-64`}
      >
        {/* Navigation */}
        <nav className="relative flex flex-col h-full pb-24 overflow-y-auto px-4 pt-20">
          {navItems.map((item) => (
            <div key={item.label}>
              {item.children ? (
                <button
                  onClick={() => toggleExpandItem(item.label)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    expandedItems.includes(item.label)
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      expandedItems.includes(item.label) ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              ) : (
                <Link href={item.href}>
                  <span
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isActive(item.href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </span>
                </Link>
              )}

              {/* Submenu */}
              {item.children && expandedItems.includes(item.label) && (
                <div className="ml-4 mt-2 border-l border-slate-200 space-y-1">
                  {item.children.map((subitem) => (
                    <Link key={subitem.href} href={subitem.href}>
                      <span
                        className={`w-full text-left px-4 py-2 text-xs rounded transition-colors block ${
                          isActive(subitem.href)
                            ? 'text-primary font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {subitem.label}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Logout Button Fixed at Bottom */}
        <div className="absolute bottom-4 left-4 right-4 px-4 w-full">
          <Button
            onClick={handleLogout}
            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center justify-center gap-2"
            size="sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}