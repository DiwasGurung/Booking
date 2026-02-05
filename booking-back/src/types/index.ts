export type UserRole = "CUSTOMER" | "BUSINESS_OWNER" | "ADMIN"
export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"
export type NotificationType =
  | "BOOKING_CONFIRMATION"
  | "BOOKING_REMINDER"
  | "BOOKING_CANCELLATION"
  | "PAYMENT_RECEIVED"
  | "NEW_REVIEW"
  | "APPOINTMENT_APPROACHING"

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
}
