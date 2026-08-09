'use client'

import { usePathname } from "next/navigation"
import React from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Hide footer on dashboard pages by applying styles to hide any footer elements
  React.useEffect(() => {
    // Hide any footer elements on dashboard pages
    const footers = document.querySelectorAll('footer, [role="contentinfo"]')
    footers.forEach(footer => {
      (footer as HTMLElement).style.display = 'none'
    })
    
    return () => {
      // Restore footer visibility when leaving dashboard
      footers.forEach(footer => {
        (footer as HTMLElement).style.display = ''
      })
    }
  }, [pathname])

  return <>{children}</>
}
