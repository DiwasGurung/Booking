import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Calendar, Search, BarChart3, BookOpen } from 'lucide-react'

export function Navigation() {
  return (
    <nav className="border-b border-border bg-card shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl text-foreground">BookHub</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Book
              </Button>
            </Link>
            <Link href="/bookings">
              <Button variant="ghost" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                My Bookings
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="ghost" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline" className="hidden sm:flex bg-transparent">
              Sign In
            </Button>
            <Button className="bg-primary text-primary-foreground">Sign Up</Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex gap-2 mt-4 overflow-x-auto pb-2">
          <Link href="/" className="flex-shrink-0">
            <Button size="sm" variant="outline" className="flex items-center gap-1 bg-transparent">
              <BookOpen className="w-4 h-4" />
              <span>Book</span>
            </Button>
          </Link>
          <Link href="/bookings" className="flex-shrink-0">
            <Button size="sm" variant="outline" className="flex items-center gap-1 bg-transparent">
              <Calendar className="w-4 h-4" />
              <span>Bookings</span>
            </Button>
          </Link>
          <Link href="/search" className="flex-shrink-0">
            <Button size="sm" variant="outline" className="flex items-center gap-1 bg-transparent">
              <Search className="w-4 h-4" />
              <span>Search</span>
            </Button>
          </Link>
          <Link href="/dashboard" className="flex-shrink-0">
            <Button size="sm" variant="outline" className="flex items-center gap-1 bg-transparent">
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
