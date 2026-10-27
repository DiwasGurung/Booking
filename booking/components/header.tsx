"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/authContext"
import { Button } from "@/components/ui/Button"
import {
  LogOut,
  User as UserIcon,
  Building2,
  Search,
  LayoutDashboard,
  Home,
  Sparkles,
  Tag,
  LogIn,
  ChevronRight,
} from "lucide-react"
import { useState, useEffect } from "react"

/* ------------------------------------------------------------------ */
/* Bottom tab used by the mobile navigation bar                        */
/* ------------------------------------------------------------------ */
type TabProps = {
  label: string
  icon: React.ReactNode
  active?: boolean
  href?: string
  onClick?: () => void
}

const Tab = ({ label, icon, active, href, onClick }: TabProps) => {
  const classes =
    "flex-1 flex flex-col items-center justify-center gap-1 py-2 min-w-0 transition-colors " +
    (active ? "text-primary" : "text-muted-foreground active:text-foreground")

  const content = (
    <>
      <span
        className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
          active ? "bg-primary/10" : ""
        }`}
      >
        {icon}
      </span>
      <span className={`text-[11px] leading-none truncate ${active ? "font-semibold" : "font-medium"}`}>
        {label}
      </span>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={classes} aria-current={active ? "page" : undefined}>
        {content}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  )
}

export const Header = () => {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Ensure component is mounted before rendering to prevent hydration mismatches
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Close the account sheet whenever the route changes
  useEffect(() => {
    setSheetOpen(false)
  }, [pathname])

  // Lock page scroll while the sheet is open + close on Escape
  useEffect(() => {
    if (!sheetOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [sheetOpen])

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
      setSheetOpen(false)
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
    router.push(getHomeLink())
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname?.startsWith(href + "/")

  const displayName = user?.name || user?.email || ""
  const firstName = (user?.name || user?.email || "").split(/[\s@]/)[0]
  const initial = displayName.trim().charAt(0).toUpperCase() || "?"
  const roleLabel = user?.role === "BUSINESS_OWNER" ? "Business Owner" : "Customer"

  return (
    <>
      {/* ============================================================ */}
      {/* TOP BAR (desktop + mobile)                                    */}
      {/* ============================================================ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-md pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 md:h-auto md:py-3 flex items-center justify-between gap-3">
          {/* Logo - Role-based navigation */}
          <button
            onClick={handleLogoClick}
            className="flex items-center flex-shrink-0 hover:opacity-80 transition-opacity"
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

                <div className="flex items-center gap-3 pl-3 border-l border-white/20">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{user.name || user.email}</p>
                    <p className="text-xs opacity-70">{roleLabel}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                    <UserIcon className="w-4 h-4" />
                  </div>
                </div>

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

          {/* Mobile right side: one clear action, nothing else */}
          <div className="md:hidden flex items-center">
            {user ? (
              <button
                onClick={() => setSheetOpen(true)}
                aria-label="Open account menu"
                className="flex items-center gap-2 rounded-full bg-white/15 pl-1 pr-3 py-1 active:bg-white/25 transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-white text-primary flex items-center justify-center text-xs font-bold">
                  {initial}
                </span>
                <span className="text-sm font-medium max-w-[96px] truncate">{firstName}</span>
              </button>
            ) : (
              <Link href="/signup">
                <Button size="sm" className="bg-white text-primary hover:bg-white/90 h-9 px-4 font-semibold">
                  Sign Up
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ============================================================ */}
      {/* BOTTOM TAB BAR (mobile only) - thumb-friendly navigation      */}
      {/* ============================================================ */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-stretch h-16 px-2">
          {user ? (
            <>
              {user.role === "BUSINESS_OWNER" ? (
                <>
                  <Tab href="/" label="Home" icon={<Home className="w-5 h-5" />} active={isActive("/")} />
                  <Tab
                    href="/dashboard"
                    label="Dashboard"
                    icon={<LayoutDashboard className="w-5 h-5" />}
                    active={isActive("/dashboard")}
                  />
                </>
              ) : (
                <>
                  <Tab
                    href="/search"
                    label="Find"
                    icon={<Search className="w-5 h-5" />}
                    active={isActive("/search")}
                  />
                  <Tab
                    href="/setup-business"
                    label="My Business"
                    icon={<Building2 className="w-5 h-5" />}
                    active={isActive("/setup-business")}
                  />
                </>
              )}
              <Tab
                label="Account"
                icon={<UserIcon className="w-5 h-5" />}
                active={isActive("/account") || sheetOpen}
                onClick={() => setSheetOpen(true)}
              />
            </>
          ) : (
            <>
              <Tab href="/#features" label="Features" icon={<Sparkles className="w-5 h-5" />} />
              <Tab href="/pricing" label="Pricing" icon={<Tag className="w-5 h-5" />} />
              <Tab href="/login" label="Login" icon={<LogIn className="w-5 h-5" />} active={isActive("/login")} />
            </>
          )}
        </div>
      </nav>

      {/* ============================================================ */}
      {/* ACCOUNT BOTTOM SHEET (mobile, signed-in only)                 */}
      {/* ============================================================ */}
      {user && (
        <div className="md:hidden">
          <div
            onClick={() => setSheetOpen(false)}
            aria-hidden="true"
            className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 ${
              sheetOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Account"
            className={`fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl bg-background text-foreground shadow-2xl transition-transform duration-300 ease-out pb-[max(1rem,env(safe-area-inset-bottom))] ${
              sheetOpen ? "translate-y-0" : "translate-y-full"
            }`}
          >
            {/* Grab handle */}
            <div className="flex justify-center pt-3 pb-1">
              <span className="h-1.5 w-10 rounded-full bg-border" />
            </div>

            <div className="px-4 pt-2 pb-2">
              {/* Who is signed in */}
              <div className="flex items-center gap-3 pb-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold flex-shrink-0">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{displayName}</p>
                  <p className="text-sm text-muted-foreground">{roleLabel}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-1">
                <Link
                  href="/account/profile"
                  className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] font-medium hover:bg-muted active:bg-muted transition-colors"
                >
                  <UserIcon className="w-5 h-5 text-primary" />
                  <span className="flex-1">My profile</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] font-medium text-destructive hover:bg-destructive/10 active:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}