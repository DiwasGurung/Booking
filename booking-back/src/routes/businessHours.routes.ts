import { Router } from "express"
import BusinessHoursController from "../controllers/businessHours.controller"

const businessHoursRoutes = Router()

// Set or update hours (upsert)
businessHoursRoutes.post("/", BusinessHoursController.set)

// Get all hours for a business
businessHoursRoutes.get("/business/:businessId", BusinessHoursController.getAll)

// Check if business is open
businessHoursRoutes.get("/business/:businessId/is-open", BusinessHoursController.isOpen)
// Get hours for specific day
businessHoursRoutes.get(
  "/business/:businessId/day/:dayOfWeek",
  BusinessHoursController.getByDay,
)

// Update hours by ID
businessHoursRoutes.put("/business/:businessId", BusinessHoursController.update)

// Delete hours by ID
businessHoursRoutes.delete("/:id", BusinessHoursController.delete)

export default businessHoursRoutes