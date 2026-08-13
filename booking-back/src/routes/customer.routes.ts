import { Router } from "express"
import CustomerController from "../controllers/customer.controller.js"

const customerRoutes = Router()

// Create customer
customerRoutes.post("/", CustomerController.create)

// Get or create customer
customerRoutes.post("/get-or-create", CustomerController.getOrCreate)

// Get customers of a business
customerRoutes.get("/business/:businessId", CustomerController.getBusinessCustomers)

// Search customers
customerRoutes.get("/business/:businessId/search", CustomerController.search)

// Get customer by ID
customerRoutes.get("/:id", CustomerController.getById)
// Update customer
customerRoutes.put("/:id", CustomerController.update)

// Delete customer
customerRoutes.delete("/:id", CustomerController.delete)

// Customer statistics
customerRoutes.get("/:customerId/stats", CustomerController.stats)

export default customerRoutes;