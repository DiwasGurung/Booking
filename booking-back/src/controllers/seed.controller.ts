import { Request, Response } from 'express'
import  prisma  from '../lib/prisma'

class SeedController {
  /**
   * Seed subscription plans (admin only)
   */
  async seedPlans(req: Request, res: Response) {
    try {
      console.log('[v0] Seeding subscription plans...')

      // Delete existing plans and recreate with new limits
      const existingPlans = await prisma.subscriptionPlan.findMany()
      if (existingPlans.length > 0) {
        console.log('[v0] Deleting existing plans to update with new limits...')
        await prisma.subscriptionPlan.deleteMany()
      }

      const plans = [
        {
          name: 'Basic',
          displayName: 'Basic Plan',
          description: 'Perfect for getting started',
          priceNPR: 2999, // Rs. 2,999/month
          durationDays: 30,
          features: [
            '50 bookings/month',
            'Up to 2 staff members',
            '5 services',
            'Email notifications',
            'Basic analytics',
          ],
          // Limits
          maxAppointmentsPerMonth: 50,
          maxStaff: 2,
          maxServices: 5,
          maxCustomers: 100,
          maxSmsPerMonth: 0,  // SMS disabled
          // Features
          allowSmsNotifications: false,
          allowEmailNotifications: true,
          allowOnlineBooking: true,
          allowReports: false,
          allowCustomBranding: false,
          prioritySupport: false,
        },
        {
          name: 'Professional',
          displayName: 'Professional Plan',
          description: 'For growing businesses',
          priceNPR: 5999, // Rs. 5,999/month
          durationDays: 30,
          features: [
            '500 bookings/month',
            'Up to 10 staff members',
            '20 services',
            'SMS & Email notifications',
            'Advanced analytics',
            'Custom branding',
          ],
          // Limits
          maxAppointmentsPerMonth: 500,
          maxStaff: 10,
          maxServices: 20,
          maxCustomers: 500,
          maxSmsPerMonth: 100,  // 100 SMS per month
          // Features
          allowSmsNotifications: true,
          allowEmailNotifications: true,
          allowOnlineBooking: true,
          allowReports: true,
          allowCustomBranding: true,
          prioritySupport: false,
        },
        {
          name: 'Enterprise',
          displayName: 'Enterprise Plan',
          description: 'For large-scale operations',
          priceNPR: 9999, // Rs. 9,999/month
          durationDays: 30,
          features: [
            'Unlimited bookings',
            'Unlimited staff',
            'Unlimited services',
            'SMS & Email notifications',
            'Full analytics & reports',
            'Custom branding',
            'Priority 24/7 support',
            'API access',
          ],
          // Limits (-1 means unlimited)
          maxAppointmentsPerMonth: -1,
          maxStaff: -1,
          maxServices: -1,
          maxCustomers: -1,
          maxSmsPerMonth: -1,  // Unlimited SMS
          // Features
          allowSmsNotifications: true,
          allowEmailNotifications: true,
          allowOnlineBooking: true,
          allowReports: true,
          allowCustomBranding: true,
          prioritySupport: true,
        },
      ]

      const createdPlans = await Promise.all(
        plans.map((plan) =>
          prisma.subscriptionPlan.create({
            data: plan,
          })
        )
      )

      console.log('[v0] Successfully created', createdPlans.length, 'subscription plans with limits')
      res.json({
        message: 'Subscription plans seeded successfully',
        plans: createdPlans,
      })
    } catch (error: any) {
      console.error('[v0] Error seeding plans:', error)
      res.status(500).json({
        message: 'Failed to seed plans',
        error: error.message,
      })
    }
  }

  /**
   * Get all plans
   */
  async getPlans(req: Request, res: Response) {
    try {
      console.log('[v0] Fetching all subscription plans')

      const plans = await prisma.subscriptionPlan.findMany({
        where: { active: true },
        orderBy: { priceNPR: 'asc' },
      })

      res.json({
        count: plans.length,
        plans,
      })
    } catch (error: any) {
      console.error('[v0] Error fetching plans:', error)
      res.status(500).json({
        message: 'Failed to fetch plans',
        error: error.message,
      })
    }
  }
}

export default new SeedController()
