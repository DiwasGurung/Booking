"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/authContext"
import { Button } from "@/components/ui/Button"
import { Menu, X, LogOut, Bell, User as UserIcon, Settings, LogIn } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { notificationsApi } from "@/lib/api"
import { Card } from "@/components/ui/card"

export function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch notifications when user changes
  useEffect(() => {
    if (user?.id) {
      fetchNotifications()
      connectToRealTimeNotifications()
    }

    return () => {
      // Cleanup SSE connection and polling when user changes or component unmounts
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      stopPolling()
    }
  }, [user?.id])

  const connectToRealTimeNotifications = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      
      // EventSource automatically includes cookies with withCredentials
      const eventSource = new EventSource(`${baseUrl}/api/sse/subscribe`, {
        withCredentials: true,
      } as any)

      eventSource.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data)

          if (message.type === 'CONNECTED') {
            console.log('[v0] Connected to real-time notifications')
          } else if (message.type === 'NOTIFICATION') {
            console.log('[v0] New notification:', message.data)
            fetchNotifications() // Refresh notifications
          }
        } catch (error) {
          console.error('[v0] Error parsing notification:', error)
        }
      })

      eventSource.addEventListener('error', (error) => {
        console.log('[v0] SSE connection failed, falling back to polling')
        eventSource.close()
        // Fallback to polling every 30 seconds
        setupPolling()
      })

      eventSourceRef.current = eventSource
    } catch (error) {
      console.log('[v0] Could not connect to SSE, using polling instead')
      setupPolling()
    }
  }

  const setupPolling = () => {
    // Only setup polling if not already running
    if (pollIntervalRef.current) return
    
    pollIntervalRef.current = setInterval(() => {
      if (user?.id) {
        fetchNotifications()
      }
    }, 30000) // Poll every 30 seconds
  }

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }

  const fetchNotifications = async () => {
    if (!user?.id) return
    try {
      setLoadingNotifications(true)
      const response = await notificationsApi.getUserNotifications(user.id)
      const notifs = Array.isArray(response.data) ? response.data : (response as any).data?.notifications || []
      setNotifications(notifs.slice(0, 5)) // Show only 5 latest
      
      // Get unread count
      const unreadResponse = await notificationsApi.getUnreadCount(user.id)
      setUnreadCount(unreadResponse.data?.count || 0)
    } catch (error) {
      console.error('[v0] Error fetching notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId)
      fetchNotifications()
    } catch (error) {
      console.error('[v0] Error marking notification as read:', error)
    }
  }

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

  // Hide header on dashboard routes
  const isDashboard = pathname?.startsWith('/dashboard') || pathname?.startsWith('/bookings') || pathname?.startsWith('/subscription')

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (showNotifications && !(event.target as HTMLElement)?.closest('[class*="notification"]')) {
        setShowNotifications(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showNotifications])

  // Render nothing early - AFTER all hooks are called
  if (isDashboard) {
    return null
  }
  const isCustomer = user?.role === 'CUSTOMER'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-lg">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="text-2xl font-bold">Appoint-Nepal</div>
          <span className="hidden sm:inline text-sm font-medium opacity-80">Pro</span>
        </Link>

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
          
          {user && user.role === 'CUSTOMER' && (
            <>
              <Link href="/search" className="opacity-90 hover:opacity-100 transition text-sm font-medium">
                Browse Services
              </Link>
              <Link href="/bookings/my-bookings" className="opacity-90 hover:opacity-100 transition text-sm font-medium">
                My Bookings
              </Link>
              <Link href="/setup-business">
                <Button size="sm" variant="outline" className="opacity-90 hover:opacity-100 transition text-sm font-medium">
                  Setup Business
                </Button>
              </Link>
            </>
          )}
          
          {user && user.role === 'BUSINESS_OWNER' && (
            <>
              <Link href={`/dashboard/${user.business?.id}`} className="opacity-90 hover:opacity-100 transition text-sm font-medium">
                Dashboard
              </Link>
              <Link href={`/dashboard/${user.business?.id}/bookings`} className="opacity-90 hover:opacity-100 transition text-sm font-medium">
                Bookings
              </Link>
            </>
          )}
          
          <Link href="/help" className="opacity-90 hover:opacity-100 transition text-sm font-medium">
            Help & FAQ
          </Link>
        </div>

        {/* Desktop User Menu */}
        <div className="hidden md:flex items-center gap-3 relative">
          {user ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <Card className="absolute right-0 mt-2 w-80 bg-white text-slate-900 shadow-xl border border-slate-200">
                    <div className="p-4 border-b border-slate-200">
                      <h3 className="font-semibold">Notifications</h3>
                      {unreadCount > 0 && (
                        <p className="text-xs text-slate-600">{unreadCount} unread</p>
                      )}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="p-4 text-center text-slate-500">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            className="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition"
                            onClick={() => handleMarkAsRead(notif.id)}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-semibold text-sm">{notif.title}</p>
                              {!notif.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mb-2">{notif.message}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                )}
              </div>

              {/* User Profile Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-white/20 rounded-lg transition border border-white/20"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold">{user.name || user.email}</p>
                    <p className="text-xs opacity-70">
                      {user.role === 'BUSINESS_OWNER' ? 'Business Owner' : 'Customer'}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                    <UserIcon className="w-4 h-4" />
                  </div>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <Card className="absolute right-0 mt-2 w-56 bg-white text-slate-900 shadow-xl border border-slate-200 rounded-lg">
                    <div className="p-4 border-b border-slate-100">
                      <p className="font-semibold text-sm">{user.name || user.email}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {user.role === 'BUSINESS_OWNER' ? 'Business Owner' : 'Customer'}
                      </p>
                    </div>
                    
                    <div className="py-2">
                      <Link href="/account/profile" className="block px-4 py-2 hover:bg-slate-100 transition">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
                          <span className="text-sm">Profile</span>
                        </div>
                      </Link>
                      <Link href="/account/notifications" className="block px-4 py-2 hover:bg-slate-100 transition">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4" />
                          <span className="text-sm">Notifications</span>
                        </div>
                      </Link>
                      <Link href="/help" className="block px-4 py-2 hover:bg-slate-100 transition">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          <span className="text-sm">Help & FAQ</span>
                        </div>
                      </Link>
                    </div>
                    
                    <div className="border-t border-slate-100 p-2">
                      <button 
                        onClick={handleLogout}
                        className="w-full px-4 py-2 hover:bg-red-50 transition flex items-center gap-2 text-red-600 text-sm"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </Card>
                )}
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
                <p className="text-sm font-semibold px-2 py-2">{user.name || user.email}</p>
                <hr className="border-white/20" />
                
                {user.role === 'CUSTOMER' && (
                  <>
                    <Link href="/search" className="block">
                      <Button size="sm" variant="ghost" className="w-full justify-start hover:bg-white/20">
                        Browse Services
                      </Button>
                    </Link>
                    <Link href="/bookings/my-bookings" className="block">
                      <Button size="sm" variant="ghost" className="w-full justify-start hover:bg-white/20">
                        My Bookings
                      </Button>
                    </Link>
                    <Link href="/setup-business" className="block">
                      <Button size="sm" className="w-full justify-start bg-white/20 hover:bg-white/30">
                        Setup Business
                      </Button>
                    </Link>
                  </>
                )}
                
                {user.role === 'BUSINESS_OWNER' && (
                  <>
                    <Link href={`/dashboard/${user.business?.id}`} className="block">
                      <Button size="sm" variant="ghost" className="w-full justify-start hover:bg-white/20">
                        Dashboard
                      </Button>
                    </Link>
                    <Link href={`/dashboard/${user.business?.id}/bookings`} className="block">
                      <Button size="sm" variant="ghost" className="w-full justify-start hover:bg-white/20">
                        Bookings
                      </Button>
                    </Link>
                  </>
                )}
                
                <Link href="/help" className="block">
                  <Button size="sm" variant="ghost" className="w-full justify-start hover:bg-white/20">
                    Help & FAQ
                  </Button>
                </Link>
                
                <hr className="border-white/20" />
                
                <Link href="/account/profile" className="block">
                  <Button size="sm" variant="ghost" className="w-full justify-start hover:bg-white/20">
                    Profile
                  </Button>
                </Link>
                <Link href="/account/notifications" className="block">
                  <Button size="sm" variant="ghost" className="w-full justify-start hover:bg-white/20">
                    Notifications
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start hover:bg-destructive/20"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="block">
                  <Button size="sm" variant="ghost" className="w-full justify-start">
                    Login
                  </Button>
                </Link>
                <Link href="/signup" className="block">
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
