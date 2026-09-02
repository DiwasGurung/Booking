import express from 'express'
import SmsController from '../controllers/sms.controller'
import { auth } from '../middleware/auth.middleware'

const router = express.Router()

// All routes require authentication — the controller derives businessId
// from req.userId internally, so no businessId is ever accepted from the
// client (prevents one owner acting on/reading another business's SMS).
router.use(auth)

// Send test SMS
router.post('/test', SmsController.sendTest)

// Send bulk SMS
router.post('/send-bulk', SmsController.sendBulk)

// Resend SMS
router.post('/resend', SmsController.resendSMS)

// Get SMS logs
router.get('/logs', SmsController.getLogs)

// Get logs by phone number
router.get('/logs/:phoneNumber', SmsController.getLogsByPhone)

// Get SMS statistics
router.get('/statistics', SmsController.getStatistics)

// Get plan quota / usage summary
router.get('/usage', SmsController.getUsage)

export default router