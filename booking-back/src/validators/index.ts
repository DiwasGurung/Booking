import { z } from 'zod'

// Common patterns
// Accepts both UUID format (550e8400-e29b-41d4-a716-446655440000) and Prisma CUID format (cmr3bpoto0001s7p5vjcs71b3)
// CUID is typically 25 characters starting with 'c', UUID is 36 characters with hyphens
const UUID_REGEX = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}|c[a-z0-9]{24})$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[\d\-\+\s\(\)]{6,}$/
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
// Plan IDs can be text slugs like "starter", "pro", "enterprise" or CUID format
// Slug format: lowercase letters and hyphens (e.g., starter, premium-plan)
// CUID format: exactly 25 characters starting with 'c' followed by 24 lowercase letters and numbers (e.g., cmrugku3k0000mof509oyfcv5)
const PLAN_SLUG_REGEX = /^([a-z]+(?:-[a-z]+)*|c[a-z0-9]{24})$/

// ============= BUSINESS SCHEMAS =============
export const BusinessParamsSchema = z.object({
  id: z.string().regex(UUID_REGEX, 'Invalid business ID format'),
})

export const BusinessUserParamsSchema = z.object({
  userId: z.string().regex(UUID_REGEX, 'Invalid user ID format'),
})

export const BusinessIdParamsSchema = z.object({
  businessId: z.string().regex(UUID_REGEX, 'Invalid business ID format'),
})

export const CreateBusinessSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(PHONE_REGEX, 'Invalid phone number'),
  category: z.string().min(1, 'Category is required').max(50),
  address: z.string().min(3, 'Address is required').max(200),
  city: z.string().min(2, 'City is required').max(50),
  state: z.string().max(50).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().min(2).max(50).optional(),
  description: z.string().max(500).optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  logo: z.string().url('Invalid logo URL').optional().or(z.literal('')),
})

export const UpdateBusinessSchema = CreateBusinessSchema.partial()

export const BusinessQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a number').optional().default('1'),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional().default('10'),
  category: z.string().optional(),
  q: z.string().optional(),
  months: z.string().regex(/^\d+$/, 'Months must be a number').optional().default('6'),
})

// ============= BOOKING SCHEMAS =============
export const BookingParamsSchema = z.object({
  bookingId: z.string().regex(UUID_REGEX, 'Invalid booking ID format'),
})

export const CreateBookingSchema = z.object({
  businessId: z.string().regex(UUID_REGEX, 'Invalid business ID format'),
  serviceId: z.string().regex(UUID_REGEX, 'Invalid service ID format'),
  staffId: z.string().regex(UUID_REGEX, 'Invalid staff ID format'),
  customerName: z.string().min(2, 'Customer name is required').max(100),
  customerEmail: z.string().email('Invalid email format'),
  customerPhone: z.string().regex(PHONE_REGEX, 'Invalid phone number'),
  appointmentDate: z.string().datetime('Invalid date format'),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
  notes: z.string().max(500).optional(),
})

export const UpdateBookingSchema = CreateBookingSchema.partial()

export const BookingQuerySchema = z.object({
  businessId: z.string().regex(UUID_REGEX, 'Invalid business ID format'),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z.string().regex(/^\d+$/).optional().default('10'),
})

// ============= SERVICE SCHEMAS =============
export const ServiceParamsSchema = z.object({
  id: z.string().regex(UUID_REGEX, 'Invalid service ID format'),
})

export const CreateServiceSchema = z.object({
  businessId: z.string().regex(UUID_REGEX, 'Invalid business ID format'),
  name: z.string().min(2, 'Service name is required').max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive('Price must be positive'),
  offerPrice: z.number().nullable().optional(),
  duration: z.number().int().positive('Duration must be positive'),
  category: z.string().max(50).optional(),
})

export const UpdateServiceSchema = CreateServiceSchema.partial()

