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

export default subscriptionRoutes