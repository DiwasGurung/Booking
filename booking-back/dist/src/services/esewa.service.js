"use strict";
// src/services/payment/esewa.service.ts
// eSewa ePay v2 Integration for Nepal Payment Gateway
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EsewaPaymentService = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
class EsewaPaymentService {
    productCode;
    secretKey;
    paymentUrl;
    verifyUrl;
    constructor() {
        // Use test credentials if not in production
        const isProduction = process.env.NODE_ENV === 'production';
        this.productCode = process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST';
        this.secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
        // eSewa ePay v2 URLs - Official sandbox and production endpoints
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
    generateSignature(message) {
        const hmac = crypto_1.default.createHmac('sha256', this.secretKey);
        hmac.update(message);
        return hmac.digest('base64');
    }
    /**
     * Create payment form data for eSewa ePay v2
     * This returns form data that should be submitted via POST to eSewa
     */
    async initiatePayment(request) {
        try {
            const amount = request.amount;
            const taxAmount = request.taxAmount || 0;
            const productServiceCharge = request.productServiceCharge || 0;
            const productDeliveryCharge = request.productDeliveryCharge || 0;
            const totalAmount = amount + taxAmount + productServiceCharge + productDeliveryCharge;
            // Create signature message
            const signedFieldNames = 'total_amount,transaction_uuid,product_code';
            const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${request.transactionUuid},product_code=${this.productCode}`;
            const signature = this.generateSignature(signatureMessage);
            const formData = {
                amount: amount.toString(),
                tax_amount: taxAmount.toString(),
                total_amount: totalAmount.toString(),
                transaction_uuid: request.transactionUuid,
                product_code: this.productCode,
                product_service_charge: productServiceCharge.toString(),
                product_delivery_charge: productDeliveryCharge.toString(),
                success_url: request.successUrl,
                failure_url: request.failureUrl,
                signed_field_names: signedFieldNames,
                signature: signature,
            };
            console.log('[eSewa] Payment initiated:', {
                transactionUuid: request.transactionUuid,
                totalAmount,
                paymentUrl: this.paymentUrl,
            });
            return {
                success: true,
                message: 'Payment form data generated successfully',
                formData,
                paymentUrl: this.paymentUrl,
            };
        }
        catch (error) {
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
    async verifyPayment(transactionUuid, totalAmount) {
        try {
            // Decode the base64 response data if provided
            const response = await axios_1.default.get(this.verifyUrl, {
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
            }
            else if (data.status === 'PENDING') {
                return {
                    success: false,
                    status: 'PENDING',
                    message: 'Payment is still pending',
                };
            }
            else if (data.status === 'FULL_REFUND' || data.status === 'PARTIAL_REFUND') {
                return {
                    success: false,
                    status: data.status,
                    message: 'Payment has been refunded',
                };
            }
            else {
                return {
                    success: false,
                    status: data.status || 'FAILED',
                    message: data.message || 'Payment verification failed',
                };
            }
        }
        catch (error) {
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
    decodeEsewaResponse(encodedData) {
        try {
            const decodedString = Buffer.from(encodedData, 'base64').toString('utf-8');
            const data = JSON.parse(decodedString);
            // Verify the signature
            const signedFields = data.signed_field_names.split(',');
            const signatureMessage = signedFields
                .map((field) => `${field}=${data[field]}`)
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
        }
        catch (error) {
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
    getPaymentUrl() {
        return this.paymentUrl;
    }
    /**
     * Get product code
     */
    getProductCode() {
        return this.productCode;
    }
}
exports.EsewaPaymentService = EsewaPaymentService;
exports.default = new EsewaPaymentService();
