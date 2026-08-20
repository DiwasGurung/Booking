import { Request, Response } from "express"
import CustomerService from "../services/customer.service"

class CustomerController {
  /**
   * Create customer
   */
  async create(req: Request, res: Response) {
    try {
      const customer = await CustomerService.createCustomer(req.body)
      res.status(201).json(customer)
    } catch (error) {
      res.status(500).json({ message: "Failed to create customer", error })
    }
  }

  /**
   * Get customer by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const customer = await CustomerService.getCustomerById(id as string)

      if (!customer) {
        return res.status(404).json({ message: "Customer not found" })
      }

      res.json(customer)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer", error })
    }
  }

  /**
   * Get customers of a business (pagination)
   */
  async getBusinessCustomers(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 10

      const result = await CustomerService.getBusinessCustomers(
        businessId as string,
        page,
        limit,
      )

      res.json(result)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers", error })
    }
  }

  /**
   * Update customer
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      const customer = await CustomerService.updateCustomer(id as string, req.body)
      res.json(customer)
    } catch (error) {
      res.status(500).json({ message: "Failed to update customer", error })
    }
  }

  /**
   * Delete customer
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      const customer = await CustomerService.deleteCustomer(id as string)
      res.json(customer)
    } catch (error) {
      res.status(500).json({ message: "Failed to delete customer", error })
    }
  }

  /**
   * Get or create customer
   */
  async getOrCreate(req: Request, res: Response) {
    try {
      const customer = await CustomerService.getOrCreateCustomer(req.body)
      res.json(customer)
    } catch (error) {
      res.status(500).json({ message: "Failed to get or create customer", error })
    }
  }

  /**
   * Customer statistics
   */
  async stats(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const stats = await CustomerService.getCustomerStats(customerId as string)
      res.json(stats)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer stats", error })
    }
  }

  /**
   * Search customers
   */
  async search(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      const query = req.query.q as string
      const limit = Number(req.query.limit) || 10

      if (!query) {
        return res.status(400).json({ message: "Search query is required" })
      }

      const customers = await CustomerService.searchCustomers(
        businessId as string,
        query,
        limit,
      )

      res.json(customers)
    } catch (error) {
      res.status(500).json({ message: "Customer search failed", error })
    }
  }
}

export default new CustomerController()
