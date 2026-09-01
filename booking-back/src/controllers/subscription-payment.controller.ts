// src/controllers/subscription-payment.controller.ts
// Controller for handling subscription payments with eSewa

import { Request, Response } from 'express';
import  prisma  from '../lib/prisma';
import esewaService from '../services/esewa.service';
import subscriptionService from '../services/subscription.service';
import { getPriceForPeriod, BillingPeriod } from '../utils/billing';

const FRONTEND_URL = process.env.FRONTEND_URL || '';
const BACKEND_URL = process.env.BACKEND_URL || '';

function getExpectedSubscriptionAmount(subscription: any, plan: any): number {
  return getPriceForPeriod(
    plan.priceMonthlyNPR,
    subscription.billingPeriod as BillingPeriod,
    {
      monthly: plan.priceMonthlyNPR,
      quarterly: plan.priceQuarterlyNPR,
      semiAnnual: plan.priceSemiAnnualNPR,
      annual: plan.priceAnnualNPR,
    },
  );
}

/**
 * Initiate subscription payment with eSewa
 */
export const initiateEsewaPayment = async (req: Request, res: Response) => {
  try {
    const { businessId, planId, billingPeriod = BillingPeriod.MONTHLY } = req.body;

    if (!businessId || !planId) {
      return res.status(400).json({ error: 'Business ID and Plan ID are required' });
    }

    // Get the subscription plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    const { getDurationDays } = require('../utils/billing');
    const priceNPR = getPriceForPeriod(
      plan.priceMonthlyNPR,
      billingPeriod,
      {
        monthly: plan.priceMonthlyNPR,
        quarterly: plan.priceQuarterlyNPR ?? undefined,
        semiAnnual: plan.priceSemiAnnualNPR ?? undefined,
        annual: plan.priceAnnualNPR ?? undefined,
      }
    );

    // Get or create subscription
    let subscription = await prisma.subscription.findUnique({
      where: { businessId },
    });

    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          businessId,
          planId,
          status: 'TRIAL',
          billingPeriod,
        },
      });
    }

    // Do not mutate an existing subscription before payment verification. The
    // target plan and billing period travel in the provider reference instead.
    // This keeps the current entitlement active if payment is cancelled/failed.
    const transactionUuid = `SUB-${subscription.id}-${planId}-${billingPeriod}-${Date.now()}`.replace(/[^A-Za-z0-9-]/g, '');

    // Generate eSewa payment form data
    const esewaResponse = await esewaService.initiatePayment({
      amount: priceNPR,
      transactionUuid: transactionUuid,
      successUrl: `${BACKEND_URL}/api/subscription-payment/esewa/success`,
      failureUrl: `${BACKEND_URL}/api/subscription-payment/esewa/failure`,
    });

    if (!esewaResponse.success) {
      return res.status(500).json({ error: esewaResponse.message });
    }

    console.log('[SubscriptionPayment] eSewa payment initiated:', {
      transactionUuid,
      amount: priceNPR,
      billingPeriod,
      durationDays: getDurationDays(billingPeriod),
    });

    return res.json({
      success: true,
      formData: esewaResponse.formData,
      paymentUrl: esewaResponse.paymentUrl,
      billingPeriod,
      durationDays: getDurationDays(billingPeriod),
    });
  } catch (error: any) {
    console.error('[SubscriptionPayment] Initiation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to initiate payment' });
  }
};

/**
 * Handle eSewa payment success callback
 */
