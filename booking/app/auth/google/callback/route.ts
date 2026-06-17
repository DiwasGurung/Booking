import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle Google OAuth errors
    if (error) {
      console.error('[v0] Google OAuth error:', error)
      return NextResponse.redirect(new URL('/login?error=google_auth_failed', request.url))
    }

    if (!code) {
      console.error('[v0] No authorization code received from Google')
      return NextResponse.redirect(new URL('/login?error=no_code', request.url))
    }

    console.log('[v0] Received Google OAuth code, exchanging with backend...')

    // Send code to backend to exchange for JWT token
    const response = await fetch(`${API_URL}/api/users/google/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('[v0] Backend Google auth failed:', error)
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }

    const data = await response.json()
    console.log('[v0] Google auth successful, user data:', data.user)
    console.log('[v0] User role:', data.user?.role)

    // Determine redirect based on user role
    let redirectPath = '/search' // Default for customers
    
    if (data.user?.role === 'BUSINESS_OWNER') {
      // Check if business owner has an existing business
      if (data.user?.business?.id) {
        redirectPath = `/dashboard/${data.user.business.id}`
      } else {
        redirectPath = '/business/setup'
      }
    } else if (data.user?.role === 'ADMIN') {
      redirectPath = '/admin'
    }
    
    // Add auth refresh trigger to URL
    const redirectUrl = new URL(redirectPath, request.url)
    redirectUrl.searchParams.set('authRefresh', 'true')
    
    console.log('[v0] Redirecting to:', redirectUrl.toString())

    const redirectResponse = NextResponse.redirect(redirectUrl)

    // Copy all Set-Cookie headers from backend response
    const setCookieHeaders = response.headers.getSetCookie()
    if (setCookieHeaders.length > 0) {
      setCookieHeaders.forEach(cookie => {
        redirectResponse.headers.append('set-cookie', cookie)
      })
      console.log('[v0] Set-Cookie headers copied:', setCookieHeaders.length)
    }

    return redirectResponse
  } catch (error) {
    console.error('[v0] Google OAuth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=callback_error', request.url))
  }
}
