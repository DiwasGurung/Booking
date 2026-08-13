"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
class SeedController {
    /**
     * Seed subscription plans (admin only)
     */
    async seedPlans(req, res) {
        try {
            // Delete existing plans and recreate with new limits
            const existingPlans = await prisma_js_1.default.subscriptionPlan.findMany();
            if (existingPlans.length > 0) {
                await prisma_js_1.default.subscriptionPlan.deleteMany();
            }
            const plans = [
                {
                    name: 'starter',
                    displayName: 'Starter',
                    description: 'Perfect for solo practitioners and new businesses',
                    priceNPR: 499,
                    currency: 'NPR',
                    durationDays: 30,
                    // Billing period pricing with discounts
                    priceMonthlyNPR: 499,
                    priceQuarterlyNPR: 1347, // 3 months @ 10% discount
                    priceSemiAnnualNPR: 2394, // 6 months @ 20% discount
                    priceAnnualNPR: 4491, // 12 months @ 25% discount
                    features: [
                        'Up to 200 bookings/month',
                        'Basic booking page',
                        '5 services maximum',
                        'Email reminders',
                        'Email support',
                        '30-day booking history',
                    ],
                    // Limits
                    maxAppointmentsPerMonth: 200,
                    maxStaff: 1,
                    maxServices: 5,
                    maxCustomers: 100,
                    // Features
                    allowEmailNotifications: true,
                    allowOnlineBooking: true,
                    allowReports: false,
                    allowCustomBranding: false,
                    prioritySupport: false,
                    active: true,
                },
                {
                    name: 'professional',
                    displayName: 'Professional',
                    description: 'For growing salons, clinics, and small teams',
                    priceNPR: 999,
                    currency: 'NPR',
                    durationDays: 30,
                    // Billing period pricing with discounts
                    priceMonthlyNPR: 999,
                    priceQuarterlyNPR: 2697, // 3 months @ 10% discount
                    priceSemiAnnualNPR: 4794, // 6 months @ 20% discount
                    priceAnnualNPR: 8991, // 12 months @ 25% discount
                    features: [
                        'Unlimited bookings',
                        'Unlimited services',
                        'Staff management (up to 5 staff)',
                        'Calendar sync (Google Calendar)',
                        'Customer database & notes',
                        'Automated email reminders',
                        'Payment collection (eSewa)',
                        'Basic analytics',
                        'Priority email support',
                    ],
                    // Limits
                    maxAppointmentsPerMonth: -1, // Unlimited
                    maxStaff: 5,
                    maxServices: -1, // Unlimited
                    maxCustomers: -1, // Unlimited
                    // Features
                    allowEmailNotifications: true,
                    allowOnlineBooking: true,
                    allowReports: true,
                    allowCustomBranding: false,
                    prioritySupport: true,
                    active: true,
                },
                {
                    name: 'enterprise',
                    displayName: 'Enterprise',
                    description: 'For large spas, chains, and multi-location businesses',
                    priceNPR: 2499,
                    currency: 'NPR',
                    durationDays: 30,
                    // Billing period pricing with discounts
                    priceMonthlyNPR: 2499,
                    priceQuarterlyNPR: 6747, // 3 months @ 10% discount
                    priceSemiAnnualNPR: 11994, // 6 months @ 20% discount
                    priceAnnualNPR: 22491, // 12 months @ 25% discount
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
                    // Limits
                    maxAppointmentsPerMonth: -1, // Unlimited
                    maxStaff: -1, // Unlimited
                    maxServices: -1, // Unlimited
                    maxCustomers: -1, // Unlimited
                    // Features
                    allowEmailNotifications: true,
                    allowOnlineBooking: true,
                    allowReports: true,
                    allowCustomBranding: true,
                    prioritySupport: true,
                    active: true,
                },
            ];
            const createdPlans = await Promise.all(plans.map((plan) => prisma_js_1.default.subscriptionPlan.create({
                data: plan,
            })));
            res.json({
                message: 'Subscription plans seeded successfully',
                plans: createdPlans,
            });
        }
        catch (error) {
            console.error('[v0] Error seeding plans:', error);
            res.status(500).json({
                message: 'Failed to seed plans',
                error: error.message,
            });
        }
    }
    /**
     * Get all plans
     */
    async getPlans(req, res) {
        try {
            const plans = await prisma_js_1.default.subscriptionPlan.findMany({
                where: { active: true },
                orderBy: { priceNPR: 'asc' },
            });
            res.json({
                count: plans.length,
                plans,
            });
        }
        catch (error) {
            console.error('[v0] Error fetching plans:', error);
            res.status(500).json({
                message: 'Failed to fetch plans',
                error: error.message,
            });
        }
    }
}
exports.default = new SeedController();
