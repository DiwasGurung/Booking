'use client'

import React from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'

interface GoogleProviderProps {
  children: React.ReactNode
}

export function GoogleAuthProvider({ children }: GoogleProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!clientId) {
    return <>{children}</>
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  )
}
