import  prisma  from "../lib/prisma"
import type { Customer, Prisma } from "@prisma/client"

export class CustomerService {
  /**
   * Create a new customer
   */
  async createCustomer(data: {
    businessId: string
    name: string
    email: string
    phone: string
    notes?: string
  }): Promise<Customer> {
    return prisma.customer.create({
      data,
    })
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id: string): Promise<Customer | null> {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        bookings: true,
      },
    })
  }

  /**
   * Get all customers for a business
   */
  async getBusinessCustomers(
    businessId: string,
    page = 1,
    limit = 10,
  ): Promise<{ customers: Customer[]; total: number }> {
    const skip = (page - 1) * limit

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: { businessId },
        skip,
        take: limit,
        include: { _count: { select: { bookings: true } } },
        orderBy: { lastVisit: "desc" },
      }),
      prisma.customer.count({ where: { businessId } }),
    ])

    return { customers, total }
  }

  /**
   * Update customer
   */
  async updateCustomer(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
    return prisma.customer.update({
      where: { id },
      data,
    })
  }

  /**
   * Delete customer
   */
  async deleteCustomer(id: string): Promise<Customer> {
    return prisma.customer.delete({
      where: { id },
    })
  }

  /**
   * Get or create customer
   */
  async getOrCreateCustomer(data: {
    businessId: string
    name: string
    email: string
    phone: string
  }): Promise<Customer> {
    return prisma.customer.upsert({
      where: {
        businessId_email: {
          businessId: data.businessId,
          email: data.email,
        },
      },
      update: {
        name: data.name,
        phone: data.phone,
      },
      create: data,
    })
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        bookings: {
          include: { payment: true },
        },
      },
    })

    if (!customer) throw new Error("Customer not found")

    const completedBookings = customer.bookings.filter((b: any) => b.status === "COMPLETED")
    const totalSpent = completedBookings.reduce((sum: any, b: any) => sum + (b.payment?.amount || 0), 0)

    return {
      totalBookings: customer.bookings.length,
      completedBookings: completedBookings.length,
      totalSpent,
      averageSpent: completedBookings.length > 0 ? totalSpent / completedBookings.length : 0,
      lastVisit: customer.lastVisit,
    }
  }

  /**
   * Search customers
   */
  async searchCustomers(businessId: string, query: string, limit = 10) {
    return prisma.customer.findMany({
      where: {
        businessId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
    })
  }
}

export default new CustomerService()
