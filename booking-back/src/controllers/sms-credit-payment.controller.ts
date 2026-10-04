// Controller for buying SMS credit packages with eSewa.
// Mirrors subscription-payment.controller.ts: nothing is persisted until
// eSewa's signed callback AND a server-to-server verification both pass.

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import esewaService from '../services/esewa.service';
import SubscriptionSmsService from '../services/subscription-sms.service';

const FRONTEND_URL = process.env.FRONTEND_URL || '';
const BACKEND_URL = process.env.BACKEND_URL || '';
// Where the user lands after paying. Adjust to your frontend route.
const SMS_PAGE = `${FRONTEND_URL}/dashboard/sms-credits`;

const TX_PREFIX = 'SMS-';

const redirectTo = (res: Response, status: 'success' | 'failed' | 'error', message: string) =>
  res.redirect(`${SMS_PAGE}?status=${status}&message=${encodeURIComponent(message)}`);

/** Only the logged-in owner of the business may buy credits for it. */
async function ownsBusiness(req: Request, businessId: string): Promise<boolean> {
  const userId = (req as any).userId;
  if (!userId) return false;
  const b = await prisma.business.findFirst({
    where: { id: businessId, userId },
    select: { id: true },
  });
  return !!b;
}

/**
 * GET /sms/packages
 */
export const getSmsPackages = async (_req: Request, res: Response) => {
  try {
    const packages = await prisma.smsCreditPackage.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
      res.set('Cache-Control', 'no-store')
    
    return res.json({ success: true, packages });
  } catch (error: any) {
    console.error('[SmsCreditPayment] Get packages error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get SMS packages' });
  }
};

/**
 * GET /business/:businessId/sms/balance
 */
export const getSmsBalance = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId as string;
    if (!(await ownsBusiness(req, businessId))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const stats = await SubscriptionSmsService.getSmsUsageStats(businessId);
    return res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('[SmsCreditPayment] Get balance error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get SMS balance' });
  }
};

/**
 * GET /business/:businessId/sms/transactions
 */
export const getSmsTransactions = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId as string;
    if (!(await ownsBusiness(req, businessId))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);
    const data = await SubscriptionSmsService.getTransactions(businessId, limit, offset);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('[SmsCreditPayment] Get transactions error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get transactions' });
  }
};

/**
 * Initiate an SMS credit purchase with eSewa.
 * The price always comes from the DB package, never from the client.
 */
