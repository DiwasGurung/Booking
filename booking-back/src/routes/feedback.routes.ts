import express from 'express'
import { submitFeedback } from '../controllers/feedback.controller'
import { optionalAuth } from '../middleware/auth.middleware'

const router = express.Router()

// Public route - works for logged-out visitors too, but picks up user context if logged in
router.post('/', optionalAuth, submitFeedback)

export default router