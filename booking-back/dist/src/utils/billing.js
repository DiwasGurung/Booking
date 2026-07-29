"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BILLING_PERIODS = exports.BillingPeriod = void 0;
exports.getDurationDays = getDurationDays;
exports.calculateRenewalDate = calculateRenewalDate;
exports.getPriceForPeriod = getPriceForPeriod;
exports.getMonthlyEquivalentPrice = getMonthlyEquivalentPrice;
exports.calculateSavings = calculateSavings;
exports.getBillingPeriodLabel = getBillingPeriodLabel;
exports.formatBillingPeriod = formatBillingPeriod;
var BillingPeriod;
(function (BillingPeriod) {
    BillingPeriod["MONTHLY"] = "MONTHLY";
    BillingPeriod["QUARTERLY"] = "QUARTERLY";
    BillingPeriod["HALF_YEARLY"] = "HALF_YEARLY";
    BillingPeriod["YEARLY"] = "YEARLY";
})(BillingPeriod || (exports.BillingPeriod = BillingPeriod = {}));
exports.BILLING_PERIODS = {
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
};
/**
 * Get the duration in days for a billing period
 */
function getDurationDays(period) {
    var _a;
    return ((_a = exports.BILLING_PERIODS[period]) === null || _a === void 0 ? void 0 : _a.days) || 30;
}
/**
 * Calculate the renewal date based on billing period
 */
function calculateRenewalDate(startDate, period) {
    const days = getDurationDays(period);
    const renewalDate = new Date(startDate);
    renewalDate.setDate(renewalDate.getDate() + days);
    return renewalDate;
}
/**
 * Get price for a specific billing period
 */
function getPriceForPeriod(baseMonthlyPrice, period, planPrices) {
    // Use provided prices if available
    if (planPrices) {
        switch (period) {
            case BillingPeriod.MONTHLY:
                return planPrices.monthly || baseMonthlyPrice;
            case BillingPeriod.QUARTERLY:
                return planPrices.quarterly || Math.round(baseMonthlyPrice * 3 * 0.9);
            case BillingPeriod.HALF_YEARLY:
                return planPrices.semiAnnual || Math.round(baseMonthlyPrice * 6 * 0.8);
            case BillingPeriod.YEARLY:
                return planPrices.annual || Math.round(baseMonthlyPrice * 12 * 0.75);
        }
    }
    // Calculate based on discount
    const { days, discount } = exports.BILLING_PERIODS[period];
    const monthCount = days / 30;
    return Math.round(baseMonthlyPrice * monthCount * (1 - discount / 100));
}
/**
 * Get monthly equivalent price (useful for comparisons)
 */
function getMonthlyEquivalentPrice(totalPrice, period) {
    const days = getDurationDays(period);
    const monthCount = days / 30;
    return Math.round(totalPrice / monthCount);
}
/**
 * Calculate savings percentage
 */
function calculateSavings(monthlyPrice, period) {
    const { discount } = exports.BILLING_PERIODS[period];
    return discount;
}
/**
 * Get billing period label with discount info
 */
function getBillingPeriodLabel(period) {
    const config = exports.BILLING_PERIODS[period];
    if (config.discount > 0) {
        return `${config.label} (Save ${config.discount}%)`;
    }
    return config.label;
}
/**
 * Format billing period for display
 */
function formatBillingPeriod(period) {
    const config = exports.BILLING_PERIODS[period];
    return config.label;
}
exports.default = {
    BillingPeriod,
    BILLING_PERIODS: exports.BILLING_PERIODS,
    getDurationDays,
    calculateRenewalDate,
    getPriceForPeriod,
    getMonthlyEquivalentPrice,
    calculateSavings,
    getBillingPeriodLabel,
    formatBillingPeriod,
};
