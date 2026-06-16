import axios from 'axios'
import crypto from 'crypto'

interface NabilPaymentRequest {
  amount: number
  subscriptionId: string
  planName: string
  userName?: string
  userEmail?: string
}

interface NabilPaymentResponse {
  success: boolean
  message: string
  transactionId?: string
  paymentUrl?: string
  data?: Record<string, any>
}

interface NabilVerificationResult {
  success: any
  isValid: boolean
  transactionId?: string
  status?: string
  message?: string
}

class NabilPaymentService {
  private merchantCode: string
  private merchantPassword: string
  private initiateUrl: string
  private verifyUrl: string

  constructor() {
    this.merchantCode = process.env.NABIL_MERCHANT_CODE || ''
    this.merchantPassword = process.env.NABIL_MERCHANT_PASSWORD || ''
    
    // Nabil Bank API URLs (update with actual endpoints)
    this.initiateUrl = process.env.NABIL_INITIATE_URL || 'https://merchant.nabilbank.com/api/initiate'
    this.verifyUrl = process.env.NABIL_VERIFY_URL || 'https://merchant.nabilbank.com/api/verify'
  }

  /**
   * Initiate Nabil Bank payment
   */
  async initiatePayment(request: NabilPaymentRequest): Promise<NabilPaymentResponse> {
    try {
      // Create unique reference code
      const referenceCode = `${this.merchantCode}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const payload = {
        merchantCode: this.merchantCode,
        referenceCode,
        description: `${request.planName} Subscription`,
        amount: Math.round(request.amount * 100), // Amount in cents
        returnUrl: `${process.env.FRONTEND_URL}/subscription/payment-success`,
        failureUrl: `${process.env.FRONTEND_URL}/subscription/payment-failed`,
        cancelUrl: `${process.env.FRONTEND_URL}/subscription/payment-failed`,
        customerName: request.userName || 'Customer',
        customerEmail: request.userEmail || 'user@example.com',
        transactionId: request.subscriptionId,
      }

      // Create signature for request validation
      const signature = this.createSignature(payload)

      const response = await axios.post(this.initiateUrl, {
        ...payload,
        signature
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.merchantCode}`
        },
        timeout: 10000
      })

      if (response.data.success || response.data.status === 'INITIATED') {
        return {
          success: true,
          message: 'Payment initiated successfully',
          transactionId: response.data.referenceCode || referenceCode,
          paymentUrl: response.data.paymentUrl,
          data: response.data
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to initiate payment',
        }
      }
    } catch (error: any) {
      console.error('[v0] Nabil payment initiation error:', error.message)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to initiate payment',
      }
    }
  }

  /**
   * Verify Nabil Bank payment
   */
  async verifyPayment(referenceCode: string, amount: number): Promise<NabilVerificationResult> {
    try {
      const payload = {
        merchantCode: this.merchantCode,
        referenceCode,
        amount: Math.round(amount * 100) // Amount in cents
      }

      // Create signature for verification request
      const signature = this.createSignature(payload)

      const response = await axios.post(this.verifyUrl, {
        ...payload,
        signature
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.merchantCode}`
        },
        timeout: 10000
      })

      if (response.data.status === 'SUCCESS' || response.data.success) {
        return {
          success: true,
          isValid: true,
          transactionId: response.data.transactionId || referenceCode,
          status: 'COMPLETED',
          message: 'Payment verified successfully'
        }
      } else if (response.data.status === 'PENDING') {
        return {
          success: false,
          isValid: false,
          status: 'PENDING',
          message: 'Payment is still pending'
        }
      } else {
        return {
          success: false,
          isValid: false,
          status: response.data.status || 'FAILED',
          message: response.data.message || 'Payment verification failed'
        }
      }
    } catch (error: any) {
      console.error('[v0] Nabil payment verification error:', error.message)
      return {
        success: false,
        isValid: false,
        status: 'ERROR',
        message: error.response?.data?.message || error.message || 'Verification failed'
      }
    }
  }

  /**
   * Create signature for Nabil Bank request validation
   */
  private createSignature(payload: any): string {
    try {
      // Convert payload to string (specific format required by Nabil Bank)
      const message = `${this.merchantCode}${payload.referenceCode || payload.transactionId}${payload.amount}${this.merchantPassword}`
      
      // Create SHA256 signature
      const signature = crypto
        .createHash('sha256')
        .update(message)
        .digest('hex')
      
      return signature
    } catch (error) {
      console.error('[v0] Error creating Nabil signature:', error)
      return ''
    }
  }

  /**
   * Verify webhook signature from Nabil Bank
   */
  verifyWebhookSignature(payload: any, receivedSignature: string): boolean {
    try {
      const expectedSignature = this.createSignature(payload)
      return receivedSignature === expectedSignature
    } catch (error) {
      console.error('[v0] Nabil webhook signature verification failed:', error)
      return false
    }
  }
}

export default new NabilPaymentService()
