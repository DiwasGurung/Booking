import { useEffect, useState } from 'react'
import { useAuth } from '@/context/authContext'

export const useBusinessId = () => {
  const { user } = useAuth()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.business?.id) {
      // If user is already loaded from context, use their business ID
      setBusinessId(user.business.id)
      setLoading(false)
    } else if (!user) {
      // User is not authenticated
      setError('User not authenticated')
      setLoading(false)
    } else if (user && !user.business?.id) {
      // User is authenticated but has no business
      setError('No business found for user')
      setLoading(false)
    }
  }, [user])

  return { businessId, loading, error }
}
