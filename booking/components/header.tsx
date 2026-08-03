"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/authContext"
import { Button } from "@/components/ui/Button"
import { Menu, X, LayoutDashboard, LogOut, Bookmark, Bell, User as UserIcon, Building2 } from "lucide-react"
import { useState, useEffect } from "react"

export const Header = () => {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Ensure component is mounted before rendering to prevent hydration mismatches
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Hide header on dashboard routes, authentication pages, and public booking pages
  const isDashboard = pathname?.startsWith('/dashboard') || pathname?.startsWith('/bookings') || pathname?.startsWith('/subscription')
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/staff/login'
  const isPublicBooking = pathname?.startsWith('/book/')

  const handleLogout = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      await fetch(`${baseUrl}/api/users/logout`, {
        method: 'POST',
        credentials: 'include',
      })
      await logout()
      setIsOpen(false)
      router.push("/")
    } catch (error) {
      console.error('[v0] Logout failed:', error)
    }
  }

  // Render nothing early - AFTER all hooks are called
  if (!isMounted) {
    return null
  }

  if (isDashboard || isAuthPage || isPublicBooking) {
    return null
  }

  const getHomeLink = () => {
    if (!user) return "/"
    if (user.role === 'BUSINESS_OWNER') return "/dashboard"
    if (user.role === 'CUSTOMER') return "/search"
    return "/"
  }

  const handleLogoClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const homeLink = getHomeLink()
    router.push(homeLink)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-lg">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        {/* Logo - Role-based navigation */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <div className="text-2xl font-bold">Appoint-Nepal</div>
          <span className="hidden sm:inline text-sm font-medium opacity-80">Pro</span>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {!user && (
            <>
              <a href="/#features" className="opacity-90 hover:opacity-100 transition text-sm font-medium">
                Features
              </a>
              <a href="/#pricing" className="opacity-90 hover:opacity-100 transition text-sm font-medium">
                Pricing
              </a>
            </>
          )}
        </div>

        {/* Desktop User Menu */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {/* Notification Bell */}
              {/* <button className="relative p-2 hover:bg-white/20 rounded-lg transition">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
              </button> */}

              {/* Setup Business - Only for Customers */}
              {user.role === 'CUSTOMER' && (
                <Link href="/setup-business">
                  <Button 
                    size="sm" 
                    className="bg-white/20 text-primary-foreground border border-white/30 hover:bg-white/30 transition-all duration-200 font-medium"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Setup Business
                  </Button>
                </Link>
              )}

              {/* User Profile */}
              <div className="flex items-center gap-3 pl-3 border-l border-white/20">
                <div className="text-right">
                  <p className="text-sm font-semibold">{user.name || user.email}</p>
                  <p className="text-xs opacity-70">
                    {user.role === 'BUSINESS_OWNER' ? 'Business Owner' : 'Customer'}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                  <UserIcon className="w-4 h-4" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pl-3 border-l border-white/20">
                <Link href="/account/profile">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="hover:bg-white/20 transition-all duration-200 font-medium"
                  >
                    Profile
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLogout}
                  className="hover:bg-destructive/20 transition-all duration-200 font-medium"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button size="sm" variant="ghost" className="hover:bg-white/20">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-white text-primary hover:bg-white/90">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 hover:bg-white/20 rounded-lg"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-primary/95 backdrop-blur">
          <div className="px-4 py-4 space-y-3">
            {user ? (
              <>
                <p className="text-sm font-semibold px-2 py-1">{user.email}</p>
                {user.role === 'CUSTOMER' && (
                  <Link href="/business/setup" className="block" onClick={() => setIsOpen(false)}>
                    <Button 
                      size="sm" 
                      className="w-full justify-start bg-white/20 text-primary-foreground border border-white/30 hover:bg-white/30 transition-all duration-200 font-medium"
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Setup Business
                    </Button>
                  </Link>
                )}
                <Link href="/account/profile" className="block" onClick={() => setIsOpen(false)}>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="w-full justify-start hover:bg-white/20 transition-all duration-200 font-medium"
                  >
                    Profile
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start hover:bg-destructive/20 transition-all duration-200 font-medium"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="block" onClick={() => setIsOpen(false)}>
                  <Button size="sm" variant="ghost" className="w-full justify-start">
                    Login
                  </Button>
                </Link>
                <Link href="/register" className="block" onClick={() => setIsOpen(false)}>
                  <Button size="sm" className="w-full bg-white text-primary hover:bg-white/90">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}


