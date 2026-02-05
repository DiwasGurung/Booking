import { Router } from "express"
import BusinessController from "../controllers/business.controller"

const businessRoutes = Router()

// Create business
businessRoutes.post("/", BusinessController.create)

// Get all businesses
businessRoutes.get("/", BusinessController.getAll)

// Search businesses
businessRoutes.get("/search", BusinessController.search)
// Get business by ID
businessRoutes.get("/:id", BusinessController.getById)

// Get business by user ID
businessRoutes.get("/user/:userId", BusinessController.getByUserId)

// Update business
businessRoutes.put("/:id", BusinessController.update)

// Delete business
businessRoutes.delete("/:id", BusinessController.delete)
// Business statistics
businessRoutes.get("/:businessId/stats", BusinessController.stats)

// Monthly revenue
businessRoutes.get("/:businessId/revenue", BusinessController.monthlyRevenue)

export default businessRoutes
