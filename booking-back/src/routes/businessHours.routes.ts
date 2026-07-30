import { Router } from "express"
import BusinessHoursController from "../controllers/businessHours.controller"
import { auth } from "../middleware/auth.middleware"

const businessHoursRoutes = Router()

// Business Hours Routes
businessHoursRoutes.post("/", BusinessHoursController.set)
businessHoursRoutes.get("/business/:businessId", BusinessHoursController.getAll)
businessHoursRoutes.get("/business/:businessId/is-open", BusinessHoursController.isOpen)
businessHoursRoutes.get("/business/:businessId/day/:dayOfWeek", BusinessHoursController.getByDay)
businessHoursRoutes.put("/business/:businessId", BusinessHoursController.update)
businessHoursRoutes.delete("/:id", BusinessHoursController.delete)


businessHoursRoutes.post("/:businessId/closed-dates", auth, BusinessHoursController.addClosedDate)
businessHoursRoutes.get("/:businessId/closed-dates", BusinessHoursController.getClosedDates)
businessHoursRoutes.delete("/:businessId/closed-dates/:dateId", auth, BusinessHoursController.removeClosedDate)

// Time Off Routes
businessHoursRoutes.post("/:businessId/time-off", auth, BusinessHoursController.addTimeOff)
businessHoursRoutes.get("/:businessId/time-off", BusinessHoursController.getTimeOffs)
businessHoursRoutes.delete("/time-off/:timeOffId", auth, BusinessHoursController.removeTimeOff)

export default businessHoursRoutes
