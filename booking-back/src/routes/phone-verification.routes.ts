// import { Router } from 'express'
// import { auth } from '../middleware/auth.middleware'
// import {
//   sendPhoneVerificationCode,
//   verifyPhoneNumber,
//   resendPhoneVerificationCode,
// } from '../controllers/phone-verification.controller'

// const router = Router()

// /**
//  * @route POST /api/phone-verification/send-code
//  * @desc Send a 6-digit OTP to user's phone number
//  * @access Private (Requires authentication)
//  * @param {string} phoneNumber - Nepali phone number (format: 98XXXXXXXX)
//  * @returns {Object} { success: boolean, message: string, codeSent: boolean }
//  */
// router.post('/send-code', auth, sendPhoneVerificationCode)

// /**
//  * @route POST /api/phone-verification/verify
//  * @desc Verify phone number with OTP code
//  * @access Private (Requires authentication)
//  * @param {string} phoneNumber - Nepali phone number (format: 98XXXXXXXX)
//  * @param {string} code - 6-digit OTP code
//  * @returns {Object} { success: boolean, message: string, isPhoneVerified: boolean }
//  */
// router.post('/verify', auth, verifyPhoneNumber)

// /**
//  * @route POST /api/phone-verification/resend-code
//  * @desc Resend OTP code to phone number
//  * @access Private (Requires authentication)
//  * @param {string} phoneNumber - Nepali phone number (format: 98XXXXXXXX)
//  * @returns {Object} { success: boolean, message: string, codeSent: boolean }
//  */
// router.post('/resend-code', auth, resendPhoneVerificationCode)

// export default router
