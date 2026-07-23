'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

export function LoginFormToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // Determine current type based on pathname
  const isStaffLogin = pathname === '/staff/login'

  const handleToggle = (isStaff: boolean) => {
    if ((isStaff && isStaffLogin) || (!isStaff && !isStaffLogin)) {
      return // Already on correct page
    }

    setIsTransitioning(true)
    
    // Fade out animation
    setTimeout(() => {
      const targetPath = isStaff ? '/staff/login' : '/login'
      router.push(targetPath)
      
      // Fade in animation
      setTimeout(() => {
        setIsTransitioning(false)
      }, 50)
    }, 300)
  }

  return (
    <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
      {/* Toggle Switch */}
      <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-fit">
        {/* Business/Customer Option */}
        <button
          onClick={() => handleToggle(false)}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-300 ${
            !isStaffLogin
              ? 'bg-background text-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Business/Customer
        </button>

        {/* Staff Option */}
        <button
          onClick={() => handleToggle(true)}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-300 ${
            isStaffLogin
              ? 'bg-background text-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Staff
        </button>
      </div>
    </div>
  )
}
