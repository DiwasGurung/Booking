"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
class SeedController {
    /**
     * Seed subscription plans (admin only)
     */
    async seedPlans(req, res) {
        try {
            console.log('[v0] Seeding subscription plans...');
            // Check if plans already exist
            const existingPlans = await prisma_1.prisma.subscriptionPlan.findMany();
            if (existingPlans.length > 0) {
                console.log('[v0] Plans already exist. Count:', existingPlans.length);
                return res.json({
                    message: 'Plans already exist',
                    plans: existingPlans,
                });
            }
            const plans = [
                {
                    id: 'basic',
                    name: 'Basic',
                    displayName: 'Basic Plan',
                    description: 'Perfect for getting started',
                    priceNPR: 2999, // ₨2,999/month
                    features: ['Up to 50 bookings/month', 'Basic analytics', 'Email support'],
                },
                {
                    id: 'professional',
                    name: 'Professional',
                    displayName: 'Professional Plan',
                    description: 'For growing businesses',
                    priceNPR: 5999, // ₨5,999/month
                    features: ['Up to 500 bookings/month', 'Advanced analytics', 'Priority support', 'Custom branding'],
                },
                {
                    id: 'enterprise',
                    name: 'Enterprise',
                    displayName: 'Enterprise Plan',
                    description: 'For large-scale operations',
                    priceNPR: 9999, // ₨9,999/month
                    features: ['Unlimited bookings', 'Full analytics', '24/7 phone support', 'Custom integrations', 'Dedicated account manager'],
                },
            ];
            const createdPlans = await Promise.all(plans.map((plan) => prisma_1.prisma.subscriptionPlan.create({
                data: plan,
            })));
            console.log('[v0] Successfully created', createdPlans.length, 'subscription plans');
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
            console.log('[v0] Fetching all subscription plans');
            const plans = await prisma_1.prisma.subscriptionPlan.findMany({
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
