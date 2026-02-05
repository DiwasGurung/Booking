import { Router } from "express"
import ReviewController from "../controllers/review.controller"

const reviewRoutes = Router()

// Create review
reviewRoutes.post("/", ReviewController.create)

// Get reviews for a business
reviewRoutes.get("/business/:businessId", ReviewController.getBusinessReviews)

// Review statistics
reviewRoutes.get("/business/:businessId/stats", ReviewController.stats)

// Get review by ID
reviewRoutes.get("/:id", ReviewController.getById)
// Update review
reviewRoutes.put("/:id", ReviewController.update)

// Delete review
reviewRoutes.delete("/:id", ReviewController.delete)

export default reviewRoutes