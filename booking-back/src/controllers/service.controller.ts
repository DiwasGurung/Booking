import { Request, Response } from "express"
import ServiceService from "../services/service.service"

class ServiceController {
  /**
   * Create service
   */
  async create(req: Request, res: Response) {
    try {
      const service = await ServiceService.createService(req.body)
      res.status(201).json(service)
    } catch (error) {
      res.status(500).json({ message: "Failed to create service", error })
    }
  }

  /**
   * Get service by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const service = await ServiceService.getServiceById(id as string)

      if (!service) {
        return res.status(404).json({ message: "Service not found" })
      }

      res.json(service)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service", error })
    }
  }

  /**
   * Get all services for a business
   */
  async getBusinessServices(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      const services = await ServiceService.getBusinessServices(businessId as string)
      res.json(services)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services", error })
    }
  }

  /**
   * Get active services for a business
   */
  async getActiveServices(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      const services = await ServiceService.getActiveServices(businessId as string)
      res.json(services)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active services", error })
    }
  }

  /**
   * Update service
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      const service = await ServiceService.updateService(id as string, req.body)
      res.json(service)
    } catch (error) {
      res.status(500).json({ message: "Failed to update service", error })
    }
  }

  /**
   * Delete service
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      const service = await ServiceService.deleteService(id as string)
      res.json(service)
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service", error })
    }
  }

  /**
   * Services with booking stats
   */
  async withStats(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      const services = await ServiceService.getServicesWithStats(businessId as string)
      res.json(services)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service stats", error })
    }
  }
}

export default new ServiceController()
