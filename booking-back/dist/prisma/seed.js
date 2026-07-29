"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSubscriptionPlans = seedSubscriptionPlans;
const prisma_1 = __importDefault(require("../src/lib/prisma"));
function seedSubscriptionPlans() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('[v0] Seeding subscription plans...');
            // Delete existing plans
            yield prisma_1.default.subscriptionPlan.deleteMany();
            // Starter Plan - ₹499/month
            const starterPlan = yield prisma_1.default.subscriptionPlan.create({
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
                        'Email reminders',
                        'Email support',
                        '30-day booking history',
                    ],
                    active: true,
                    // Billing period pricing
                    priceMonthlyNPR: 499, // 1 month
                    priceQuarterlyNPR: 1347, // 3 months @ 10% discount (499 * 3 * 0.9)
                    priceSemiAnnualNPR: 2394, // 6 months @ 20% discount (499 * 6 * 0.8)
                    priceAnnualNPR: 4491, // 12 months @ 25% discount (499 * 12 * 0.75)
                    maxAppointmentsPerMonth: 200,
                    maxStaff: 1,
                    maxServices: 5,
                    maxCustomers: 100,
                    allowEmailNotifications: true,
                    allowOnlineBooking: true,
                    allowReports: false,
                    allowCustomBranding: false,
                    prioritySupport: false,
                },
            });
            // Professional Plan - ₹999/month (Most Popular)
            const professionalPlan = yield prisma_1.default.subscriptionPlan.create({
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
                        'Automated email reminders',
                        'Payment collection (eSewa/Khalti)',
                        'Basic analytics',
                        'Priority email support',
                    ],
                    active: true,
                    // Billing period pricing
                    priceMonthlyNPR: 999, // 1 month
                    priceQuarterlyNPR: 2697, // 3 months @ 10% discount (999 * 3 * 0.9)
                    priceSemiAnnualNPR: 4794, // 6 months @ 20% discount (999 * 6 * 0.8)
                    priceAnnualNPR: 8991, // 12 months @ 25% discount (999 * 12 * 0.75)
                    maxAppointmentsPerMonth: -1, // Unlimited
                    maxStaff: 5,
                    maxServices: -1, // Unlimited
                    maxCustomers: -1, // Unlimited
                    allowEmailNotifications: true,
                    allowOnlineBooking: true,
                    allowReports: true,
                    allowCustomBranding: false,
                    prioritySupport: true,
                },
            });
            // Enterprise Plan - ₹2,499/month
            const enterprisePlan = yield prisma_1.default.subscriptionPlan.create({
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
                    // Billing period pricing
                    priceMonthlyNPR: 2499, // 1 month
                    priceQuarterlyNPR: 6747, // 3 months @ 10% discount (2499 * 3 * 0.9)
                    priceSemiAnnualNPR: 11994, // 6 months @ 20% discount (2499 * 6 * 0.8)
                    priceAnnualNPR: 22491, // 12 months @ 25% discount (2499 * 12 * 0.75)
                    maxAppointmentsPerMonth: -1, // Unlimited
                    maxStaff: -1, // Unlimited
                    maxServices: -1, // Unlimited
                    maxCustomers: -1, // Unlimited
                    allowEmailNotifications: true,
                    allowOnlineBooking: true,
                    allowReports: true,
                    allowCustomBranding: true,
                    prioritySupport: true,
                },
            });
            console.log('[v0] Subscription plans seeded successfully:');
            console.log(`  - Starter (₹${starterPlan.priceNPR}/month)`);
            console.log(`  - Professional (₹${professionalPlan.priceNPR}/month)`);
            console.log(`  - Enterprise (₹${enterprisePlan.priceNPR}/month)`);
            return {
                starter: starterPlan,
                professional: professionalPlan,
                enterprise: enterprisePlan,
            };
        }
        catch (error) {
            console.error('[v0] Error seeding subscription plans:', error);
            throw error;
        }
    });
}
