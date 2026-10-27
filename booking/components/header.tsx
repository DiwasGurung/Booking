"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/authContext"
import { Button } from "@/components/ui/Button"
import {
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Building2,
  Search,
  LayoutDashboard,
  Sparkles,
  Tag,
  ChevronRight,
} from "lucide-react"
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

  // Close the drawer whenever the route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Lock page scroll while the drawer is open + close on Escape
  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isOpen])

  // Hide header on dashboard routes, authentication pages, and public booking pages
  const isDashboard =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/bookings") ||
    pathname?.startsWith("/subscription")
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/staff/login"
  const isPublicBooking = pathname?.startsWith("/book/")
  const isStaff = pathname?.startsWith("/staff/")

  const handleLogout = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
      await fetch(`${baseUrl}/api/users/logout`, {
        method: "POST",
        credentials: "include",
      })
      await logout()
      setIsOpen(false)
      router.push("/")
    } catch (error) {
      console.error("[v0] Logout failed:", error)
    }
  }

  // Render nothing early - AFTER all hooks are called
  if (!isMounted) {
    return null
  }

  if (isDashboard || isAuthPage || isPublicBooking || isStaff) {
    return null
  }

  const getHomeLink = () => {
    if (!user) return "/"
    if (user.role === "BUSINESS_OWNER") return "/dashboard"
    if (user.role === "CUSTOMER") return "/search"
    return "/"
  }

  const handleLogoClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsOpen(false)
    router.push(getHomeLink())
  }

  const displayName = user?.name || user?.email || ""
  const initial = displayName.trim().charAt(0).toUpperCase() || "?"
  const roleLabel = user?.role === "BUSINESS_OWNER" ? "Business Owner" : "Customer"

  // Shared style for rows inside the mobile drawer
  const rowClass =
    "flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] font-medium text-foreground " +
    "hover:bg-muted active:bg-muted transition-colors"

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-lg">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 md:h-auto md:py-3 flex items-center justify-between">
        {/* Logo - Role-based navigation */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <div className="text-xl md:text-2xl font-bold tracking-tight">Appoint-Nepal</div>
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
              {/* Setup Business - Only for Customers */}
              {user.role === "CUSTOMER" && (
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
                  <p className="text-xs opacity-70">{roleLabel}</p>
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

        {/* Mobile: avatar shortcut (signed in) + menu button */}
        <div className="md:hidden flex items-center gap-1">
          {user && (
            <Link
              href="/account/profile"
              aria-label="Profile"
              className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-sm font-semibold active:bg-white/30"
            >
              {initial}
            </Link>
          )}
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
            aria-expanded={isOpen}
            aria-controls="mobile-drawer"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 active:bg-white/30 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className="md:hidden">
        {/* Backdrop */}
        <div
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
          className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-200 ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />

        {/* Panel */}
        <aside
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
          className={`fixed top-0 right-0 bottom-0 z-50 w-[85%] max-w-sm bg-background text-foreground shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer top bar */}
          <div className="h-14 px-4 flex items-center justify-between bg-primary text-primary-foreground flex-shrink-0">
            <span className="text-lg font-bold tracking-tight">Appoint-Nepal</span>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
              className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full hover:bg-white/20 active:bg-white/30 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
            {user ? (
              <>
                {/* Account card */}
                <Link
                  href="/account/profile"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-muted/50 p-3 active:bg-muted transition-colors"
                >
                  <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold flex-shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{roleLabel}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </Link>

                {/* Links */}
                <div className="space-y-1">
                  {user.role === "BUSINESS_OWNER" && (
                    <Link href="/dashboard" className={rowClass}>
                      <LayoutDashboard className="w-5 h-5 text-primary" />
                      Dashboard
                    </Link>
                  )}
                  {user.role === "CUSTOMER" && (
                    <>
                      <Link href="/search" className={rowClass}>
                        <Search className="w-5 h-5 text-primary" />
                        Find a business
                      </Link>
                      <Link href="/setup-business" className={rowClass}>
                        <Building2 className="w-5 h-5 text-primary" />
                        Setup Business
                      </Link>
                    </>
                  )}
                  <Link href="/account/profile" className={rowClass}>
                    <UserIcon className="w-5 h-5 text-primary" />
                    Profile
                  </Link>
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <a href="/#features" onClick={() => setIsOpen(false)} className={rowClass}>
                  <Sparkles className="w-5 h-5 text-primary" />
                  Features
                </a>
                <a href="/#pricing" onClick={() => setIsOpen(false)} className={rowClass}>
                  <Tag className="w-5 h-5 text-primary" />
                  Pricing
                </a>
              </div>
            )}
          </div>

          {/* Pinned footer actions */}
          <div className="flex-shrink-0 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {user ? (
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 px-4 py-3 text-[15px] font-medium text-destructive hover:bg-destructive/10 active:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full h-11">
                    Login
                  </Button>
                </Link>
                <Link href="/signup" className="block">
                  <Button className="w-full h-11">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </nav>
  )
}