import { ReactNode } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export type ApiResponse<T> = {
  data?: T
  error?: string
  message?: string
  success?: boolean
}

// Export types for use in components
export interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
  offerPrice?: number
}

export interface Business {
  logo: import("react/jsx-runtime").JSX.Element
  category: ReactNode
  rating: any
  description: any
  address: ReactNode
  city: ReactNode
  website: any
  id: string
  name: string
  phone: string
  email: string
  location?: string
}

export interface Booking {
  id: string
  serviceId: string
  businessId: string
  staffId?: string
  startTime: string
  endTime: string
  customerName: string
  customerEmail: string
  customerPhone: string
  status: string
  notes?: string
  staff?: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
}

// Payment types
export interface Payment {
  id: string
  subscriptionId: string
  amount: number
  currency: string
  gateway: 'ESEWA' | 'KHALTI' | 'STRIPE'
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  transactionId?: string
  paymentIntentId?: string
  token?: string
  createdAt: string
  updatedAt: string
}

export interface InitiatePaymentRequest {
  method: 'ESEWA' | 'KHALTI' | 'STRIPE'
  subscriptionId: string
  amount: number
  currency: string
  planName: string
  userName?: string
  userEmail?: string
}

export interface PaymentResponse {
  success: boolean
  message: string
  transactionId?: string
  paymentId?: string
  data?: Record<string, any> & {
    clientSecret?: string
    paymentIntentId?: string
  }
  paymentUrl?: string
  redirectUrl?: string
}

export interface VerifyPaymentRequest {
  paymentIntentId?: string
  paymentId?: string
  token?: string
  amount?: number
}

export interface PaymentHistory {
  id: string
  subscriptionId: string
  amount: number
  currency: string
  gateway: string
  status: string
  createdAt: string
}

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
    
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Merge custom headers
    if (options?.headers) {
      Object.assign(headers, options.headers)
    }
    
    // Use credentials: 'include' to automatically send/receive HTTP-only cookies
    const response = await fetch(url, {
      headers,
      credentials: 'include', // Send session cookies with every request
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      return {
        error: error.message || error.error || 'An error occurred',
        success: false,
      }
    }

    const data = await response.json()
    return { data, success: true }
  } catch (error) {
    console.error('[v0] API error:', error)
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      success: false,
    }
  }
}

// Users API - /api/users prefix
export const usersApi = {
  // Register/Create new user
  signup: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string; role?: string }) =>
    apiCall<any>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Login user
  login: (email: string, password: string) =>
    apiCall<any>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Logout user
  logout: () =>
    apiCall<any>('/api/users/logout', {
      method: 'POST',
    }),

  // Update user profile (firstName, lastName, phone, avatar)
  updateProfile: (userId: string, data: { firstName?: string; lastName?: string; phone?: string; avatar?: string }) =>
    apiCall<any>(`/api/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Change user password
  changePassword: (userId: string, data: { currentPassword: string; newPassword: string }) =>
    apiCall<any>(`/api/users/${userId}/change-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get current user info
  getCurrentUser: () =>
    apiCall<any>('/api/users/me'),
}

