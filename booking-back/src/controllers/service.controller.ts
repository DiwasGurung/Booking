import { Request, Response } from "express"
import ServiceService from "../services/service.service"
import { isValidationError } from "../validators/index"
import { ServiceParamsSchema, BusinessIdParamsSchema, CreateServiceSchema, UpdateServiceSchema, parseAndValidate } from "../validators/index"
import subscriptionService from "../services/subscription.service"

class ServiceController {
  /**
   * Get all services (with optional businessId filter)
   */
  async getAll(req: Request, res: Response) {
    try {
      const { businessId } = req.query
      
      if (businessId) {
        const services = await ServiceService.getServicesByBusinessId(businessId as string)
        return res.json({ data: services })
      }
      
      const services = await ServiceService.getAllServices()
      res.json({ data: services })
    } catch (error) {
      console.error('[v0] Error getting services:', error)
      res.status(500).json({ message: "Failed to fetch services", error })
    }
  }

  /**
   * Get service by ID
   */
  async getById(req: Request, res: Response) {
    try {

      
      const validation = parseAndValidate(ServiceParamsSchema, req.params)
      if (isValidationError(validation)) {
        return res.status(400).json({ message: validation.error })
      }

      const service = await ServiceService.getServiceById(validation.data.id)
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" })
      }
      
      res.json({ data: service })
    } catch (error) {
      console.error('[v0] Error getting service:', error)
      res.status(500).json({ message: "Failed to fetch service", error })
    }
  }

  /**
   * Get services by business ID
   */
  async getByBusinessId(req: Request, res: Response) {
    try {
      
      const validation = parseAndValidate(BusinessIdParamsSchema, req.params)
      if (isValidationError(validation)) {
        return res.status(400).json({ message: validation.error })
      }

      const services = await ServiceService.getServicesByBusinessId(validation.data.businessId)
      res.json({ data: services })
    } catch (error) {
      console.error('[v0] Error getting services by business:', error)
      res.status(500).json({ message: "Failed to fetch services", error })
    }
  }

  /**
   * Create service
   */
  async create(req: Request, res: Response) {
    try {
      
      const validation = parseAndValidate(CreateServiceSchema, req.body)
      if (isValidationError(validation)) {
        return res.status(400).json({ message: validation.error })
      }

      const { businessId, name, description, price, duration } = validation.data

   
      const serviceLimit = await subscriptionService.canAddService(businessId)
      
      if (!serviceLimit.allowed) {
        console.warn('[v0] Service limit exceeded for business:', businessId)
        return res.status(429).json({
          message: serviceLimit.reason || 'Service limit reached. Please upgrade your subscription.',
          error: 'SERVICE_LIMIT_EXCEEDED',
          current: serviceLimit.current,
          limit: serviceLimit.limit,
           overLimit: true,
        })
      }

      const service = await ServiceService.createService({
        businessId,
        name,
        description,
        price,
        duration,
      })
      res.status(201).json({ data: service })
    } catch (error) {
      console.error('[v0] Error creating service:', error)
      res.status(500).json({ message: "Failed to create service", error })
    }
  }

  /**
   * Update service
   */
  async update(req: Request, res: Response) {
    try {

      
      const paramsValidation = parseAndValidate(ServiceParamsSchema, req.params)
      if (isValidationError(paramsValidation)) {
        return res.status(400).json({ message: paramsValidation.error })
      }

      const bodyValidation = parseAndValidate(UpdateServiceSchema, req.body)
      if (isValidationError(bodyValidation)) {
        return res.status(400).json({ message: bodyValidation.error })
      }

      const { name, description, price, duration } = bodyValidation.data
      const service = await ServiceService.updateService(paramsValidation.data.id, {
        name,
        description,
        price,
        duration,
      })
      res.json({ data: service })
    } catch (error) {
      console.error('[v0] Error updating service:', error)
      res.status(500).json({ message: "Failed to update service", error })
    }
  }

  /**
   * Delete service
   */
  async delete(req: Request, res: Response) {
    try {
      
      const validation = parseAndValidate(ServiceParamsSchema, req.params)
      if (isValidationError(validation)) {
        return res.status(400).json({ message: validation.error })
      }

      await ServiceService.deleteService(validation.data.id)
      res.json({ message: "Service deleted successfully" })
    } catch (error) {
      console.error('[v0] Error deleting service:', error)
      res.status(500).json({ message: "Failed to delete service", error })
    }
  }

  /**
   * Get active services for a business
   */
  async getActiveServices(req: Request, res: Response) {
    try {
      
      const validation = parseAndValidate(BusinessIdParamsSchema, req.params)
      if (isValidationError(validation)) {
        return res.status(400).json({ message: validation.error })
      }

      const services = await ServiceService.getActiveServices(validation.data.businessId)
      res.json({ data: services })
    } catch (error) {
      console.error('[v0] Error getting active services:', error)
      res.status(500).json({ message: "Failed to fetch active services", error })
    }
  }

  /**
   * Get services with booking statistics
   */
  async withStats(req: Request, res: Response) {
    try {
      
      const validation = parseAndValidate(BusinessIdParamsSchema, req.params)
      if (isValidationError(validation)) {
        return res.status(400).json({ message: validation.error })
      }

      const servicesWithStats = await ServiceService.getServicesWithStats(validation.data.businessId)
      res.json({ data: servicesWithStats })
    } catch (error) {
      console.error('[v0] Error getting services with stats:', error)
      res.status(500).json({ message: "Failed to fetch services with stats", error })
    }
  }
}

export default new ServiceController()
