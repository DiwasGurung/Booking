import express from 'express'
import { createUser, loginUser, updateUserRole, logoutUser, changePassword, updateProfile, getCurrentUser, verifyEmail, resendVerificationEmail, resetPassword, requestPasswordReset } from '../controllers/user.controller'
import { auth, AuthRequest } from '../middleware/auth.middleware'

const router = express.Router()

// Public routes
router.post('/register', createUser)
router.post('/login', loginUser)

// Protected routes
router.get('/me', auth, getCurrentUser)
router.post('/logout', auth, logoutUser)
router.put('/role/:userId', auth, updateUserRole)
router.put('/password', auth, changePassword)
router.put('/:id/profile', auth, updateProfile)
router.post('/verify-email', verifyEmail)
router.post('/resend-verification', resendVerificationEmail)

router.post('/request-password-reset', requestPasswordReset)
router.post('/reset-password', resetPassword)

export default router
