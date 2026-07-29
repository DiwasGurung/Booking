import crypto from 'crypto';

interface EsewaPaymentResponse {
  transaction_code: string;
  status: 'COMPLETE' | 'PENDING' | 'FULL_REFUND' | 'PARTIAL_REFUND' | 'AMBIGUOUS' | 'NOT_FOUND' | 'CANCELED';
  total_amount: number;
  transaction_uuid: string;
  product_code: string;
  signed_field_names: string;
  signature: string;
}

interface VerificationResult {
  valid: boolean;
  data?: EsewaPaymentResponse;
  error?: string;
}

/**
 * Decode Base64-encoded eSewa response
 */
export function decodeEsewaResponse(encodedData: string): EsewaPaymentResponse | null {
  try {
    const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
    return JSON.parse(decodedData);
  } catch (error) {
    console.error('[eSewa] Failed to decode response:', error);
    return null;
  }
}

/**
 * Verify eSewa payment response signature
 * Ensures the response hasn't been tampered with
 */
export function verifyEsewaSignature(
  responseData: EsewaPaymentResponse,
  secretKey: string
): boolean {
  try {
    const { signature, signed_field_names, ...data } = responseData;

    // Build the signature message using the signed field names in the same order
    const fieldNames = signed_field_names.split(',');
    const signatureMessage = fieldNames
      .map((field) => {
        const key = field as keyof typeof data;
        return `${field}=${data[key]}`;
      })
      .join(',');

    console.log('[eSewa] Verifying signature...');
    console.log('[eSewa] Signature message:', signatureMessage);

    // Generate signature using the same method as request
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(signatureMessage);
    const generatedSignature = hmac.digest('base64');

    console.log('[eSewa] Expected signature:', signature);
    console.log('[eSewa] Generated signature:', generatedSignature);

    const isValid = signature === generatedSignature;
    console.log('[eSewa] Signature valid:', isValid);

    return isValid;
  } catch (error) {
    console.error('[eSewa] Signature verification error:', error);
    return false;
  }
}

/**
 * Process eSewa payment response from callback
 */
export function processEsewaCallback(
  encodedResponse: string,
  secretKey: string
): VerificationResult {
  try {
    // Step 1: Decode the Base64 response
    const decodedData = decodeEsewaResponse(encodedResponse);
    if (!decodedData) {
      return {
        valid: false,
        error: 'Failed to decode eSewa response',
      };
    }

    console.log('[eSewa] Decoded response:', decodedData);

    // Step 2: Verify the signature
    const isSignatureValid = verifyEsewaSignature(decodedData, secretKey);
    if (!isSignatureValid) {
      return {
        valid: false,
        error: 'Signature verification failed - possible tampering detected',
      };
    }

    // Step 3: Check payment status
    if (decodedData.status !== 'COMPLETE') {
      return {
        valid: false,
        error: `Payment status is ${decodedData.status}. Only COMPLETE status indicates successful payment.`,
      };
    }

    return {
      valid: true,
      data: decodedData,
    };
  } catch (error: any) {
    console.error('[eSewa] Error processing callback:', error);
    return {
      valid: false,
      error: error.message || 'Unknown error processing payment callback',
    };
  }
}

/**
 * Extract payment data from query parameters or form data
 */
export function extractEsewaResponseFromParams(params: {
  [key: string]: string | string[] | undefined;
}): string | null {
  // eSewa sends response as 'data' parameter with Base64-encoded JSON
  const response = params.data;
  if (typeof response === 'string') {
    return response;
  }
  if (Array.isArray(response)) {
    return response[0];
  }
  return null;
}
