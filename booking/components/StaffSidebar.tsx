'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ClipboardList, LayoutDashboard, Link2, LogOut, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface StaffSidebarProps {
  staff: {
    firstName: string
    lastName: string
    email: string
    role: string
  }
  staffCode: string
  onLogout: () => void
}

export function StaffSidebar({ staff, staffCode, onLogout }: StaffSidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const items = [
    { label: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
    ...(staffCode
      ? [
          { label: 'My Bookings', href: `/staff/${staffCode}/bookings`, icon: ClipboardList },
          { label: 'Booking Link', href: `/staff/${staffCode}/book`, icon: Link2 },
        ]
      : []),
  ]

  const active = (href: string) => {
    const path = href.split('#')[0]
    // Dashboard is exact-match only; nested staff pages must not activate it.
    return path === '/staff/dashboard' ? pathname === path : pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={open ? 'Close staff navigation' : 'Open staff navigation'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="fixed left-4 top-4 z-50 border-border bg-card shadow-sm md:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-foreground/30 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-card transition-transform duration-200 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-border px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Staff workspace</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">Bookwise</h2>
          <p className="mt-1 truncate text-sm text-muted-foreground">{staff.email}</p>
        </div>

        <nav aria-label="Staff navigation" className="flex-1 space-y-1 px-4 py-6">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active(item.href) ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  active(item.href)
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-muted/60 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{staff.firstName} {staff.lastName}</p>
              <p className="truncate text-xs text-muted-foreground">{staff.role}</p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={onLogout} className="w-full justify-start gap-3">
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>
    </>
  )
}
