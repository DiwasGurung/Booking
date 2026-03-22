import { Router } from "express"
import BusinessController from "../controllers/business.controller"
import { auth } from '../middleware/auth.middleware';

const businessRoutes = Router()

// Create business
businessRoutes.post("/", BusinessController.create)

// Get all businesses
businessRoutes.get("/", BusinessController.getAll)


// Search businesses (specific route before /:id)
businessRoutes.get("/search", BusinessController.search)

// Get business by user ID (specific route before /:id)
businessRoutes.get("/user/:userId", BusinessController.getByUserId)

// Business statistics (specific route before /:id)
businessRoutes.get("/:businessId/stats", BusinessController.stats)

// Monthly revenue (specific route before /:id)
businessRoutes.get("/:businessId/revenue", BusinessController.monthlyRevenue)

// Get business settings (specific route before /:id)
businessRoutes.get('/:businessId/settings', auth,BusinessController.getSettings)

// Update business settings (specific route before /:id)
businessRoutes.put('/:businessId/settings', auth, BusinessController.updateSettings)

// GENERIC PARAMETER ROUTES COME LAST
// Get business by ID (MUST be after all /:businessId/* routes)
businessRoutes.get("/:id", BusinessController.getById)

// Update business
businessRoutes.put("/:id", BusinessController.update)

// Delete business
businessRoutes.delete("/:id", BusinessController.delete)

export default businessRoutes