export const handleEsewaSuccess = async (req: Request, res: Response) => {
  try {
    const { data } = req.query;

    if (!data || typeof data !== 'string') {
      console.error('[SubscriptionPayment] No data in eSewa callback');
      return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Invalid callback data`);
    }

    // Decode and verify the response
    const decoded = esewaService.decodeEsewaResponse(data);

    if (!decoded.success || !decoded.data) {
      console.error('[SubscriptionPayment] Failed to decode eSewa response');
      return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Invalid response signature`);
    }

    const { transaction_uuid, status, total_amount, transaction_code, product_code } = decoded.data;
    const parsedTotalAmount = Number.parseFloat(total_amount);

    if (status !== 'COMPLETE' || !Number.isFinite(parsedTotalAmount) || parsedTotalAmount <= 0) {
      return res.redirect(`${FRONTEND_URL}/subscription?status=failed&message=Payment was not completed`);
    }
    if (product_code !== esewaService.getProductCode()) {
      return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Invalid product code`);
    }

    console.log('[SubscriptionPayment] eSewa success callback:', {
      transactionUuid: transaction_uuid,
      status,
      totalAmount: parsedTotalAmount,
      transactionCode: transaction_code,
    });

    // Reference format: SUB-{subscriptionId}-{targetPlanId}-{billingPeriod}-{timestamp}
    const transactionPrefix = 'SUB-';
    const referenceParts = transaction_uuid.startsWith(transactionPrefix)
      ? transaction_uuid.slice(transactionPrefix.length).split('-')
      : [];
    if (referenceParts.length < 4) {
      return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Invalid transaction reference`);
    }
    const [subscriptionId, targetPlanId, targetBillingPeriod] = referenceParts;
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });
    const targetPlan = await prisma.subscriptionPlan.findUnique({ where: { id: targetPlanId } });
    if (!subscription || !targetPlan) {
      return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Subscription plan not found`);
    }
    if (!Object.values(BillingPeriod).includes(targetBillingPeriod as BillingPeriod)) {
      return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Invalid billing period`);
    }

    if (!subscription) {
      console.error('[SubscriptionPayment] Subscription not found for transaction:', transaction_uuid);
      return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Subscription not found`);
    }

    // Verify with eSewa server (server-to-server verification)
    const verification = await esewaService.verifyPayment(transaction_uuid, parsedTotalAmount);

    if (!verification.success) {
      console.error('[SubscriptionPayment] eSewa verification failed:', verification.message);
      return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Payment verification failed`);
    }

    if (verification.productCode !== product_code || verification.totalAmount !== parsedTotalAmount) {
      return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Payment amount verification failed`);
    }

    const expectedAmount = getPriceForPeriod(
      targetPlan.priceMonthlyNPR,
      targetBillingPeriod as BillingPeriod,
      {
        monthly: targetPlan.priceMonthlyNPR,
        quarterly: targetPlan.priceQuarterlyNPR ?? undefined,
        semiAnnual: targetPlan.priceSemiAnnualNPR ?? undefined,
        annual: targetPlan.priceAnnualNPR ?? undefined,
      },
    );
    if (expectedAmount !== parsedTotalAmount) {
      console.error('[SubscriptionPayment] Amount mismatch:', { expectedAmount, parsedTotalAmount });
      return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Payment amount does not match the selected plan`);
    }

    // Create payment record AFTER successful verification; transactionId is unique.
    const existingPayment = await prisma.payment.findUnique({ where: { transactionId: transaction_uuid } });
    if (existingPayment) {
      if (existingPayment.subscriptionId) {
  const existingSubscription = await prisma.subscription.findUnique({ where: { id: existingPayment.subscriptionId } });
  if (existingSubscription && (existingSubscription.status !== 'ACTIVE' || !existingSubscription.startDate || !existingSubscription.endDate)) {
    await subscriptionService.activateSubscription(existingPayment.subscriptionId, {
      paymentId: existingPayment.id,
      durationDays: subscription.plan.durationDays || 30,
    });
  }
}
      return res.redirect(`${FRONTEND_URL}/subscription?status=success&message=Payment already processed`);
    }

    const payment = await prisma.payment.create({
      data: {
        businessId: subscription.businessId,
        subscriptionId: subscription.id,
        gateway: 'ESEWA',
        transactionId: transaction_uuid,
        amount: Math.round(parseFloat(total_amount) * 100),
        status: 'completed',
        esewaRefId: transaction_code,
        esewaProductCode: esewaService.getProductCode(),
      },
    });



    if (payment.subscriptionId) {
  await subscriptionService.changePlanAndActivate({
    subscriptionId: payment.subscriptionId,
    targetPlanId: targetPlan.id,
    paymentId: payment.id,
    billingPeriod: targetBillingPeriod as BillingPeriod,
  });

  console.log('[SubscriptionPayment] Subscription plan changed and activated:', payment.subscriptionId);
}

    return res.redirect(`${FRONTEND_URL}/subscription?status=success&message=Payment successful`);
  } catch (error: any) {
    console.error('[SubscriptionPayment] Success callback error:', error);
    return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=An error occurred`);
  }
};

/**
 * Handle eSewa payment failure callback
 */
export const handleEsewaFailure = async (req: Request, res: Response) => {
  try {
    const { data } = req.query;

    console.log('[SubscriptionPayment] eSewa failure callback:', { data });

    // No need to update payment records since payments are only created after successful verification
    // Failed transactions don't have payment records

    return res.redirect(`${FRONTEND_URL}/subscription?status=failed&message=Payment was cancelled or failed`);
  } catch (error: any) {
    console.error('[SubscriptionPayment] Failure callback error:', error);
    return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=An error occurred`);
  }
};

/**
 * Get subscription usage and limits
 */
