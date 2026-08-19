'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ChevronDown, Menu, X, LayoutDashboard, Calendar, Settings, BarChart3, CreditCard, Users, Home, LogOut, UserCog, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/authContext'
import { useIsMobile } from '@/hooks/use-mobile'

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
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()
  const router = useRouter()
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('overview')
  const { logout } = useAuth()

  // Keep the active section open and close the drawer after mobile navigation.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveAnalyticsTab(new URLSearchParams(window.location.search).get('tab') || 'overview')
    }
    if (isMobile) setIsOpen(false)
    if (pathname === '/dashboard/analytics') {
      setExpandedItems((items) => items.includes('Analytics') ? items : [...items, 'Analytics'])
    }
  }, [pathname, isMobile, activeAnalyticsTab])

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
      label: 'Business Hours',
      href: '/dashboard/business-hours',
      icon: Clock,
    },
    {
      label: 'Staff',
      href: '/dashboard/staff',
      icon: UserCog,
    },
    {
      label: 'Staff Performance',
      href: '/dashboard/staff/performance',
      icon: BarChart3,
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

  const isActive = (href: string) => {
    const [path, query] = href.split('?')
    if (pathname !== path && !pathname.startsWith(path + '/')) return false
    if (!query) return pathname === path || pathname.startsWith(path + '/')
    return new URLSearchParams(query).get('tab') === activeAnalyticsTab
  }

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
      {/* Mobile backdrop */}
      {isOpen && <div className="fixed inset-0 z-40 bg-foreground/35 md:hidden" onClick={() => setIsOpen(false)} />}

      {/* Mobile toggle */}
      <Button
        variant="outline"
        size="icon"
        aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
        className="fixed left-4 top-4 z-50 h-10 w-10 bg-background shadow-sm md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(86vw,20rem)] flex-col border-r border-border bg-card pt-16 shadow-xl transition-transform duration-300 md:top-0 md:z-30 md:w-64 md:translate-x-0 md:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <div key={item.label}>
              {item.children ? (
                <button
                  onClick={() => toggleExpandItem(item.label)}
                  aria-expanded={expandedItems.includes(item.label)}
                  aria-controls={`${item.label.toLowerCase()}-submenu`}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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
                <Link href={item.href} onClick={() => setIsOpen(false)}>
                  <span
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer block ${
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
                <div id={`${item.label.toLowerCase()}-submenu`} className="ml-4 mt-1 space-y-1 border-l border-border py-1 pl-2">
                  {item.children.map((subitem) => (
                    <Link key={subitem.href} href={subitem.href} onClick={() => setIsOpen(false)}>
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
        <div className="shrink-0 border-t border-border bg-card p-3">
          <Button
            onClick={handleLogout}
            className="w-full justify-center gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            size="sm"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  )
}
