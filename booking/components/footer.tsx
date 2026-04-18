'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">BookFlow</h3>
            <p className="text-sm text-slate-400">
              The modern appointment booking platform for service businesses and customers.
            </p>
          </div>

          {/* Customer Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">For Customers</h4>
            <div className="space-y-2">
              <Link href="/search" className="text-sm hover:text-white transition block">
                Browse Services
              </Link>
              <Link href="/bookings/my-bookings" className="text-sm hover:text-white transition block">
                My Bookings
              </Link>
              <Link href="/help" className="text-sm hover:text-white transition block">
                Help & FAQ
              </Link>
            </div>
          </div>

          {/* Business Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">For Businesses</h4>
            <div className="space-y-2">
              <Link href="/business/setup" className="text-sm hover:text-white transition block">
                Get Started
              </Link>
              <Link href="/dashboard" className="text-sm hover:text-white transition block">
                Dashboard
              </Link>
              <a href="/#pricing" className="text-sm hover:text-white transition block">
                Pricing
              </a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <div className="space-y-2">
              <a href="/privacy" className="text-sm hover:text-white transition block">
                Privacy Policy
              </a>
              <a href="/terms" className="text-sm hover:text-white transition block">
                Terms of Service
              </a>
              <a href="/contact" className="text-sm hover:text-white transition block">
                Contact Us
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-slate-400">
              {currentYear} BookFlow. All rights reserved.
            </p>
            <div className="flex items-center gap-2 mt-4 md:mt-0 text-slate-400">
              <span className="text-sm">Made with</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-sm">by the BookFlow team</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
