import { Router } from "express"
import ServiceController from "../controllers/service.controller"

const serviceRoutes = Router()

// Create service
serviceRoutes.post("/", ServiceController.create)

// Get services for a business

serviceRoutes.get("/business/:businessId", ServiceController.getBusinessServices)

// Get active services for a business
serviceRoutes.get("/business/:businessId/active", ServiceController.getActiveServices)

// Get services with booking stats
serviceRoutes.get("/business/:businessId/stats", ServiceController.withStats)

// Get service by ID
serviceRoutes.get("/:id", ServiceController.getById)

// Update service
serviceRoutes.put("/:id", ServiceController.update)     
// Delete service
serviceRoutes.delete("/:id", ServiceController.delete)

export default serviceRoutes;