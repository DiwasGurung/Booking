import { Router } from "express"
import BusinessController from "../controllers/business.controller.js"
import { auth } from '../middleware/auth.middleware.js';

const businessRoutes = Router()

// Create business
businessRoutes.post("/", BusinessController.create)

// Get all businesses
businessRoutes.get("/", BusinessController.getAll)

businessRoutes.post("/setup/basic", auth, BusinessController.setupBasic)

// Search businesses (specific route before /:id)
businessRoutes.get("/search", BusinessController.search)

// Get business by user ID (specific route before /:id)
businessRoutes.get("/user/:userId", BusinessController.getByUserId)

// Business statistics (specific route before /:id)
businessRoutes.get("/:businessId/stats", BusinessController.stats)


// Get business settings (specific route before /:id)
businessRoutes.get('/:businessId/settings', auth,BusinessController.getSettings)

// Update business settings (specific route before /:id)
businessRoutes.put('/:businessId/settings', auth, BusinessController.updateSettings)

businessRoutes.get("/current", auth, (req, res) => BusinessController.getCurrentBusiness(req, res))

businessRoutes.get("/:id", BusinessController.getById)

// Update business
businessRoutes.put("/:id", BusinessController.update)

// Delete business
businessRoutes.delete("/:id", BusinessController.delete)

 // Analytics and statistics routes (specific routes before /:id)
  businessRoutes.get("/:businessId/analytics", auth, BusinessController.analytics)
  businessRoutes.get("/:businessId/stats", BusinessController.stats)

export default businessRoutes