export const getSubscriptionUsage = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    
    // Ensure businessId is a string
    const id = typeof businessId === 'string' ? businessId : Array.isArray(businessId) ? businessId[0] : businessId as string;

    const subscription = await prisma.subscription.findUnique({
      where: { businessId: id },
      include: { plan: true },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Get current usage counts
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [appointmentsCount, staffCount, servicesCount, customersCount] = await Promise.all([
      prisma.booking.count({
        where: {
          businessId: id,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.staff.count({
        where: { businessId: id, isActive: true },
      }),
      prisma.service.count({
        where: { businessId: id, isActive: true },
      }),
      prisma.customer.count({
        where: { businessId: id },
      }),
    ]);

    const plan = subscription.plan;

    return res.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planName: plan.displayName,
        expiresAt: subscription.endDate || subscription.trialEndsAt,
        daysRemaining: subscription.endDate 
          ? Math.max(0, Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : subscription.trialEndsAt
          ? Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : 0,
      },
      limits: {
        maxAppointmentsPerMonth: plan.maxAppointmentsPerMonth,
        maxStaff: plan.maxStaff,
        maxServices: plan.maxServices,
        maxCustomers: plan.maxCustomers,
      },
      usage: {
        appointmentsThisMonth: appointmentsCount,
        staff: staffCount,
        services: servicesCount,
        customers: customersCount,
      },
      features: {
        allowEmailNotifications: plan.allowEmailNotifications,
        allowOnlineBooking: plan.allowOnlineBooking,
        allowReports: plan.allowReports,
        allowCustomBranding: plan.allowCustomBranding,
        prioritySupport: plan.prioritySupport,
      },
    });
  } catch (error: any) {
    console.error('[SubscriptionPayment] Get usage error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get subscription usage' });
  }
};

/**
 * Check if action is allowed based on subscription limits
 */
export const checkSubscriptionLimit = async (req: Request, res: Response) => {
  try {
    const { businessId, action } = req.params;
    
    // Ensure businessId is a string
    const id = typeof businessId === 'string' ? businessId : Array.isArray(businessId) ? businessId[0] : businessId as string;

    const subscription = await prisma.subscription.findUnique({
      where: { businessId: id },
      include: { plan: true },
    });

    if (!subscription) {
      return res.json({ allowed: false, reason: 'No subscription found' });
    }

    // Check if subscription is valid
    const now = new Date();
    const isValid = 
      (subscription.status === 'TRIAL' && subscription.trialEndsAt && subscription.trialEndsAt > now) ||
      (subscription.status === 'ACTIVE' && subscription.endDate && subscription.endDate > now);

    if (!isValid) {
      return res.json({ allowed: false, reason: 'Subscription expired' });
    }

    const plan = subscription.plan;
    let allowed = true;
    let reason = '';
    let currentUsage = 0;
    let limit = -1;

    switch (action) {
      case 'create-appointment':
        if (plan.maxAppointmentsPerMonth !== -1) {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          currentUsage = await prisma.booking.count({
            where: {
              businessId: id,
              createdAt: { gte: startOfMonth },
            },
          });
          limit = plan.maxAppointmentsPerMonth;
          allowed = currentUsage < limit;
          reason = allowed ? '' : `Monthly appointment limit reached (${limit})`;
        }
        break;

      case 'add-staff':
        if (plan.maxStaff !== -1) {
          currentUsage = await prisma.staff.count({
            where: { businessId: id, isActive: true },
          });
          limit = plan.maxStaff;
          allowed = currentUsage < limit;
          reason = allowed ? '' : `Staff limit reached (${limit})`;
        }
        break;

      case 'add-service':
        if (plan.maxServices !== -1) {
          currentUsage = await prisma.service.count({
            where: { businessId: id, isActive: true },
          });
          limit = plan.maxServices;
          allowed = currentUsage < limit;
          reason = allowed ? '' : `Service limit reached (${limit})`;
        }
        break;

      case 'add-customer':
        // Customer records are unlimited for every subscription plan.
        allowed = true;
        break;


      case 'view-reports':
        allowed = plan.allowReports;
        reason = allowed ? '' : 'Reports not available in your plan';
        break;

      default:
        break;
    }

    return res.json({
      allowed,
      reason,
      currentUsage,
      limit,
    });
  } catch (error: any) {
    console.error('[SubscriptionPayment] Check limit error:', error);
    return res.status(500).json({ error: error.message || 'Failed to check subscription limit' });
  }
};

/**
 * Get all subscription plans with limits
 */
export const getSubscriptionPlans = async (req: Request, res: Response) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { priceNPR: 'asc' },
    });

    return res.json({ plans });
  } catch (error: any) {
    console.error('[SubscriptionPayment] Get plans error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get plans' });
  }
};