// Services API - /api/services prefix
export const servicesApi = {
  // Create a new service
  create: (data: Service) =>
    apiCall<Service>('/api/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get all services for a business
  getBusinessServices: (businessId: string) =>
    apiCall<Service[]>(`/api/services/business/${businessId}`),

  // Get active services for a business
  getActiveServices: (businessId: string) =>
    apiCall<Service[]>(`/api/services/business/${businessId}/active`),

  // Get service by ID
  getServiceById: (serviceId: string) =>
    apiCall<Service>(`/api/services/${serviceId}`),

  // Get services with stats
  withStats: (businessId: string) =>
    apiCall<Service[]>(`/api/services/business/${businessId}/stats`),

  // Update service
  update: (serviceId: string, data: Partial<Service>) =>
    apiCall<Service>(`/api/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete service
  delete: (serviceId: string) =>
    apiCall<void>(`/api/services/${serviceId}`, {
      method: 'DELETE',
    }),
}

// Business Hours API - /api/business-hours prefix
export const businessHoursApi = {
  // Get business hours for a business
  getBusinessHours: (businessId: string) =>
    apiCall<any[]>(`/api/business-hours/business/${businessId}`),

  // Get hours for a specific day
  getHoursByDay: (businessId: string, dayOfWeek: number) =>
    apiCall<any>(`/api/business-hours/business/${businessId}/${dayOfWeek}`),

  // Create business hours
  create: (data: any) =>
    apiCall<any>('/api/business-hours', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update business hours
  update: (id: string, data: any) =>
    apiCall<any>(`/api/business-hours/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete business hours
  delete: (id: string) =>
    apiCall<void>(`/api/business-hours/${id}`, {
      method: 'DELETE',
    }),
}

// Bookings API - /api/booking prefix
export const bookingsApi = {
  // Create a new booking
  createBooking: (data: {
    serviceId: string
    businessId: string
    userId?: string
    staffId?: string
    startTime: string
    endTime: string
    customerName: string
    customerEmail: string
    customerPhone: string
    notes?: string
  }) =>
    apiCall<Booking>('/api/booking/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get a single booking by ID
  getBookingById: (bookingId: string) =>
    apiCall<Booking>(`/api/booking/bookings/${bookingId}`),

  // Update booking information
  updateBooking: (bookingId: string, data: Partial<Booking>) =>
    apiCall<Booking>(`/api/booking/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Update booking status
  updateBookingStatus: (bookingId: string, status: string) =>
    apiCall<Booking>(`/api/booking/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Cancel a booking
  cancelBooking: (bookingId: string) =>
    apiCall<Booking>(`/api/booking/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
    }),

  // Delete a booking
  deleteBooking: (bookingId: string) =>
    apiCall<void>(`/api/booking/bookings/${bookingId}`, {
      method: 'DELETE',
    }),

  // Get all bookings for a specific business
  getBusinessBookings: (businessId: string, page = 1, limit = 10, status?: string) => {
    let url = `/api/booking/businesses/${businessId}/bookings?page=${page}&limit=${limit}`
    if (status) {
      url += `&status=${status}`
    }
    return apiCall<Booking[] | { bookings: Booking[] }>(url)
  },

  // Get booking trends for a business
  getBookingTrends: (businessId: string) =>
    apiCall<any>(`/api/booking/businesses/${businessId}/booking-trends`),

  // Get available slots for a service at a business
  getAvailableSlots: (businessId: string, serviceId: string, date: string) =>
    apiCall<string[] | { slots: string[] }>(
      `/api/booking/businesses/${businessId}/services/${serviceId}/available-slots?date=${date}`
    ),

  // Get all bookings for a specific user/customer
  getCustomerBookings: (userId: string) =>
    apiCall<Booking[]>(`/api/booking/users/${userId}/bookings`),

}

// Business API - /api/businesses prefix
export const businessApi = {
  // Create a new business
  create: (data: Business) =>
    apiCall<Business>('/api/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get all businesses
  getAll: () =>
    apiCall<Business[]>('/api/businesses'),

  // Search businesses
  searchBusinesses: (query: string, limit = 10) =>
    apiCall<Business[] | { businesses: Business[] }>(
      `/api/businesses/search?q=${encodeURIComponent(query)}&limit=${limit}`
    ),

  // Get business by ID
  getBusinessById: (businessId: string) =>
    apiCall<Business>(`/api/businesses/${businessId}`),

  // Get business by user ID
  getByUserId: (userId: string) =>
    apiCall<Business>(`/api/businesses/user/${userId}`),

  // Update business
  update: (businessId: string, data: Partial<Business>) =>
    apiCall<Business>(`/api/businesses/${businessId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete business
  delete: (businessId: string) =>
    apiCall<void>(`/api/businesses/${businessId}`, {
      method: 'DELETE',
    }),

  // Get business statistics
  getStats: (businessId: string) =>
    apiCall<Record<string, any>>(`/api/businesses/${businessId}/stats`),

  // Get monthly revenue
  getMonthlyRevenue: (businessId: string, months = 6) =>
    apiCall<Record<string, number>>(`/api/businesses/${businessId}/revenue?months=${months}`),

  // Get business analytics
  getAnalytics: (businessId: string, params?: { days?: number }) =>
    apiCall<any>(`/api/businesses/${businessId}/analytics${params?.days ? `?days=${params.days}` : ''}`),

  // Get business settings
  getSettings: (businessId: string) =>
    apiCall<any>(`/api/businesses/${businessId}/settings`),

  // Update business settings
  updateSettings: (businessId: string, data: any) =>
    apiCall<any>(`/api/businesses/${businessId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}

// Notifications API - /api/notifications prefix
export const notificationsApi = {
  // Create notification
  create: (data: any) =>
    apiCall<any>('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get user notifications
  getUserNotifications: (userId: string) =>
    apiCall<any[]>(`/api/notifications/user/${userId}`),

  // Get unread count
  getUnreadCount: (userId: string) =>
    apiCall<{ count: number }>(`/api/notifications/user/${userId}/unread-count`),

  // Mark all as read
  markAllAsRead: (userId: string) =>
    apiCall<void>(`/api/notifications/user/${userId}/read-all`, {
      method: 'PUT',
    }),

  // Get notification by ID
  getById: (notificationId: string) =>
    apiCall<any>(`/api/notifications/${notificationId}`),

  // Mark as read
  markAsRead: (notificationId: string) =>
    apiCall<any>(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    }),

  // Delete notification
  delete: (notificationId: string) =>
    apiCall<void>(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    }),
}

// Payment API - /api/payment prefix
export const paymentApi = {
  // Initiate payment with selected gateway (eSewa, Khalti, or Stripe)
  initiatePayment: (data: InitiatePaymentRequest) =>
    apiCall<PaymentResponse>('/api/payment/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Verify Stripe payment after checkout
  verifyStripePayment: (paymentIntentId: string, paymentId: string) =>
    apiCall<PaymentResponse>('/api/payment/stripe/verify', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId, paymentId }),
    }),

  // Verify Khalti payment
  verifyKhaltiPayment: (token: string, amount: number) =>
    apiCall<PaymentResponse>('/api/payment/khalti/verify', {
      method: 'POST',
      body: JSON.stringify({ token, amount }),
    }),

  // Verify eSewa payment
  verifyEsewaPayment: (refId: string) =>
    apiCall<PaymentResponse>('/api/payment/esewa/verify', {
      method: 'POST',
      body: JSON.stringify({ refId }),
    }),

  // Get payment details
  getPaymentDetails: (paymentId: string) =>
    apiCall<Payment>(`/api/payment/${paymentId}`),

  // Get payment status
  getPaymentStatus: (paymentId: string) =>
    apiCall<{ status: string; message: string }>(`/api/payment/${paymentId}/status`),

  // Get subscription payment history
  getPaymentHistory: (subscriptionId: string, page = 1, limit = 10) =>
    apiCall<PaymentHistory[] | { payments: PaymentHistory[] }>(
      `/api/payment/subscription/${subscriptionId}/history?page=${page}&limit=${limit}`
    ),

  // Get user's all payments
  getUserPayments: (userId: string, page = 1, limit = 10) =>
    apiCall<Payment[] | { payments: Payment[] }>(
      `/api/payment/user/${userId}/payments?page=${page}&limit=${limit}`
    ),

  // Cancel pending payment
  cancelPayment: (paymentId: string) =>
    apiCall<PaymentResponse>(`/api/payment/${paymentId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED' }),
    }),

  // Get payment gateway health status
  getGatewayStatus: (gateway: 'ESEWA' | 'KHALTI' | 'STRIPE') =>
    apiCall<{ status: string; available: boolean }>(`/api/payment/gateway/${gateway}/status`),

  // Get supported currencies
  getSupportedCurrencies: () =>
    apiCall<{ esewa: string[]; khalti: string[]; stripe: string[] }>('/api/payment/currencies'),

  // Check if subscription is already paid
  checkSubscriptionPaymentStatus: (subscriptionId: string) =>
    apiCall<{ paid: boolean; status: string; lastPayment?: Payment }>(`/api/payment/subscription/${subscriptionId}/status`),
}

// Staff types
export interface Staff {
  id: string
  businessId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  avatar?: string
  role: string
  isActive: boolean
  workingHours?: Record<string, { start: string; end: string; isWorking: boolean }>
  breakTimes?: { start: string; end: string }[]
  services?: { id: string; service: Service }[]
  _count?: { bookings: number }
  createdAt: string
  updatedAt: string
}

export interface CreateStaffData {
  businessId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  avatar?: string
  role?: string
  workingHours?: Record<string, { start: string; end: string; isWorking: boolean }>
  breakTimes?: { start: string; end: string }[]
  serviceIds?: string[]
}

export interface UpdateStaffData {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  avatar?: string
  role?: string
  isActive?: boolean
  workingHours?: Record<string, { start: string; end: string; isWorking: boolean }>
  breakTimes?: { start: string; end: string }[]
  serviceIds?: string[]
}

// Staff API - /api/staff prefix
export const staffApi = {
  // Create new staff member
  create: (data: CreateStaffData) =>
    apiCall<{ success: boolean; staff: Staff }>('/api/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get staff by ID
  getById: (staffId: string) =>
    apiCall<{ staff: Staff }>(`/api/staff/${staffId}`),

  // Get all staff for a business
  getBusinessStaff: (businessId: string, includeInactive = false) =>
    apiCall<{ staff: Staff[] }>(`/api/staff/business/${businessId}?includeInactive=${includeInactive}`),

  // Get staff who can perform a specific service
  getStaffForService: (serviceId: string) =>
    apiCall<{ staff: Staff[] }>(`/api/staff/service/${serviceId}`),

  // Update staff member
  update: (staffId: string, data: UpdateStaffData) =>
    apiCall<{ success: boolean; staff: Staff }>(`/api/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete staff member
  delete: (staffId: string) =>
    apiCall<{ success: boolean; message: string }>(`/api/staff/${staffId}`, {
      method: 'DELETE',
    }),

  // Toggle staff active status
  toggleStatus: (staffId: string) =>
    apiCall<{ success: boolean; staff: Staff }>(`/api/staff/${staffId}/toggle-status`, {
      method: 'PATCH',
    }),

  // Get staff availability for a specific date
  getAvailability: (staffId: string, date: string, duration: number) =>
    apiCall<{ slots: { start: string; end: string }[] }>(
      `/api/staff/${staffId}/availability?date=${date}&duration=${duration}`
    ),

  // Get staff statistics
  getStats: (staffId: string, startDate?: string, endDate?: string) => {
    let url = `/api/staff/${staffId}/stats`
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`
    }
    return apiCall<{ stats: any }>(url)
  },
}

// SMS API - /api/sms prefix
export const smsApi = {
  // Send test SMS
  sendTest: (phoneNumber: string, message: string) =>
    apiCall<{ success: boolean; result: any }>('/api/sms/test', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, message }),
    }),

  // Get SMS logs
  getLogs: (params?: { phoneNumber?: string; type?: string; status?: string; limit?: number; offset?: number }) => {
    let url = '/api/sms/logs'
    if (params) {
      const query = new URLSearchParams()
      if (params.phoneNumber) query.append('phoneNumber', params.phoneNumber)
      if (params.type) query.append('type', params.type)
      if (params.status) query.append('status', params.status)
      if (params.limit) query.append('limit', params.limit.toString())
      if (params.offset) query.append('offset', params.offset.toString())
      if (query.toString()) url += `?${query.toString()}`
    }
    return apiCall<{ success: boolean; logs: any[]; total: number }>(url)
  },

  // Get logs by phone number
  getLogsByPhone: (phoneNumber: string) =>
    apiCall<{ success: boolean; phoneNumber: string; logs: any[] }>(`/api/sms/logs/${phoneNumber}`),

  // Get SMS statistics
  getStatistics: (startDate?: Date, endDate?: Date) => {
    let url = '/api/sms/statistics'
    if (startDate || endDate) {
      const query = new URLSearchParams()
      if (startDate) query.append('startDate', startDate.toISOString())
      if (endDate) query.append('endDate', endDate.toISOString())
      url += `?${query.toString()}`
    }
    return apiCall<{ success: boolean; statistics: any }>(url)
  },

  // Send bulk SMS
  sendBulk: (phoneNumbers: string[], message: string, type?: string) =>
    apiCall<{ success: boolean; message: string; result: any }>('/api/sms/send-bulk', {
      method: 'POST',
      body: JSON.stringify({ phoneNumbers, message, type }),
    }),

  // Resend SMS
  resendSMS: (phoneNumber: string, message: string, type?: string) =>
    apiCall<{ success: boolean; message: string; result: any }>('/api/sms/resend', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, message, type }),
    }),
}
