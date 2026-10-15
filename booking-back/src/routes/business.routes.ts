import { Router } from "express"
import BusinessController from "../controllers/business.controller"
import { auth } from '../middleware/auth.middleware'
import { requireBusinessOwner } from '../middleware/business-owner.middleware'

const businessRoutes = Router()

// ---- Public ----
businessRoutes.get("/", BusinessController.getAll)
businessRoutes.get("/search", BusinessController.search)
businessRoutes.get('/public/:id', BusinessController.getPublicById)

// ---- Authenticated, no business id (must come before "/:id") ----
businessRoutes.post("/", auth, BusinessController.create)
businessRoutes.post("/setup/basic", auth, BusinessController.setupBasic)
businessRoutes.get("/current", auth, (req, res) => BusinessController.getCurrentBusiness(req, res))
businessRoutes.get("/user/:userId", auth, BusinessController.getByUserId)

// ---- Owner only: :businessId routes ----
businessRoutes.get("/:businessId/stats", auth, requireBusinessOwner, BusinessController.stats)
businessRoutes.get("/:businessId/analytics", auth, requireBusinessOwner, BusinessController.analytics)
businessRoutes.get("/:businessId/customer-insights", auth, requireBusinessOwner, BusinessController.customerInsights)
businessRoutes.get('/:businessId/settings', auth, requireBusinessOwner, BusinessController.getSettings)
businessRoutes.put('/:businessId/settings', auth, requireBusinessOwner, BusinessController.updateSettings)
businessRoutes.get('/:businessId/slug-available', auth, requireBusinessOwner, BusinessController.checkSlug)
businessRoutes.patch('/:businessId/slug', auth, requireBusinessOwner, BusinessController.updateSlug)

// ---- Owner only: :id routes (last, since "/:id" matches any single segment) ----
businessRoutes.get("/:id", auth, requireBusinessOwner, BusinessController.getById)
businessRoutes.put("/:id", auth, requireBusinessOwner, BusinessController.update)
businessRoutes.delete("/:id", auth, requireBusinessOwner, BusinessController.delete)

export default businessRoutes