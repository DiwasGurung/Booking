'use client'

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut,
  PhoneAuthProvider,
  RecaptchaVerifier,
} from 'firebase/auth'
import { auth } from './firebase'

export interface FirebaseAuthResult {
  success: boolean
  message?: string
  user?: {
    uid: string
    email?: string
    phoneNumber?: string
  }
  verificationId?: string
}

/**
 * Register user with email and password using Firebase
 */
export async function firebaseRegisterWithEmail(
  email: string,
  password: string
): Promise<FirebaseAuthResult> {
  try {
    console.log('[v0] Firebase register with email:', email)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    console.log('[v0] Firebase user created:', user.uid)

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email || undefined,
      },
    }
  } catch (error: any) {
    console.error('[v0] Firebase register error:', error.code, error.message)
    let message = 'Registration failed'

    if (error.code === 'auth/email-already-in-use') {
      message = 'Email already registered'
    } else if (error.code === 'auth/weak-password') {
      message = 'Password must be at least 6 characters'
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address'
    }

    return { success: false, message }
  }
}

/**
 * Login user with email and password using Firebase
 */
export async function firebaseLoginWithEmail(
  email: string,
  password: string
): Promise<FirebaseAuthResult> {
  try {
    console.log('[v0] Firebase login with email:', email)
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    console.log('[v0] Firebase user logged in:', user.uid)

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email || undefined,
      },
    }
  } catch (error: any) {
    console.error('[v0] Firebase login error:', error.code, error.message)
    let message = 'Login failed'

    if (error.code === 'auth/user-not-found') {
      message = 'Email not found'
    } else if (error.code === 'auth/wrong-password') {
      message = 'Incorrect password'
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address'
    }

    return { success: false, message }
  }
}

/**
 * Send phone verification code using Firebase
 */
export async function firebaseSendPhoneCode(
  phoneNumber: string,
  recaptchaContainerId: string
): Promise<FirebaseAuthResult & { verificationId?: string }> {
  try {
    console.log('[v0] Sending Firebase phone code to:', phoneNumber)

    // Create recaptcha verifier
    const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: 'invisible',
    })

    // Send verification code
    const phoneProvider = new PhoneAuthProvider(auth)
    const verificationId = await phoneProvider.verifyPhoneNumber(
      phoneNumber,
      recaptchaVerifier
    )

    console.log('[v0] Firebase phone verification sent')

    return {
      success: true,
      message: 'Verification code sent to your phone',
      verificationId,
    }
  } catch (error: any) {
    console.error('[v0] Firebase phone send error:', error.code, error.message)
    let message = 'Failed to send verification code'

    if (error.code === 'auth/invalid-phone-number') {
      message = 'Invalid phone number'
    }

    return { success: false, message }
  }
}

/**
 * Verify phone code and complete sign-in using Firebase
 */
export async function firebaseVerifyPhoneCode(
  verificationId: string,
  code: string
): Promise<FirebaseAuthResult> {
  try {
    console.log('[v0] Verifying Firebase phone code')

    const credential = PhoneAuthProvider.credential(verificationId, code)
    const userCredential = await signInWithCredential(auth, credential)
    const user = userCredential.user

    console.log('[v0] Firebase phone verified:', user.uid)

    return {
      success: true,
      user: {
        uid: user.uid,
        phoneNumber: user.phoneNumber || undefined,
      },
    }
  } catch (error: any) {
    console.error('[v0] Firebase phone verify error:', error.code, error.message)
    let message = 'Verification failed'

    if (error.code === 'auth/invalid-verification-code') {
      message = 'Invalid verification code'
    }

    return { success: false, message }
  }
}

/**
 * Get current user from Firebase
 */
export function getCurrentFirebaseUser() {
  return auth.currentUser
}

/**
 * Get Firebase ID token for API calls
 */
export async function getFirebaseIdToken(): Promise<string | null> {
  try {
    const user = auth.currentUser
    if (!user) return null
    return await user.getIdToken()
  } catch (error) {
    console.error('[v0] Failed to get Firebase token:', error)
    return null
  }
}

/**
 * Logout from Firebase
 */
export async function firebaseLogout(): Promise<FirebaseAuthResult> {
  try {
    console.log('[v0] Firebase logout')
    await signOut(auth)
    return { success: true, message: 'Logged out successfully' }
  } catch (error: any) {
    console.error('[v0] Firebase logout error:', error.message)
    return { success: false, message: 'Logout failed' }
  }
}