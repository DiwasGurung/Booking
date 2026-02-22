import { Router } from "express"
import SubscriptionController from "../controllers/subscription.controller"

const subscriptionRoutes = Router()

subscriptionRoutes.post("/", SubscriptionController.create)

subscriptionRoutes.get("/:businessId", SubscriptionController.getByBusiness)

subscriptionRoutes.put("/:businessId/cancel", SubscriptionController.cancel)

subscriptionRoutes.get("/:businessId/validate", SubscriptionController.validate)

export default subscriptionRoutes
