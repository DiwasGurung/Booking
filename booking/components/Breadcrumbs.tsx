'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  const pathname = usePathname()

  // Generate breadcrumbs from pathname if items not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items

    const segments = pathname.split('/').filter(Boolean)
    const crumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }]

    let href = ''
    segments.forEach((segment, index) => {
      href += `/${segment}`
      
      // Skip UUID segments and brackets
      if (segment.match(/^[0-9a-f-]{36}$/) || segment.includes('[')) {
        return
      }

      const label = segment
        .replace(/-/g, ' ')
        .replace(/\[|\]/g, '')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      if (index === segments.length - 1) {
        crumbs.push({ label })
      } else {
        crumbs.push({ label, href })
      }
    })

    return crumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  if (breadcrumbs.length <= 1) return null

  return (
    <nav className="flex items-center gap-1 text-sm mb-6" aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {item.href ? (
            <Link href={item.href} className="text-primary hover:text-primary/80 transition font-medium">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-600 font-medium">{item.label}</span>
          )}
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>
      ))}
    </nav>
  )
}
