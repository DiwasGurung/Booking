import  prisma  from '../src/lib/prisma'

export async function seedSubscriptionPlans() {
  try {
    console.log('[v0] Seeding subscription plans...')

    // Delete existing plans
    await prisma.subscriptionPlan.deleteMany()

    // Starter Plan - ₹499/month
    const starterPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'starter',
        displayName: 'Starter',
        priceNPR: 499,
        currency: 'NPR',
        durationDays: 30,
        description: 'Perfect for solo practitioners and new businesses',
        features: [
          'Up to 200 bookings/month',
          'Basic booking page',
          '5 services maximum',
          'SMS reminders',
          'Email support',
          '30-day booking history',
        ],
        active: true,
        maxAppointmentsPerMonth: 200,
        maxStaff: 1,
        maxServices: 5,
        maxCustomers: 100,
        maxSmsPerMonth: 100,
        allowSmsNotifications: true,
        allowEmailNotifications: true,
        allowOnlineBooking: true,
        allowReports: false,
        allowCustomBranding: false,
        prioritySupport: false,
      },
    })

    // Professional Plan - ₹999/month (Most Popular)
    const professionalPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'professional',
        displayName: 'Professional',
        priceNPR: 999,
        currency: 'NPR',
        durationDays: 30,
        description: 'For growing salons, clinics, and small teams',
        features: [
          'Unlimited bookings',
          'Unlimited services',
          'Staff management (up to 5 staff)',
          'Calendar sync (Google Calendar)',
          'Customer database & notes',
          'Automated reminders (SMS + Email)',
          'Payment collection (eSewa/Khalti)',
          'Basic analytics',
          'Priority email support',
        ],
        active: true,
        maxAppointmentsPerMonth: -1, // Unlimited
        maxStaff: 5,
        maxServices: -1, // Unlimited
        maxCustomers: -1, // Unlimited
        maxSmsPerMonth: 500,
        allowSmsNotifications: true,
        allowEmailNotifications: true,
        allowOnlineBooking: true,
        allowReports: true,
        allowCustomBranding: false,
        prioritySupport: true,
      },
    })

    // Enterprise Plan - ₹2,499/month
    const enterprisePlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'enterprise',
        displayName: 'Enterprise',
        priceNPR: 2499,
        currency: 'NPR',
        durationDays: 30,
        description: 'For large spas, chains, and multi-location businesses',
        features: [
          'Everything in Professional',
          'Unlimited staff',
          'Multiple locations',
          'Advanced analytics & reports',
          'Custom branding',
          'API access',
          'Dedicated account manager',
          'Phone + Email support',
          'Custom integrations',
        ],
        active: true,
        maxAppointmentsPerMonth: -1, // Unlimited
        maxStaff: -1, // Unlimited
        maxServices: -1, // Unlimited
        maxCustomers: -1, // Unlimited
        maxSmsPerMonth: -1, // Unlimited
        allowSmsNotifications: true,
        allowEmailNotifications: true,
        allowOnlineBooking: true,
        allowReports: true,
        allowCustomBranding: true,
        prioritySupport: true,
      },
    })

    console.log('[v0] Subscription plans seeded successfully:')
    console.log(`  - Starter (₹${starterPlan.priceNPR}/month)`)
    console.log(`  - Professional (₹${professionalPlan.priceNPR}/month)`)
    console.log(`  - Enterprise (₹${enterprisePlan.priceNPR}/month)`)

    return {
      starter: starterPlan,
      professional: professionalPlan,
      enterprise: enterprisePlan,
    }
  } catch (error) {
    console.error('[v0] Error seeding subscription plans:', error)
    throw error
  }
}
