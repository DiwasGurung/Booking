export interface BusinessUser {
  id: string
  name: string
  email: string
  password?: string
  role?: "CUSTOMER" | "BUSINESS_OWNER"
  business?: {
    id: string
    name: string
  }
  [key: string]: any
}

export interface LoginResponse {
  token?: string
  success: boolean
  message?: string
  user?: BusinessUser
  emailNotVerified?: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

/**
 * Login using session-based authentication with HTTP-only cookies
 * All auth state is managed via secure backend cookies
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      // Check if email needs verification
      if (res.status === 403 && data.emailNotVerified) {
        return { 
          success: false, 
          message: data.error || 'Please verify your email first',
          emailNotVerified: true,
          user: { email } as any
        }
      }
      return { success: false, message: data.error || 'Login failed' }
    }

    return { success: true, user: data.user || data.data }
  } catch (err) {
    return { success: false, message: 'Network error - cannot reach server' }
  }
}

/**
 * Logout and clear session
 */
export async function logout() {
  try {
    await fetch(`${API_BASE_URL}/api/users/logout`, {
      method: 'POST',
      credentials: 'include', // Include cookies to invalidate session
    })
    // Cookies are automatically cleared by the server
  } catch (err) {
    console.error('[v0] Logout failed:', err)
  }
}

/**
 * Get current user from session
 * Fetches from backend /api/users/me endpoint
 */
export async function getCurrentUser(): Promise<BusinessUser | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: 'GET',
      credentials: 'include', // Include session cookies
    })

    if (!res.ok) {
      return null
    }

    const data = await res.json()
    return data.user || null
  } catch (err) {
    console.error('[v0] Failed to fetch current user:', err)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Update user profile information
 */
export async function updateUserProfile(userId: string, data: {
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const responseData = await res.json()
    throw new Error(responseData.message || 'Failed to update profile')
  }

  return res.json()
}

/**
 * Change user password
 */
export async function changePassword(userId: string, data: {
  currentPassword: string
  newPassword: string
}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const responseData = await res.json()
    throw new Error(responseData.message || 'Failed to change password')
  }

  return res.json()
}

/**
 * Refresh user session (used after login to ensure cookie is set)
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: 'GET',
      credentials: 'include',
    })
    return res.ok
  } catch {
    return false
  }
}

