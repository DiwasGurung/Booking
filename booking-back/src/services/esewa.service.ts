// src/services/payment/esewa.service.ts
// eSewa ePay v2 Integration for Nepal Payment Gateway

import axios from 'axios';
import crypto from 'crypto';

export interface EsewaPaymentRequest {
  amount: number;
  taxAmount?: number;
  productServiceCharge?: number;
  productDeliveryCharge?: number;
  transactionUuid: string;
  successUrl: string;
  failureUrl: string;
}

export interface EsewaPaymentResponse {
  success: boolean;
  message: string;
  formData?: {
    amount: string;
    tax_amount: string;
    total_amount: string;
    transaction_uuid: string;
    product_code: string;
    product_service_charge: string;
    product_delivery_charge: string;
    success_url: string;
    failure_url: string;
    signed_field_names: string;
    signature: string;
  };
  paymentUrl?: string;
}

export interface EsewaVerificationResult {
  success: boolean;
  status: string;
  message: string;
  transactionCode?: string;
  totalAmount?: number;
  productCode?: string;
}

export class EsewaPaymentService {
  private productCode: string;
  private secretKey: string;
  private paymentUrl: string;
  private verifyUrl: string;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    const configuredProductCode = process.env.ESEWA_PRODUCT_CODE || process.env.ESEWA_MERCHANT_CODE;
    const configuredSecretKey = process.env.ESEWA_SECRET_KEY || process.env.ESEWA_MERCHANT_SECRET;

    if (isProduction && (!configuredProductCode || !configuredSecretKey)) {
      throw new Error('eSewa production credentials are not configured');
    }

    this.productCode = configuredProductCode || 'EPAYTEST';
    this.secretKey = configuredSecretKey || '8gBm/:&EnhH.1/q';
    this.paymentUrl = isProduction
      ? 'https://epay.esewa.com.np/api/epay/main/v2/form'
      : 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
    this.verifyUrl = isProduction
      ? 'https://epay.esewa.com.np/api/epay/transaction/status/'
      : 'https://rc-epay.esewa.com.np/api/epay/transaction/status/';
  }

  /**
   * Generate HMAC-SHA256 signature for eSewa ePay v2
   */
  private generateSignature(message: string): string {
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(message);
    return hmac.digest('base64');
  }

  /**
   * Create payment form data for eSewa ePay v2
   * This returns form data that should be submitted via POST to eSewa
   */
  async initiatePayment(request: EsewaPaymentRequest): Promise<EsewaPaymentResponse> {
    try {
      const amount = Number(request.amount);
      const taxAmount = Number(request.taxAmount || 0);
      const productServiceCharge = Number(request.productServiceCharge || 0);
      const productDeliveryCharge = Number(request.productDeliveryCharge || 0);
      if (![amount, taxAmount, productServiceCharge, productDeliveryCharge].every(Number.isFinite) || amount <= 0) {
        throw new Error('Invalid eSewa payment amount');
      }

      const amountValue = amount.toString();
      const taxAmountValue = taxAmount.toString();
      const serviceChargeValue = productServiceCharge.toString();
      const deliveryChargeValue = productDeliveryCharge.toString();
      const totalAmountValue = (amount + taxAmount + productServiceCharge + productDeliveryCharge).toString();
      const signedFieldNames = 'total_amount,transaction_uuid,product_code';
      const signatureMessage = signedFieldNames.split(',').map(field => {
        const value = field === 'total_amount' ? totalAmountValue : field === 'transaction_uuid' ? request.transactionUuid : this.productCode;
        return `${field}=${value}`;
      }).join(',');
      const signature = this.generateSignature(signatureMessage);

      const formData = {
        amount: amountValue,
        tax_amount: taxAmountValue,
        total_amount: totalAmountValue,
        transaction_uuid: request.transactionUuid,
        product_code: this.productCode,
        product_service_charge: serviceChargeValue,
        product_delivery_charge: deliveryChargeValue,
        success_url: request.successUrl,
        failure_url: request.failureUrl,
        signed_field_names: signedFieldNames,
        signature: signature,
      };

      console.log('[eSewa] Payment payload prepared:', {
        transactionUuid: request.transactionUuid,
        productCode: this.productCode,
        totalAmount: totalAmountValue,
        signedFieldNames,
        paymentUrl: this.paymentUrl,
      });

      return {
        success: true,
        message: 'Payment form data generated successfully',
        formData,
        paymentUrl: this.paymentUrl,
      };
    } catch (error: any) {
      console.error('[eSewa] Payment initiation error:', error);
      return {
        success: false,
        message: error.message || 'Failed to initiate payment',
      };
    }
  }

  /**
   * Verify payment status with eSewa server
   * This should be called after user returns from eSewa to validate the payment
   */
  async verifyPayment(
    transactionUuid: string,
    totalAmount: number
  ): Promise<EsewaVerificationResult> {
    try {
      // Decode the base64 response data if provided
      const response = await axios.get(this.verifyUrl, {
        params: {
          product_code: this.productCode,
          total_amount: totalAmount,
          transaction_uuid: transactionUuid,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = response.data;
      console.log('[eSewa] Verification response:', data);

      if (data.status === 'COMPLETE') {
        return {
          success: true,
          status: 'COMPLETE',
          message: 'Payment verified successfully',
          transactionCode: data.ref_id || data.transaction_code,
          totalAmount: parseFloat(data.total_amount),
          productCode: data.product_code,
        };
      } else if (data.status === 'PENDING') {
        return {
          success: false,
          status: 'PENDING',
          message: 'Payment is still pending',
        };
      } else if (data.status === 'FULL_REFUND' || data.status === 'PARTIAL_REFUND') {
        return {
          success: false,
          status: data.status,
          message: 'Payment has been refunded',
        };
      } else {
        return {
          success: false,
          status: data.status || 'FAILED',
          message: data.message || 'Payment verification failed',
        };
      }
    } catch (error: any) {
      console.error('[eSewa] Verification error:', error.response?.data || error.message);
      return {
        success: false,
        status: 'ERROR',
        message: error.response?.data?.message || error.message || 'Verification failed',
      };
    }
  }

  /**
   * Decode and verify the response data from eSewa callback
   * eSewa returns a base64 encoded JSON in the 'data' query parameter
   */
  decodeEsewaResponse(encodedData: string): {
    success: boolean;
    data?: {
      transaction_code: string;
      status: string;
      total_amount: string;
      transaction_uuid: string;
      product_code: string;
      signed_field_names: string;
      signature: string;
    };
    message?: string;
  } {
    try {
      const decodedString = Buffer.from(encodedData, 'base64').toString('utf-8');
      const data = JSON.parse(decodedString);
      
      // Verify the signature
      const signedFields = data.signed_field_names.split(',');
      const signatureMessage = signedFields
        .map((field: string) => `${field}=${data[field]}`)
        .join(',');
      
      const expectedSignature = this.generateSignature(signatureMessage);
      
      if (data.signature !== expectedSignature) {
        console.error('[eSewa] Signature mismatch');
        return {
          success: false,
          message: 'Invalid signature',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('[eSewa] Failed to decode response:', error);
      return {
        success: false,
        message: 'Failed to decode eSewa response',
      };
    }
  }

  /**
   * Get payment URL for redirecting user
   */
  getPaymentUrl(): string {
    return this.paymentUrl;
  }

  /**
   * Get product code
   */
  getProductCode(): string {
    return this.productCode;
  }
}

export default new EsewaPaymentService();