// ============= STAFF SCHEMAS =============
export const StaffParamsSchema = z.object({
  staffId: z.string().regex(UUID_REGEX, 'Invalid staff ID format'),
})

export const CreateStaffSchema = z.object({
  businessId: z.string().regex(UUID_REGEX, 'Invalid business ID format'),
  firstName: z.string().min(2, 'First name is required').max(50),
  lastName: z.string().min(2, 'Last name is required').max(50),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(PHONE_REGEX, 'Invalid phone number').optional(),
  avatar: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  role: z.string().max(50).optional(),
  serviceIds: z.array(z.string().regex(UUID_REGEX, 'Invalid service ID format')).optional(),
})

export const UpdateStaffSchema = CreateStaffSchema.partial().extend({
  serviceIds: z.array(z.string().regex(UUID_REGEX, 'Invalid service ID format')).optional(),
})

// ============= USER SCHEMAS =============
export const UserParamsSchema = z.object({
  userId: z.string().regex(UUID_REGEX, 'Invalid user ID format'),
})

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(2, 'First name is required').max(50),
  lastName: z.string().min(2, 'Last name is required').max(50),
})

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phone: z.string().regex(PHONE_REGEX).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
})

// ============= SUBSCRIPTION SCHEMAS =============
export const SubscriptionParamsSchema = z.object({
  subscriptionId: z.string().regex(UUID_REGEX, 'Invalid subscription ID format'),
})

export const SubscriptionBusinessParamsSchema = z.object({
  businessId: z.string().regex(UUID_REGEX, 'Invalid business ID format'),
})

export const CreateSubscriptionTrialSchema = z.object({
  businessId: z.string().regex(UUID_REGEX, 'Invalid business ID format'),
  planId: z.string().regex(UUID_REGEX, 'Invalid plan ID format'),
})

export const ActivateSubscriptionSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  durationDays: z.number().int().positive('Duration must be positive').optional(),
})

export const UpgradeSubscriptionSchema = z.object({
  businessId: z.string().regex(UUID_REGEX, 'Invalid business ID format'),
  newPlanId: z.string().regex(PLAN_SLUG_REGEX, 'Invalid plan ID format'),
  paymentId: z.string().min(1, 'Payment ID is required'),
})

export const DowngradeSubscriptionSchema = z.object({
  businessId: z.string().regex(UUID_REGEX, 'Invalid business ID format'),
  newPlanId: z.string().regex(PLAN_SLUG_REGEX, 'Invalid plan ID format'),
  paymentId: z.string().min(1, 'Payment ID is required'),
})

export const RenewSubscriptionSchema = z.object({
  subscriptionId: z.string().regex(UUID_REGEX, 'Invalid subscription ID format'),
  paymentId: z.string().min(1, 'Payment ID is required'),
  durationDays: z.number().int().positive('Duration must be positive').optional(),
})

// ============= PAYMENT SCHEMAS =============
export const PaymentParamsSchema = z.object({
  paymentId: z.string().min(1, 'Invalid payment ID'),
})

export const CreatePaymentSchema = z.object({
  businessId: z.string().regex(UUID_REGEX, 'Invalid business ID format'),
  subscriptionId: z.string().regex(UUID_REGEX, 'Invalid subscription ID format'),
  amount: z.number().positive('Amount must be positive'),
  gateway: z.enum(['ESEWA', 'KHALTI', 'STRIPE']),
  method: z.enum(['CARD', 'BANK', 'WALLET']).optional(),
})

// Helper function to validate and parse safely
export const parseAndValidate = <T,>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } => {
  try {
    const parsed = schema.parse(data)
    return { success: true, data: parsed }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return { success: false, error: errorMessage }
    }
    return { success: false, error: 'Validation failed' }
  }
}

// Type-safe discriminated union check
export const isValidationError = (
  result: { success: true; data: unknown } | { success: false; error: string }
): result is { success: false; error: string } => {
  return !result.success
}