export const initiateSmsCreditPayment = async (req: Request, res: Response) => {
  try {
    const { businessId, packageId } = req.body;

    if (!businessId || !packageId) {
      return res.status(400).json({ error: 'Business ID and Package ID are required' });
    }
    if (!(await ownsBusiness(req, businessId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const pkg = await prisma.smsCreditPackage.findFirst({
      where: { id: packageId, active: true },
    });
    if (!pkg) {
      return res.status(404).json({ error: 'SMS credit package not found' });
    }

    // Reference format: SMS-{businessId}-{packageId}-{timestamp}
    // (cuids contain no hyphens, so splitting on '-' is safe.)
    const transactionUuid = `${TX_PREFIX}${businessId}-${packageId}-${Date.now()}`.replace(/[^A-Za-z0-9-]/g, '');

    const esewaResponse = await esewaService.initiatePayment({
      amount: pkg.priceNPR,
      transactionUuid,
      successUrl: `${BACKEND_URL}/api/sms-credits/sms-payment/esewa/success`,
      failureUrl: `${BACKEND_URL}/api/sms-credits/sms-payment/esewa/failure`,
    });

    if (!esewaResponse.success) {
      return res.status(500).json({ error: esewaResponse.message });
    }

    console.log('[SmsCreditPayment] eSewa payment initiated:', {
      transactionUuid,
      amount: pkg.priceNPR,
      package: pkg.name,
      credits: pkg.credits + pkg.bonusCredits,
    });

    return res.json({
      success: true,
      formData: esewaResponse.formData,
      paymentUrl: esewaResponse.paymentUrl,
      package: {
        id: pkg.id,
        displayName: pkg.displayName,
        credits: pkg.credits,
        bonusCredits: pkg.bonusCredits,
        priceNPR: pkg.priceNPR,
      },
    });
  } catch (error: any) {
    console.error('[SmsCreditPayment] Initiation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to initiate payment' });
  }
};

/**
 * eSewa success callback.
 */
export const handleSmsEsewaSuccess = async (req: Request, res: Response) => {
  try {
    const { data } = req.query;

    if (!data || typeof data !== 'string') {
      console.error('[SmsCreditPayment] No data in eSewa callback');
      return redirectTo(res, 'error', 'Invalid callback data');
    }

    // 1. Decode + signature check
    const decoded = esewaService.decodeEsewaResponse(data);
    if (!decoded.success || !decoded.data) {
      console.error('[SmsCreditPayment] Failed to decode eSewa response');
      return redirectTo(res, 'error', 'Invalid response signature');
    }

    const { transaction_uuid, status, total_amount, transaction_code, product_code } = decoded.data;
    // eSewa can format large amounts with thousands separators ("1,300.0").
    const parsedTotalAmount = Number.parseFloat(String(total_amount).replace(/,/g, ''));

    if (status !== 'COMPLETE' || !Number.isFinite(parsedTotalAmount) || parsedTotalAmount <= 0) {
      return redirectTo(res, 'failed', 'Payment was not completed');
    }
    if (product_code !== esewaService.getProductCode()) {
      return redirectTo(res, 'error', 'Invalid product code');
    }

    // 2. Parse our reference
    const parts = transaction_uuid.startsWith(TX_PREFIX)
      ? transaction_uuid.slice(TX_PREFIX.length).split('-')
      : [];
    if (parts.length < 3) {
      return redirectTo(res, 'error', 'Invalid transaction reference');
    }
    const [businessId, packageId] = parts;

    const [business, pkg] = await Promise.all([
      prisma.business.findUnique({ where: { id: businessId }, select: { id: true } }),
      prisma.smsCreditPackage.findUnique({ where: { id: packageId } }),
    ]);
    if (!business || !pkg) {
      return redirectTo(res, 'error', 'Business or SMS package not found');
    }

    // 3. Server-to-server verification with eSewa
    const verification = await esewaService.verifyPayment(transaction_uuid, parsedTotalAmount);
    if (!verification.success) {
      console.error('[SmsCreditPayment] eSewa verification failed:', verification.message);
      return redirectTo(res, 'error', 'Payment verification failed');
    }
    if (verification.productCode !== product_code || verification.totalAmount !== parsedTotalAmount) {
      return redirectTo(res, 'error', 'Payment amount verification failed');
    }

    // 4. Paid amount must match the package price
    if (pkg.priceNPR !== parsedTotalAmount) {
      console.error('[SmsCreditPayment] Amount mismatch:', { expected: pkg.priceNPR, paid: parsedTotalAmount });
      return redirectTo(res, 'error', 'Payment amount does not match the selected package');
    }

    const creditsToGrant = pkg.credits + pkg.bonusCredits;

    // 5. Create the payment record (transactionId is unique). If the callback
    //    fires twice, reuse the existing record instead of failing.
    let payment = await prisma.payment.findUnique({ where: { transactionId: transaction_uuid } });

    if (!payment) {
      try {
        payment = await prisma.payment.create({
          data: {
            businessId,
            gateway: 'ESEWA',
            transactionId: transaction_uuid,
            amount: Math.round(parsedTotalAmount * 100), // paisa, same as subscription payments
            status: 'completed',
            esewaRefId: transaction_code,
            esewaProductCode: esewaService.getProductCode(),
            purpose: 'SMS_CREDITS',
            smsCreditPackageId: pkg.id,
            reference: pkg.displayName,
          },
        });
      } catch (err: any) {
        // Concurrent callback created it first (unique violation).
        if (err?.code === 'P2002') {
          payment = await prisma.payment.findUnique({ where: { transactionId: transaction_uuid } });
        } else {
          throw err;
        }
      }
    }

    if (!payment || payment.businessId !== businessId) {
      return redirectTo(res, 'error', 'Payment record mismatch');
    }

    // 6. Grant credits. Idempotent on paymentId, so retries and duplicate
    //    callbacks can never double-credit, and a crash between steps 5 and 6
    //    is repaired the next time the callback runs.
    const result = await SubscriptionSmsService.addCredits(businessId, creditsToGrant, 'PURCHASE', {
      description: `Purchased ${pkg.displayName}`,
      paymentId: payment.id,
    });

    console.log('[SmsCreditPayment] Credits', result.granted ? 'granted' : 'already granted', {
      businessId,
      credits: creditsToGrant,
      balance: result.balance,
    });

    return redirectTo(
      res,
      'success',
      result.granted ? `${creditsToGrant} SMS credits added` : 'Payment already processed'
    );
  } catch (error: any) {
    console.error('[SmsCreditPayment] Success callback error:', error);
    return redirectTo(res, 'error', 'An error occurred');
  }
};

/**
 * eSewa failure / cancel callback. Nothing was persisted, so nothing to undo.
 */
export const handleSmsEsewaFailure = async (req: Request, res: Response) => {
  try {
    console.log('[SmsCreditPayment] eSewa failure callback:', { data: req.query.data });
    return redirectTo(res, 'failed', 'Payment was cancelled or failed');
  } catch (error: any) {
    console.error('[SmsCreditPayment] Failure callback error:', error);
    return redirectTo(res, 'error', 'An error occurred');
  }
};