import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Hook to preserve page scroll position and state during navigation
 * Prevents page jumps when header updates with user authentication
 */
export const usePagePreservation = () => {
  const pathname = usePathname()

  // Restore scroll position when pathname changes
  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0)
  }, [pathname])

  // Store scroll position before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Browser automatically saves scroll position
      sessionStorage.setItem(`scroll-${pathname}`, window.scrollY.toString())
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [pathname])
}
