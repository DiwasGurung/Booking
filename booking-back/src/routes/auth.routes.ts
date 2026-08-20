import express from 'express'
import { authController } from '../controllers/auth.controller'

const router = express.Router()

// Google OAuth
router.post('/google', authController.googleOAuth)

export default router
