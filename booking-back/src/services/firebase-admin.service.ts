import * as admin from 'firebase-admin'

let firebaseApp: admin.app.App

export function initializeAdmin() {
  if (!firebaseApp) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    })

    console.log('[v0] Firebase Admin initialized')
  }

  return firebaseApp
}

export async function syncFirebaseUserToDatabase(uid: string, email: string, phone?: string) {
  try {
    const auth = admin.auth()
    const firebaseUser = await auth.getUser(uid)

    console.log('[v0] Syncing Firebase user to database:', uid)

    // Return user data to be synced with database
    return {
      firebaseUid: uid,
      email: firebaseUser.email || email,
      phone: firebaseUser.phoneNumber || phone,
      isEmailVerified: firebaseUser.emailVerified,
      isPhoneVerified: !!firebaseUser.phoneNumber,
    }
  } catch (error) {
    console.error('[v0] Error syncing Firebase user:', error)
    throw error
  }
}

export async function getUserFromFirebase(uid: string) {
  try {
    const auth = admin.auth()
    const firebaseUser = await auth.getUser(uid)
    return firebaseUser
  } catch (error) {
    console.error('[v0] Error getting Firebase user:', error)
    return null
  }
}
