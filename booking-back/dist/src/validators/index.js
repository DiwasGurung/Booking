"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidationError = exports.parseAndValidate = exports.CreatePaymentSchema = exports.PaymentParamsSchema = exports.RenewSubscriptionSchema = exports.DowngradeSubscriptionSchema = exports.UpgradeSubscriptionSchema = exports.ActivateSubscriptionSchema = exports.CreateSubscriptionTrialSchema = exports.SubscriptionBusinessParamsSchema = exports.SubscriptionParamsSchema = exports.UpdateUserSchema = exports.RegisterSchema = exports.LoginSchema = exports.UserParamsSchema = exports.UpdateStaffSchema = exports.CreateStaffSchema = exports.StaffParamsSchema = exports.UpdateServiceSchema = exports.CreateServiceSchema = exports.ServiceParamsSchema = exports.BookingQuerySchema = exports.UpdateBookingSchema = exports.CreateBookingSchema = exports.BookingParamsSchema = exports.BusinessQuerySchema = exports.UpdateBusinessSchema = exports.CreateBusinessSchema = exports.BusinessIdParamsSchema = exports.BusinessUserParamsSchema = exports.BusinessParamsSchema = void 0;
const zod_1 = require("zod");
// Common patterns
// Accepts both UUID format (550e8400-e29b-41d4-a716-446655440000) and Prisma CUID format (cmr3bpoto0001s7p5vjcs71b3)
// CUID is typically 25 characters starting with 'c', UUID is 36 characters with hyphens
const UUID_REGEX = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}|c[a-z0-9]{24})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\-\+\s\(\)]{6,}$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Plan IDs can be text slugs like "starter", "pro", "enterprise" or CUID format
// Slug format: lowercase letters and hyphens (e.g., starter, premium-plan)
// CUID format: exactly 25 characters starting with 'c' followed by 24 lowercase letters and numbers (e.g., cmrugku3k0000mof509oyfcv5)
const PLAN_SLUG_REGEX = /^([a-z]+(?:-[a-z]+)*|c[a-z0-9]{24})$/;
// ============= BUSINESS SCHEMAS =============
exports.BusinessParamsSchema = zod_1.z.object({
    id: zod_1.z.string().regex(UUID_REGEX, 'Invalid business ID format'),
});
exports.BusinessUserParamsSchema = zod_1.z.object({
    userId: zod_1.z.string().regex(UUID_REGEX, 'Invalid user ID format'),
});
exports.BusinessIdParamsSchema = zod_1.z.object({
    businessId: zod_1.z.string().regex(UUID_REGEX, 'Invalid business ID format'),
});
exports.CreateBusinessSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Business name must be at least 2 characters').max(100),
    email: zod_1.z.string().email('Invalid email format'),
    phone: zod_1.z.string().regex(PHONE_REGEX, 'Invalid phone number'),
    category: zod_1.z.string().min(1, 'Category is required').max(50),
    address: zod_1.z.string().min(3, 'Address is required').max(200),
    city: zod_1.z.string().min(2, 'City is required').max(50),
    state: zod_1.z.string().max(50).optional(),
    zipCode: zod_1.z.string().max(20).optional(),
    country: zod_1.z.string().min(2).max(50).optional(),
    description: zod_1.z.string().max(500).optional(),
    website: zod_1.z.string().url('Invalid website URL').optional().or(zod_1.z.literal('')),
    logo: zod_1.z.string().url('Invalid logo URL').optional().or(zod_1.z.literal('')),
});
exports.UpdateBusinessSchema = exports.CreateBusinessSchema.partial();
exports.BusinessQuerySchema = zod_1.z.object({
    page: zod_1.z.string().regex(/^\d+$/, 'Page must be a number').optional().default('1'),
    limit: zod_1.z.string().regex(/^\d+$/, 'Limit must be a number').optional().default('10'),
    category: zod_1.z.string().optional(),
    q: zod_1.z.string().optional(),
    months: zod_1.z.string().regex(/^\d+$/, 'Months must be a number').optional().default('6'),
});
// ============= BOOKING SCHEMAS =============
exports.BookingParamsSchema = zod_1.z.object({
    bookingId: zod_1.z.string().regex(UUID_REGEX, 'Invalid booking ID format'),
});
exports.CreateBookingSchema = zod_1.z.object({
    businessId: zod_1.z.string().regex(UUID_REGEX, 'Invalid business ID format'),
    serviceId: zod_1.z.string().regex(UUID_REGEX, 'Invalid service ID format'),
    staffId: zod_1.z.string().regex(UUID_REGEX, 'Invalid staff ID format'),
    customerName: zod_1.z.string().min(2, 'Customer name is required').max(100),
    customerEmail: zod_1.z.string().email('Invalid email format'),
    customerPhone: zod_1.z.string().regex(PHONE_REGEX, 'Invalid phone number'),
    appointmentDate: zod_1.z.string().datetime('Invalid date format'),
    status: zod_1.z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
    notes: zod_1.z.string().max(500).optional(),
});
exports.UpdateBookingSchema = exports.CreateBookingSchema.partial();
exports.BookingQuerySchema = zod_1.z.object({
    businessId: zod_1.z.string().regex(UUID_REGEX, 'Invalid business ID format'),
    status: zod_1.z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
    page: zod_1.z.string().regex(/^\d+$/).optional().default('1'),
    limit: zod_1.z.string().regex(/^\d+$/).optional().default('10'),
});
// ============= SERVICE SCHEMAS =============
exports.ServiceParamsSchema = zod_1.z.object({
    id: zod_1.z.string().regex(UUID_REGEX, 'Invalid service ID format'),
});
exports.CreateServiceSchema = zod_1.z.object({
    businessId: zod_1.z.string().regex(UUID_REGEX, 'Invalid business ID format'),
    name: zod_1.z.string().min(2, 'Service name is required').max(100),
    description: zod_1.z.string().max(500).optional(),
    price: zod_1.z.number().positive('Price must be positive'),
    offerPrice: zod_1.z.number().nullable().optional(),
    duration: zod_1.z.number().int().positive('Duration must be positive'),
    category: zod_1.z.string().max(50).optional(),
});
exports.UpdateServiceSchema = exports.CreateServiceSchema.partial();
// ============= STAFF SCHEMAS =============
exports.StaffParamsSchema = zod_1.z.object({
    staffId: zod_1.z.string().regex(UUID_REGEX, 'Invalid staff ID format'),
});
exports.CreateStaffSchema = zod_1.z.object({
    businessId: zod_1.z.string().regex(UUID_REGEX, 'Invalid business ID format'),
    firstName: zod_1.z.string().min(2, 'First name is required').max(50),
    lastName: zod_1.z.string().min(2, 'Last name is required').max(50),
    email: zod_1.z.string().email('Invalid email format'),
    phone: zod_1.z.string().regex(PHONE_REGEX, 'Invalid phone number').optional(),
    avatar: zod_1.z.string().url('Invalid avatar URL').optional().or(zod_1.z.literal('')),
    role: zod_1.z.string().max(50).optional(),
    serviceIds: zod_1.z.array(zod_1.z.string().regex(UUID_REGEX, 'Invalid service ID format')).optional(),
});
exports.UpdateStaffSchema = exports.CreateStaffSchema.partial().extend({
    serviceIds: zod_1.z.array(zod_1.z.string().regex(UUID_REGEX, 'Invalid service ID format')).optional(),
});
// ============= USER SCHEMAS =============
exports.UserParamsSchema = zod_1.z.object({
    userId: zod_1.z.string().regex(UUID_REGEX, 'Invalid user ID format'),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    firstName: zod_1.z.string().min(2, 'First name is required').max(50),
    lastName: zod_1.z.string().min(2, 'Last name is required').max(50),
});
exports.UpdateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    firstName: zod_1.z.string().min(2).max(50).optional(),
    lastName: zod_1.z.string().min(2).max(50).optional(),
    phone: zod_1.z.string().regex(PHONE_REGEX).optional(),
    avatar: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
});
// ============= SUBSCRIPTION SCHEMAS =============
exports.SubscriptionParamsSchema = zod_1.z.object({
    subscriptionId: zod_1.z.string().regex(UUID_REGEX, 'Invalid subscription ID format'),
});
exports.SubscriptionBusinessParamsSchema = zod_1.z.object({
    businessId: zod_1.z.string().regex(UUID_REGEX, 'Invalid business ID format'),
});
exports.CreateSubscriptionTrialSchema = zod_1.z.object({
    businessId: zod_1.z.string().regex(UUID_REGEX, 'Invalid business ID format'),
    planId: zod_1.z.string().regex(UUID_REGEX, 'Invalid plan ID format'),
});
exports.ActivateSubscriptionSchema = zod_1.z.object({
    paymentId: zod_1.z.string().min(1, 'Payment ID is required'),
    durationDays: zod_1.z.number().int().positive('Duration must be positive').optional(),
});
exports.UpgradeSubscriptionSchema = zod_1.z.object({
    businessId: zod_1.z.string().regex(UUID_REGEX, 'Invalid business ID format'),
    newPlanId: zod_1.z.string().regex(PLAN_SLUG_REGEX, 'Invalid plan ID format'),
    paymentId: zod_1.z.string().min(1, 'Payment ID is required'),
});
exports.DowngradeSubscriptionSchema = zod_1.z.object({
    businessId: zod_1.z.string().regex(UUID_REGEX, 'Invalid business ID format'),
    newPlanId: zod_1.z.string().regex(PLAN_SLUG_REGEX, 'Invalid plan ID format'),
    paymentId: zod_1.z.string().min(1, 'Payment ID is required'),
});
exports.RenewSubscriptionSchema = zod_1.z.object({
    subscriptionId: zod_1.z.string().regex(UUID_REGEX, 'Invalid subscription ID format'),
    paymentId: zod_1.z.string().min(1, 'Payment ID is required'),
    durationDays: zod_1.z.number().int().positive('Duration must be positive').optional(),
});
// ============= PAYMENT SCHEMAS =============
exports.PaymentParamsSchema = zod_1.z.object({
    paymentId: zod_1.z.string().min(1, 'Invalid payment ID'),
});
exports.CreatePaymentSchema = zod_1.z.object({
    businessId: zod_1.z.string().regex(UUID_REGEX, 'Invalid business ID format'),
    subscriptionId: zod_1.z.string().regex(UUID_REGEX, 'Invalid subscription ID format'),
    amount: zod_1.z.number().positive('Amount must be positive'),
    gateway: zod_1.z.enum(['ESEWA', 'KHALTI', 'STRIPE']),
    method: zod_1.z.enum(['CARD', 'BANK', 'WALLET']).optional(),
});
// Helper function to validate and parse safely
const parseAndValidate = (schema, data) => {
    try {
        const parsed = schema.parse(data);
        return { success: true, data: parsed };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errorMessage = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            return { success: false, error: errorMessage };
        }
        return { success: false, error: 'Validation failed' };
    }
};
exports.parseAndValidate = parseAndValidate;
// Type-safe discriminated union check
const isValidationError = (result) => {
    return !result.success;
};
exports.isValidationError = isValidationError;
