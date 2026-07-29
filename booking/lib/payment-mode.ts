/**
 * Payment Mode Configuration
 * Supports TEST mode for development when eSewa server is unavailable
 * and LIVE mode for production payments
 */

export type PaymentMode = 'LIVE' | 'TEST';

export const getPaymentMode = (): PaymentMode => {
  const mode = process.env.NEXT_PUBLIC_PAYMENT_MODE as PaymentMode || 'LIVE';
  console.log('[Payment Mode]', `Using ${mode} mode`);
  return mode;
};

export const isTestMode = (): boolean => {
  return getPaymentMode() === 'TEST';
};

export const isLiveMode = (): boolean => {
  return getPaymentMode() === 'LIVE';
};

/**
 * Generate a mock eSewa response for testing
 * Simulates successful payment without hitting eSewa server
 */
export const generateMockEsewaResponse = (amount: number, transactionUuid: string) => {
  return {
    success: true,
    data: {
      transactionUuid,
      totalAmount: amount,
      status: 'COMPLETE',
      refId: `TEST-REF-${Date.now()}`,
      transactionCode: `TEST-${transactionUuid}`,
    },
    message: 'Mock payment successful (TEST MODE)',
  };
};

/**
 * Simulate eSewa payment success for testing
 */
export const simulateEsewaPayment = async (
  planId: string,
  amount: number,
  transactionUuid: string
) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const mockResponse = generateMockEsewaResponse(amount, transactionUuid);
  console.log('[Payment Mode] Mock eSewa Response:', mockResponse);
  return mockResponse;
};
