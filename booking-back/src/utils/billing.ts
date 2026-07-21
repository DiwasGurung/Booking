export enum BillingPeriod {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  HALF_YEARLY = 'HALF_YEARLY',
  YEARLY = 'YEARLY',
}

export interface BillingPeriodConfig {
  label: string
  days: number
  discount: number
  popular?: boolean
}

export const BILLING_PERIODS: Record<BillingPeriod, BillingPeriodConfig> = {
  [BillingPeriod.MONTHLY]: {
    label: 'Monthly',
    days: 30,
    discount: 0,
  },
  [BillingPeriod.QUARTERLY]: {
    label: 'Quarterly (3 months)',
    days: 90,
    discount: 10,
  },
  [BillingPeriod.HALF_YEARLY]: {
    label: '6 Months',
    days: 180,
    discount: 20,
  },
  [BillingPeriod.YEARLY]: {
    label: 'Yearly',
    days: 365,
    discount: 25,
    popular: true,
  },
}

/**
 * Get the duration in days for a billing period
 */
export function getDurationDays(period: BillingPeriod): number {
  return BILLING_PERIODS[period]?.days || 30
}

/**
 * Calculate the renewal date based on billing period
 */
export function calculateRenewalDate(startDate: Date, period: BillingPeriod): Date {
  const days = getDurationDays(period)
  const renewalDate = new Date(startDate)
  renewalDate.setDate(renewalDate.getDate() + days)
  return renewalDate
}

/**
 * Get price for a specific billing period
 */
export function getPriceForPeriod(
  baseMonthlyPrice: number,
  period: BillingPeriod,
  planPrices?: {
    monthly?: number
    quarterly?: number
    semiAnnual?: number
    annual?: number
  }
): number {
  // Use provided prices if available
  if (planPrices) {
    switch (period) {
      case BillingPeriod.MONTHLY:
        return planPrices.monthly || baseMonthlyPrice
      case BillingPeriod.QUARTERLY:
        return planPrices.quarterly || Math.round(baseMonthlyPrice * 3 * 0.9)
      case BillingPeriod.HALF_YEARLY:
        return planPrices.semiAnnual || Math.round(baseMonthlyPrice * 6 * 0.8)
      case BillingPeriod.YEARLY:
        return planPrices.annual || Math.round(baseMonthlyPrice * 12 * 0.75)
    }
  }

  // Calculate based on discount
  const { days, discount } = BILLING_PERIODS[period]
  const monthCount = days / 30
  return Math.round(baseMonthlyPrice * monthCount * (1 - discount / 100))
}

/**
 * Get monthly equivalent price (useful for comparisons)
 */
export function getMonthlyEquivalentPrice(
  totalPrice: number,
  period: BillingPeriod
): number {
  const days = getDurationDays(period)
  const monthCount = days / 30
  return Math.round(totalPrice / monthCount)
}

/**
 * Calculate savings percentage
 */
export function calculateSavings(
  monthlyPrice: number,
  period: BillingPeriod
): number {
  const { discount } = BILLING_PERIODS[period]
  return discount
}

/**
 * Get billing period label with discount info
 */
export function getBillingPeriodLabel(period: BillingPeriod): string {
  const config = BILLING_PERIODS[period]
  if (config.discount > 0) {
    return `${config.label} (Save ${config.discount}%)`
  }
  return config.label
}

/**
 * Format billing period for display
 */
export function formatBillingPeriod(period: BillingPeriod): string {
  const config = BILLING_PERIODS[period]
  return config.label
}

export default {
  BillingPeriod,
  BILLING_PERIODS,
  getDurationDays,
  calculateRenewalDate,
  getPriceForPeriod,
  getMonthlyEquivalentPrice,
  calculateSavings,
  getBillingPeriodLabel,
  formatBillingPeriod,
}
