// src/controllers/subscription-payment.controller.ts
// Controller for handling subscription payments with eSewa and Khalti

import { Request, Response } from 'express';
import  prisma  from '../lib/prisma';
import esewaService from '../services/esewa.service';

import subscriptionService from '../services/subscription.service';


const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

/**
 * Initiate subscription payment with eSewa
 */
export const initiateEsewaPayment = async (req: Request, res: Response) => {
  try {
    const { businessId, planId } = req.body;

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
        },
      });
    }

    // Generate unique transaction ID
    const transactionUuid = `SUB-${subscription.id}-${Date.now()}`;

    // Create pending payment record
    const payment = await prisma.payment.create({
      data: {
        businessId,
        subscriptionId: subscription.id,
        gateway: 'ESEWA',
        transactionId: transactionUuid,
        amount: plan.priceNPR,
        status: 'pending',
        currency: 'NPR',
      },
    });

    // Generate eSewa payment form data
    const esewaResponse = await esewaService.initiatePayment({
      amount: plan.priceNPR,
      transactionUuid: transactionUuid,
      successUrl: `${BACKEND_URL}/api/subscription-payment/esewa/success`,
      failureUrl: `${BACKEND_URL}/api/subscription-payment/esewa/failure`,
    });

    if (!esewaResponse.success) {
      return res.status(500).json({ error: esewaResponse.message });
    }

    console.log('[SubscriptionPayment] eSewa payment initiated:', {
      paymentId: payment.id,
      transactionUuid,
      amount: plan.priceNPR,
    });

    return res.json({
      success: true,
      paymentId: payment.id,
      formData: esewaResponse.formData,
      paymentUrl: esewaResponse.paymentUrl,
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

    const { transaction_uuid, status, total_amount, transaction_code } = decoded.data;

    console.log('[SubscriptionPayment] eSewa success callback:', {
      transactionUuid: transaction_uuid,
      status,
      totalAmount: total_amount,
      transactionCode: transaction_code,
    });

    // Find the payment record
    const payment = await prisma.payment.findUnique({
      where: { transactionId: transaction_uuid },
      include: { subscription: true },
    });

    if (!payment) {
      console.error('[SubscriptionPayment] Payment not found:', transaction_uuid);
      return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Payment not found`);
    }

    // Verify with eSewa server (server-to-server verification)
    const verification = await esewaService.verifyPayment(
      transaction_uuid,
      parseFloat(total_amount)
    );

    if (!verification.success) {
      console.error('[SubscriptionPayment] eSewa verification failed:', verification.message);
      
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          errorMessage: verification.message,
        },
      });

      return res.redirect(`${FRONTEND_URL}/subscription?status=error&message=Payment verification failed`);
    }

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'completed',
        esewaRefId: transaction_code,
        esewaProductCode: esewaService.getProductCode(),
      },
    });

    // Activate subscription
    if (payment.subscriptionId) {
      const plan = await prisma.subscriptionPlan.findFirst({
        where: {
          subscriptions: {
            some: { id: payment.subscriptionId },
          },
        },
      });

      const durationDays = plan?.durationDays || 30;

      await subscriptionService.activateSubscription(payment.subscriptionId, {
        paymentId: payment.id,
        durationDays,
      });

      console.log('[SubscriptionPayment] Subscription activated:', payment.subscriptionId);
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

    if (data && typeof data === 'string') {
      const decoded = esewaService.decodeEsewaResponse(data);
      
      if (decoded.data?.transaction_uuid) {
        await prisma.payment.updateMany({
          where: { transactionId: decoded.data.transaction_uuid },
          data: {
            status: 'failed',
            errorMessage: 'Payment failed or cancelled by user',
          },
        });
      }
    }

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
    const { businessId } = req.params as any;

    const subscription = await prisma.subscription.findUnique({
      where: { businessId },
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
          businessId,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.staff.count({
        where: { businessId, isActive: true },
      }),
      prisma.service.count({
        where: { businessId, isActive: true },
      }),
      prisma.customer.count({
        where: { businessId },
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
    const { businessId, action } = req.params as any;

    const subscription = await prisma.subscription.findUnique({
      where: { businessId },
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
              businessId,
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
            where: { businessId, isActive: true },
          });
          limit = plan.maxStaff;
          allowed = currentUsage < limit;
          reason = allowed ? '' : `Staff limit reached (${limit})`;
        }
        break;

      case 'add-service':
        if (plan.maxServices !== -1) {
          currentUsage = await prisma.service.count({
            where: { businessId, isActive: true },
          });
          limit = plan.maxServices;
          allowed = currentUsage < limit;
          reason = allowed ? '' : `Service limit reached (${limit})`;
        }
        break;

      case 'add-customer':
        if (plan.maxCustomers !== -1) {
          currentUsage = await prisma.customer.count({
            where: { businessId },
          });
          limit = plan.maxCustomers;
          allowed = currentUsage < limit;
          reason = allowed ? '' : `Customer limit reached (${limit})`;
        }
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
