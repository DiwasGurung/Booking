import { Router } from 'express'
import SubscriptionController from '../controllers/subscription.controller'
import { auth } from '../middleware/auth.middleware'

const subscriptionRoutes = Router()

// Create subscription with free trial
subscriptionRoutes.post('/create-trial', auth, (req, res) =>
  SubscriptionController.createWithTrial(req, res)
)

// Get subscription status
subscriptionRoutes.get('/status/:businessId', (req, res) =>
  SubscriptionController.getStatus(req, res)
)

// Check subscription validity
subscriptionRoutes.get('/check/:businessId', (req, res) =>
  SubscriptionController.checkValidity(req, res)
)

// Activate subscription after payment
subscriptionRoutes.post('/activate', auth, (req, res) =>
  SubscriptionController.activate(req, res)
)

// Check if trial has expired
subscriptionRoutes.get('/trial-expiration/:businessId', (req, res) =>
  SubscriptionController.checkTrialExpiration(req, res)
)

// Feature gating checks
subscriptionRoutes.get('/limits/appointment/:businessId', (req, res) =>
  SubscriptionController.checkAppointmentLimit(req, res)
)

subscriptionRoutes.get('/limits/staff/:businessId', (req, res) =>
  SubscriptionController.checkStaffLimit(req, res)
)

subscriptionRoutes.get('/limits/service/:businessId', (req, res) =>
  SubscriptionController.checkServiceLimit(req, res)
)

// Get usage details
subscriptionRoutes.get('/usage/:businessId', (req, res) =>
  SubscriptionController.getUsageDetails(req, res)
)

// Get all plans
subscriptionRoutes.get('/plans/all', (req, res) =>
  SubscriptionController.getAllPlans(req, res)
)

// Upgrade subscription
subscriptionRoutes.post('/upgrade', auth, (req, res) =>
  SubscriptionController.upgrade(req, res)
)

// Downgrade subscription
subscriptionRoutes.post('/downgrade', auth, (req, res) =>
  SubscriptionController.downgrade(req, res)
)

// Renew subscription
subscriptionRoutes.post('/renew', auth, (req, res) =>
  SubscriptionController.renew(req, res)
)

// Get next renewal date
subscriptionRoutes.get('/renewal-date/:businessId', (req, res) =>
  SubscriptionController.getNextRenewal(req, res)
)

export default subscriptionRoutes
