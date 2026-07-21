/**
 * Safely extract pricing data from subscription plan objects
 * Handles both old schema (priceNPR only) and new schema (with billing period pricing)
 */

export interface PlanPricing {
  monthlyPrice: number
  quarterlyPrice?: number
  semiAnnualPrice?: number
  annualPrice?: number
}

export function extractPricing(plan: any): PlanPricing {
  // New schema with billing period pricing
  if (plan.priceMonthlyNPR) {
    return {
      monthlyPrice: plan.priceMonthlyNPR,
      quarterlyPrice: plan.priceQuarterlyNPR,
      semiAnnualPrice: plan.priceSemiAnnualNPR,
      annualPrice: plan.priceAnnualNPR,
    }
  }

  // Old schema - use priceNPR as base and calculate others
  const basePrice = plan.priceNPR || 0
  return {
    monthlyPrice: basePrice,
    quarterlyPrice: Math.round(basePrice * 3 * 0.9), // 10% discount
    semiAnnualPrice: Math.round(basePrice * 6 * 0.8), // 20% discount
    annualPrice: Math.round(basePrice * 12 * 0.75), // 25% discount
  }
}

/**
 * Get price for a specific billing period
 */
export function getPriceForPeriod(
  pricing: PlanPricing,
  period: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY'
): number {
  const periods = {
    MONTHLY: pricing.monthlyPrice,
    QUARTERLY: pricing.quarterlyPrice || pricing.monthlyPrice * 3,
    HALF_YEARLY: pricing.semiAnnualPrice || pricing.monthlyPrice * 6,
    YEARLY: pricing.annualPrice || pricing.monthlyPrice * 12,
  }

  return periods[period] || pricing.monthlyPrice
}

/**
 * Calculate savings for a billing period
 */
export function calculateSavings(
  pricing: PlanPricing,
  period: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY'
): number {
  const monthlyPrice = pricing.monthlyPrice
  const months = {
    MONTHLY: 1,
    QUARTERLY: 3,
    HALF_YEARLY: 6,
    YEARLY: 12,
  }[period] || 1

  const fullPrice = monthlyPrice * months
  const discountedPrice = getPriceForPeriod(pricing, period)

  return fullPrice - discountedPrice
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(
  pricing: PlanPricing,
  period: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY'
): number {
  const monthlyPrice = pricing.monthlyPrice
  const months = {
    MONTHLY: 1,
    QUARTERLY: 3,
    HALF_YEARLY: 6,
    YEARLY: 12,
  }[period] || 1

  const fullPrice = monthlyPrice * months
  const discountedPrice = getPriceForPeriod(pricing, period)
  const discount = ((fullPrice - discountedPrice) / fullPrice) * 100

  return Math.round(discount)
}
