
import express from 'express'
import smsCreditController from '../controllers/sms-credit.controller'
import { auth } from '../middleware/auth.middleware'
import { initiateSmsCreditPayment, handleSmsEsewaSuccess, handleSmsEsewaFailure } from '../controllers/sms-credit-payment.controller'

const SmsCreditRoutes = express.Router()

SmsCreditRoutes.get('/sms/packages', smsCreditController.getPackages)
SmsCreditRoutes.get('/business/:businessId/sms/balance', auth, smsCreditController.getBalance)
SmsCreditRoutes.get('/business/:businessId/sms/transactions', auth, smsCreditController.getTransactions)
SmsCreditRoutes.post('/business/:businessId/sms/purchase', auth, smsCreditController.initiatePurchase)

SmsCreditRoutes.post('/sms-payment/esewa/initiate', auth, initiateSmsCreditPayment);
// eSewa redirects the browser here, so these two must NOT have auth middleware:
SmsCreditRoutes.get('/sms-payment/esewa/success', handleSmsEsewaSuccess);
SmsCreditRoutes.get('/sms-payment/esewa/failure', handleSmsEsewaFailure);

export default SmsCreditRoutes