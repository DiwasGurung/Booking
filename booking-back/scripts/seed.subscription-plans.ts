const plans = [
  {
    id: 'starter',
    name: 'starter',
    displayName: 'Starter',
    description: 'Perfect for solo practitioners and new businesses',
    priceNPR: 499,
    currency: 'NPR',
    durationDays: 30,
    priceMonthlyNPR: 499,
    priceQuarterlyNPR: 1347,
    priceSemiAnnualNPR: 2394,
    priceAnnualNPR: 4491,
    maxAppointmentsPerMonth: 200,
    maxStaff: 1,
    maxServices: 5,
    maxCustomers: 100,
    features: JSON.stringify([
      'Up to 200 bookings/month',
      'Basic booking page',
      '5 services maximum',
      'Email reminders',
      'Email support',
      '30-day booking history',
    ]),
    allowEmailNotifications: true,
    allowOnlineBooking: true,
    allowReports: false,
    allowCustomBranding: false,
    prioritySupport: false,
    active: true,
  },
  {
    id: 'professional',
    name: 'professional',
    displayName: 'Professional',
    description: 'For growing salons, clinics, and small teams',
    priceNPR: 999,
    currency: 'NPR',
    durationDays: 30,
    priceMonthlyNPR: 999,
    priceQuarterlyNPR: 2697,
    priceSemiAnnualNPR: 4794,
    priceAnnualNPR: 8991,
    maxAppointmentsPerMonth: -1,
    maxStaff: 5,
    maxServices: -1,
    maxCustomers: -1,
    features: JSON.stringify([
      'Unlimited bookings',
      'Unlimited services',
      'Staff management (up to 5 staff)',
      'Calendar sync (Google Calendar)',
      'Customer database & notes',
      'Automated email reminders',
      'Payment collection (eSewa)',
      'Basic analytics',
      'Priority email support',
    ]),
    allowEmailNotifications: true,
    allowOnlineBooking: true,
    allowReports: true,
    allowCustomBranding: false,
    prioritySupport: true,
    active: true,
  },
  {
    id: 'enterprise',
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'For large spas, chains, and multi-location businesses',
    priceNPR: 2499,
    currency: 'NPR',
    durationDays: 30,
    priceMonthlyNPR: 2499,
    priceQuarterlyNPR: 6747,
    priceSemiAnnualNPR: 11994,
    priceAnnualNPR: 22491,
    maxAppointmentsPerMonth: -1,
    maxStaff: -1,
    maxServices: -1,
    maxCustomers: -1,
    features: JSON.stringify([
      'Everything in Professional',
      'Unlimited staff',
      'Multiple locations',
      'Advanced analytics & reports',
      'Custom branding',
      'API access',
      'Dedicated account manager',
      'Phone + Email support',
      'Custom integrations',
    ]),
    allowEmailNotifications: true,
    allowOnlineBooking: true,
    allowReports: true,
    allowCustomBranding: true,
    prioritySupport: true,
    active: true,
  },
]

console.log('📋 Subscription Plans Ready to Seed:')
console.log('=====================================')
plans.forEach((plan) => {
  console.log(`✓ ${plan.displayName}: ₹${plan.priceNPR}/month`)
  console.log(`  - Quarterly: ₹${plan.priceQuarterlyNPR} (-10%)`)
  console.log(`  - Semi-annual: ₹${plan.priceSemiAnnualNPR} (-20%)`)
  console.log(`  - Annual: ₹${plan.priceAnnualNPR} (-25%)`)
})

console.log('\n✨ To seed the database, run this in your backend:')
console.log('Copy the plans array above into your backend seeding logic.')
console.log('\nOR use the API to create plans:')
console.log('POST /api/subscription/plans with the data above.')

module.exports = plans
