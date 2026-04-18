import { Router } from 'express'
import SeedController from '../controllers/seed.controller'

const seedRoutes = Router()

// Seed subscription plans
seedRoutes.post('/plans', (req, res) => SeedController.seedPlans(req, res))

// Get all plans
seedRoutes.get('/plans', (req, res) => SeedController.getPlans(req, res))

export default seedRoutes
