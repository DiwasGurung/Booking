'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, MessageSquarePlus } from 'lucide-react'
import { useAuth } from '@/context/authContext'
import { FeedbackModal } from './FeedbackModal'

// Same routes where the Header (and its mobile tab bar) is hidden.
// Ideally move this into a shared helper used by both Header and Footer.
const routesWithoutTabBar = (pathname: string | null) =>
  pathname?.startsWith('/dashboard') ||
  pathname?.startsWith('/bookings') ||
  pathname?.startsWith('/subscription') ||
  pathname === '/login' ||
  pathname === '/signup' ||
  pathname === '/staff/login' ||
  pathname?.startsWith('/book/') ||
  pathname?.startsWith('/staff/')

const linkClass = 'text-sm hover:text-white active:text-white transition block py-1.5'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const { user } = useAuth()
  const pathname = usePathname()

  const getStartedHref = user ? '/setup-business' : '/signup-business'

  // Leave room for the fixed bottom tab bar on mobile so the last line isn't covered
  const hasTabBar = !routesWithoutTabBar(pathname)
  const bottomSpace = hasTabBar
    ? 'pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0'
    : ''

  return (
    <footer className={`bg-slate-900 text-slate-200 mt-auto ${bottomSpace}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 md:pt-12 pb-6 md:pb-12">
        {/* 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl font-bold text-white mb-2 md:mb-4">Appoint-Nepal</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              The modern appointment booking platform for service businesses and customers.
            </p>
          </div>

          {/* Customer Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2 md:mb-4">For Customers</h4>
            <div>
              <Link href="/search" className={linkClass}>
                Browse Services
              </Link>
              <Link href="/account/profile" className={linkClass}>
                My Bookings
              </Link>
              <Link href="/help" className={linkClass}>
                Help &amp; FAQ
              </Link>
            </div>
          </div>

          {/* Business Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2 md:mb-4">For Businesses</h4>
            <div>
              <Link href={getStartedHref} className={linkClass}>
                Get Started
              </Link>
              <Link href="/pricing" className={linkClass}>
                Pricing
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-sm font-semibold text-white mb-2 md:mb-4">Legal &amp; Support</h4>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-x-6">
              <Link href="/privacy" className={linkClass}>
                Privacy Policy
              </Link>
              <Link href="/terms" className={linkClass}>
                Terms of Service
              </Link>
              <Link href="/contact" className={linkClass}>
                Contact Us
              </Link>
              <button
                onClick={() => setFeedbackOpen(true)}
                className="text-sm text-left hover:text-white active:text-white transition flex items-center gap-1.5 py-1.5"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                Suggest a Feature
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 pt-6 md:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
            <p className="text-sm text-slate-400">
              &copy; {currentYear} Appoint-Nepal. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-sm">Made with</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-sm">by the Appoint-Nepal team</span>
            </div>
          </div>
        </div>
      </div>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} role="visitor" />
    </footer>
  )
}