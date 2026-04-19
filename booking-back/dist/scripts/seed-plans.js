"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const prisma_1 = require("../src/lib/prisma");
const process_1 = __importDefault(require("process"));
async function seedPlans() {
    try {
        console.log('Seeding subscription plans...');
        // Delete existing plans to avoid conflicts
        await prisma_1.prisma.subscriptionPlan.deleteMany({});
        console.log('Cleared existing plans');
        // Create subscription plans
        const plans = await prisma_1.prisma.subscriptionPlan.createMany({
            data: [
                {
                    id: 'basic',
                    name: 'basic',
                    displayName: 'Basic',
                    priceNPR: 499,
                    currency: 'NPR',
                    description: 'Perfect for small businesses',
                    durationDays: 30,
                    features: [
                        'Up to 50 bookings/month',
                        'Basic analytics',
                        'Email support',
                        'Custom booking page',
                    ],
                    active: true,
                },
                {
                    id: 'pro',
                    name: 'pro',
                    displayName: 'Professional',
                    priceNPR: 999,
                    currency: 'NPR',
                    description: 'For growing businesses',
                    durationDays: 30,
                    features: [
                        'Unlimited bookings',
                        'Advanced analytics',
                        'Priority support',
                        'Custom branding',
                        'Team management',
                        'API access',
                    ],
                    active: true,
                },
                {
                    id: 'enterprise',
                    name: 'enterprise',
                    displayName: 'Enterprise',
                    priceNPR: 2499,
                    currency: 'NPR',
                    description: 'For large businesses with advanced needs',
                    durationDays: 30,
                    features: [
                        'Unlimited everything',
                        'Dedicated account manager',
                        '24/7 phone support',
                        'White-label solution',
                        'Advanced integrations',
                        'Custom development',
                        'SLA guarantee',
                    ],
                    active: true,
                },
            ],
        });
        console.log(`✓ Created ${plans.count} subscription plans`);
        // Fetch and display created plans
        const createdPlans = await prisma_1.prisma.subscriptionPlan.findMany({
            orderBy: { priceNPR: 'asc' },
        });
        console.log('\nCreated plans:');
        createdPlans.forEach((plan) => {
            console.log(`- ${plan.displayName} (${plan.name}): ₨${plan.priceNPR}`);
        });
        console.log('\n✓ Subscription plans seeded successfully!');
    }
    catch (error) {
        console.error('Error seeding plans:', error);
        process_1.default.exit(1);
    }
    finally {
        await prisma_1.prisma.$disconnect();
    }
}
seedPlans();
