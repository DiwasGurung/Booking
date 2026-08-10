(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/ui/Input.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Input",
    ()=>Input
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
;
function Input({ className, type, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        type: type,
        "data-slot": "input",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm', 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]', 'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/Input.tsx",
        lineNumber: 6,
        columnNumber: 5
    }, this);
}
_c = Input;
;
var _c;
__turbopack_context__.k.register(_c, "Input");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/ui/card.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Card",
    ()=>Card,
    "CardAction",
    ()=>CardAction,
    "CardContent",
    ()=>CardContent,
    "CardDescription",
    ()=>CardDescription,
    "CardFooter",
    ()=>CardFooter,
    "CardHeader",
    ()=>CardHeader,
    "CardTitle",
    ()=>CardTitle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
;
function Card({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/card.tsx",
        lineNumber: 6,
        columnNumber: 5
    }, this);
}
_c = Card;
function CardHeader({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-header",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/card.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
_c1 = CardHeader;
function CardTitle({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-title",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('leading-none font-semibold', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/card.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
_c2 = CardTitle;
function CardDescription({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-description",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-muted-foreground text-sm', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/card.tsx",
        lineNumber: 42,
        columnNumber: 5
    }, this);
}
_c3 = CardDescription;
function CardAction({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-action",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/card.tsx",
        lineNumber: 52,
        columnNumber: 5
    }, this);
}
_c4 = CardAction;
function CardContent({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-content",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('px-6', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/card.tsx",
        lineNumber: 65,
        columnNumber: 5
    }, this);
}
_c5 = CardContent;
function CardFooter({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-footer",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex items-center px-6 [.border-t]:pt-6', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/card.tsx",
        lineNumber: 75,
        columnNumber: 5
    }, this);
}
_c6 = CardFooter;
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6;
__turbopack_context__.k.register(_c, "Card");
__turbopack_context__.k.register(_c1, "CardHeader");
__turbopack_context__.k.register(_c2, "CardTitle");
__turbopack_context__.k.register(_c3, "CardDescription");
__turbopack_context__.k.register(_c4, "CardAction");
__turbopack_context__.k.register(_c5, "CardContent");
__turbopack_context__.k.register(_c6, "CardFooter");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "apiCall",
    ()=>apiCall,
    "bookingsApi",
    ()=>bookingsApi,
    "businessApi",
    ()=>businessApi,
    "businessHoursApi",
    ()=>businessHoursApi,
    "notificationsApi",
    ()=>notificationsApi,
    "paymentApi",
    ()=>paymentApi,
    "servicesApi",
    ()=>servicesApi,
    "smsApi",
    ()=>smsApi,
    "staffApi",
    ()=>staffApi,
    "usersApi",
    ()=>usersApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const API_BASE_URL = ("TURBOPACK compile-time value", "http://localhost:5001") || 'http://localhost:5001';
async function apiCall(endpoint, options) {
    try {
        const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
        // Build headers
        const headers = {
            'Content-Type': 'application/json'
        };
        // Merge custom headers
        if (options?.headers) {
            Object.assign(headers, options.headers);
        }
        // Use credentials: 'include' to automatically send/receive HTTP-only cookies
        const response = await fetch(url, {
            headers,
            credentials: 'include',
            ...options
        });
        if (!response.ok) {
            const error = await response.json().catch(()=>({
                    message: response.statusText
                }));
            return {
                error: error.message || error.error || 'An error occurred',
                success: false
            };
        }
        const data = await response.json();
        return {
            data,
            success: true
        };
    } catch (error) {
        console.error('[v0] API error:', error);
        return {
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
            success: false
        };
    }
}
const usersApi = {
    // Register/Create new user
    signup: (data)=>apiCall('/api/users', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    // Login user
    login: (email, password)=>apiCall('/api/users/login', {
            method: 'POST',
            body: JSON.stringify({
                email,
                password
            })
        }),
    // Logout user
    logout: ()=>apiCall('/api/users/logout', {
            method: 'POST'
        }),
    // Update user profile (firstName, lastName, phone, avatar)
    updateProfile: (userId, data)=>apiCall(`/api/users/${userId}/profile`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    // Change user password
    changePassword: (userId, data)=>apiCall(`/api/users/${userId}/change-password`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    // Get current user info
    getCurrentUser: ()=>apiCall('/api/users/me', {
            method: 'GET',
            credentials: 'include'
        })
};
const servicesApi = {
    // Create a new service
    create: (data)=>apiCall('/api/services', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    // Get all services for a business
    getBusinessServices: (businessId)=>apiCall(`/api/services/business/${businessId}`),
    // Get active services for a business
    getActiveServices: (businessId)=>apiCall(`/api/services/business/${businessId}/active`),
    // Get service by ID
    getServiceById: (serviceId)=>apiCall(`/api/services/${serviceId}`),
    // Get services with stats
    withStats: (businessId)=>apiCall(`/api/services/business/${businessId}/stats`),
    // Update service
    update: (serviceId, data)=>apiCall(`/api/services/${serviceId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    // Delete service
    delete: (serviceId)=>apiCall(`/api/services/${serviceId}`, {
            method: 'DELETE'
        })
};
const businessHoursApi = {
    // Get all business hours for a business
    getBusinessHours: (businessId)=>apiCall(`/api/business-hours/business/${businessId}`),
    // Set/Update business hours for a specific day (upsert)
    setBusinessHours: (data)=>apiCall(`/api/business-hours`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    // Check if business is open
    isBusinessOpen: (businessId)=>apiCall(`/api/business-hours/business/${businessId}/is-open`),
    // Get hours for specific day
    getHoursForDay: (businessId, dayOfWeek)=>apiCall(`/api/business-hours/business/${businessId}/day/${dayOfWeek}`),
    // Get all closed dates for a business
    getClosedDates: (businessId)=>apiCall(`/api/business-hours/${businessId}/closed-dates`),
    // Add a closed date
    addClosedDate: (businessId, data)=>apiCall(`/api/business-hours/${businessId}/closed-dates`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    // Remove a closed date
    removeClosedDate: (businessId, dateId)=>apiCall(`/api/business-hours/${businessId}/closed-dates/${dateId}`, {
            method: 'DELETE'
        }),
    // Add a holiday
    addHoliday: (businessId, data)=>apiCall(`/api/business-hours/${businessId}/holidays`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    // Get all holidays for a business
    getHolidays: (businessId)=>apiCall(`/api/business-hours/${businessId}/holidays`),
    // Remove a holiday
    removeHoliday: (businessId, date)=>apiCall(`/api/business-hours/${businessId}/holidays/${date}`, {
            method: 'DELETE'
        }),
    // Add time off
    addTimeOff: (businessId, data)=>apiCall(`/api/business-hours/${businessId}/time-off`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    // Get time off periods
    getTimeOffs: (businessId, staffId)=>apiCall(`/api/business-hours/${businessId}/time-off${staffId ? `?staffId=${staffId}` : ''}`),
    // Remove time off
    removeTimeOff: (timeOffId)=>apiCall(`/api/business-hours/time-off/${timeOffId}`, {
            method: 'DELETE'
        })
};
const bookingsApi = {
    // ==================== STAFF INDIVIDUAL BOOKING ====================
    // Create a new booking for authenticated users (staff individual booking)
    createBooking: (data)=>apiCall('/api/booking', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    // Create a public booking for guests (staff individual booking)
    createPublicBooking: (data)=>apiCall('/api/booking/public', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    // ==================== BUSINESS BOOKING ====================
    // Create a business booking for authenticated users
    createBusinessBooking: (data)=>apiCall('/api/booking/business', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    // Create a public business booking for guests
    createBusinessPublicBooking: (data)=>apiCall('/api/booking/business/public', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    // ==================== SHARED METHODS ====================
    // Verify booking email (confirm booking)
    verifyBooking: (token)=>apiCall(`/api/booking/verify?token=${token}`, {
            method: 'POST'
        }),
    // Get a single booking by ID
    getBookingById: (bookingId)=>apiCall(`/api/booking/bookings/${bookingId}`),
    // Update booking information
    updateBooking: (bookingId, data)=>apiCall(`/api/booking/bookings/${bookingId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    // Update booking status with optional reason
    updateBookingStatus: (bookingId, status, reason)=>apiCall(`/api/booking/bookings/${bookingId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({
                status,
                reason
            })
        }),
    // Cancel a booking with optional reason
    cancelBooking: (bookingId, reason)=>apiCall(`/api/booking/bookings/${bookingId}/cancel`, {
            method: 'PATCH',
            body: JSON.stringify({
                reason
            })
        }),
    // Delete a booking
    deleteBooking: (bookingId)=>apiCall(`/api/booking/bookings/${bookingId}`, {
            method: 'DELETE'
        }),
    // Get all bookings for a specific business
    getBusinessBookings: (businessId, page = 1, limit = 10, status)=>{
        let url = `/api/booking/businesses/${businessId}/bookings?page=${page}&limit=${limit}`;
        if (status) {
            url += `&status=${status}`;
        }
        return apiCall(url);
    },
    // Get booking trends for a business
    getBookingTrends: (businessId)=>apiCall(`/api/booking/businesses/${businessId}/booking-trends`),
    // Get available slots for STAFF individual bookings (original method)
    getAvailableSlots: (businessId, serviceId, date, staffId)=>{
        let url = `/api/booking/businesses/${businessId}/services/${serviceId}/available-slots?date=${date}`;
        if (staffId) {
            url += `&staffId=${staffId}`;
        }
        return apiCall(url);
    },
    // Get available slots for BUSINESS bookings (checks staff availability and timeoffs)
    getBusinessAvailableSlots: (businessId, serviceId, date, staffId)=>{
        let url = `/api/booking/business/businesses/${businessId}/services/${serviceId}/available-slots?date=${date}`;
        if (staffId) {
            url += `&staffId=${staffId}`;
        }
        return apiCall(url);
    },
    // Get all bookings for a specific user/customer
    getCustomerBookings: (userId)=>apiCall(`/api/booking/users/${userId}/bookings`)
};
const businessApi = {
    // Create a new business
    create: (data)=>apiCall('/api/businesses', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    // Get all businesses
    getAll: ()=>apiCall('/api/businesses'),
    // Search businesses
    searchBusinesses: (query, limit = 10)=>apiCall(`/api/businesses/search?q=${encodeURIComponent(query)}&limit=${limit}`),
    // Get business by ID
    getBusinessById: (businessId)=>apiCall(`/api/businesses/${businessId}`),
    // Get business by user ID
    getByUserId: (userId)=>apiCall(`/api/businesses/user/${userId}`),
    // Update business
    update: (businessId, data)=>apiCall(`/api/businesses/${businessId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    // Delete business
    delete: (businessId)=>apiCall(`/api/businesses/${businessId}`, {
            method: 'DELETE'
        }),
    // Get business statistics
    getStats: (businessId)=>apiCall(`/api/businesses/${businessId}/stats`),
    // Get monthly revenue
    getMonthlyRevenue: (businessId, months = 6)=>apiCall(`/api/businesses/${businessId}/revenue?months=${months}`),
    // Get business analytics
    getAnalytics: (businessId, params)=>apiCall(`/api/businesses/${businessId}/analytics${params?.days ? `?days=${params.days}` : ''}`),
    // Get business settings
    getSettings: (businessId)=>apiCall(`/api/businesses/${businessId}/settings`),
    // Update business settings
    updateSettings: (businessId, data)=>apiCall(`/api/businesses/${businessId}/settings`, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
};
const notificationsApi = {
    // Create notification
    create: (data)=>apiCall('/api/notifications', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    // Get user notifications
    getUserNotifications: (userId)=>apiCall(`/api/notifications/user/${userId}`),
    // Get unread count
    getUnreadCount: (userId)=>apiCall(`/api/notifications/user/${userId}/unread-count`),
    // Mark all as read
    markAllAsRead: (userId)=>apiCall(`/api/notifications/user/${userId}/read-all`, {
            method: 'PUT'
        }),
    // Get notification by ID
    getById: (notificationId)=>apiCall(`/api/notifications/${notificationId}`),
    // Mark as read
    markAsRead: (notificationId)=>apiCall(`/api/notifications/${notificationId}/read`, {
            method: 'PUT'
        }),
    // Delete notification
    delete: (notificationId)=>apiCall(`/api/notifications/${notificationId}`, {
            method: 'DELETE'
        })
};
const paymentApi = {
    // Initiate payment with selected gateway (eSewa, Khalti, or Stripe)
    initiatePayment: (data)=>apiCall('/api/payments/initiate', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    // Verify Stripe payment after checkout
    verifyStripePayment: (paymentIntentId, paymentId)=>apiCall('/api/payments/stripe/verify', {
            method: 'POST',
            body: JSON.stringify({
                paymentIntentId,
                paymentId
            })
        }),
    // Verify Khalti payment
    verifyKhaltiPayment: (token, amount)=>apiCall('/api/payments/khalti/verify', {
            method: 'POST',
            body: JSON.stringify({
                token,
                amount
            })
        }),
    // Verify eSewa payment
    verifyEsewaPayment: (refId)=>apiCall('/api/payments/esewa/verify', {
            method: 'POST',
            body: JSON.stringify({
                refId
            })
        }),
    // Get payment details
    getPaymentDetails: (paymentId)=>apiCall(`/api/payments/${paymentId}`),
    // Get payment status
    getPaymentStatus: (paymentId)=>apiCall(`/api/payments/${paymentId}/status`),
    // Get subscription payment history
    getPaymentHistory: (subscriptionId, page = 1, limit = 10)=>apiCall(`/api/payments/subscription/${subscriptionId}/history?page=${page}&limit=${limit}`),
    // Get user's all payments
    getUserPayments: (userId, page = 1, limit = 10)=>apiCall(`/api/payments/user/${userId}/payments?page=${page}&limit=${limit}`),
    // Get business payments
    getBusinessPayments: (businessId, page = 1, limit = 10)=>apiCall(`/api/payments/business/${businessId}?page=${page}&limit=${limit}`),
    // Cancel pending payment
    cancelPayment: (paymentId)=>apiCall(`/api/payments/${paymentId}/cancel`, {
            method: 'PATCH',
            body: JSON.stringify({
                status: 'CANCELLED'
            })
        }),
    // Check if subscription is already paid
    checkSubscriptionPaymentStatus: (subscriptionId)=>apiCall(`/api/payments/subscription/${subscriptionId}/status`)
};
const staffApi = {
    // Create new staff member
    create: (data)=>apiCall('/api/staff', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    // Get staff by ID
    getById: (staffId)=>apiCall(`/api/staff/${staffId}`),
    // Get all staff for a business
    getBusinessStaff: (businessId, includeInactive = false)=>apiCall(`/api/staff/business/${businessId}?includeInactive=${includeInactive}`),
    // Get staff who can perform a specific service
    getStaffForService: (serviceId)=>apiCall(`/api/staff/service/${serviceId}`),
    // Update staff member
    update: (staffId, data)=>apiCall(`/api/staff/${staffId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    // Delete staff member
    delete: (staffId)=>apiCall(`/api/staff/${staffId}`, {
            method: 'DELETE'
        }),
    // Toggle staff active status
    toggleStatus: (staffId)=>apiCall(`/api/staff/${staffId}/toggle-status`, {
            method: 'PATCH'
        }),
    // Get staff availability for a specific date
    getAvailability: (staffId, date, duration)=>apiCall(`/api/staff/${staffId}/availability?date=${date}&duration=${duration}`),
    // Get staff statistics
    getStats: (staffId, startDate, endDate)=>{
        let url = `/api/staff/${staffId}/stats`;
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        return apiCall(url);
    },
    // Add time off for staff member
    addTimeOff: (staffId, data)=>apiCall(`/api/staff/${staffId}/time-off`, {
            method: 'POST',
            body: JSON.stringify(data)
        })
};
const smsApi = {
    // Send test SMS
    sendTest: (phoneNumber, message)=>apiCall('/api/sms/test', {
            method: 'POST',
            body: JSON.stringify({
                phoneNumber,
                message
            })
        }),
    // Get SMS logs
    getLogs: (params)=>{
        let url = '/api/sms/logs';
        if (params) {
            const query = new URLSearchParams();
            if (params.phoneNumber) query.append('phoneNumber', params.phoneNumber);
            if (params.type) query.append('type', params.type);
            if (params.status) query.append('status', params.status);
            if (params.limit) query.append('limit', params.limit.toString());
            if (params.offset) query.append('offset', params.offset.toString());
            if (query.toString()) url += `?${query.toString()}`;
        }
        return apiCall(url);
    },
    // Get logs by phone number
    getLogsByPhone: (phoneNumber)=>apiCall(`/api/sms/logs/${phoneNumber}`),
    // Get SMS statistics
    getStatistics: (startDate, endDate)=>{
        let url = '/api/sms/statistics';
        if (startDate || endDate) {
            const query = new URLSearchParams();
            if (startDate) query.append('startDate', startDate.toISOString());
            if (endDate) query.append('endDate', endDate.toISOString());
            url += `?${query.toString()}`;
        }
        return apiCall(url);
    },
    // Send bulk SMS
    sendBulk: (phoneNumbers, message, type)=>apiCall('/api/sms/send-bulk', {
            method: 'POST',
            body: JSON.stringify({
                phoneNumbers,
                message,
                type
            })
        }),
    // Resend SMS
    resendSMS: (phoneNumber, message, type)=>apiCall('/api/sms/resend', {
            method: 'POST',
            body: JSON.stringify({
                phoneNumber,
                message,
                type
            })
        })
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/book/[businessId]/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BookingPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/Input.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/Button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar.js [app-client] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check.js [app-client] (ecmascript) <export default as CheckCircle2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-client] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Briefcase$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/briefcase.js [app-client] (ecmascript) <export default as Briefcase>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [app-client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$authContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/context/authContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
;
function BookingPageContent() {
    _s();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$authContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const businessId = searchParams.businessId;
    const [services, setServices] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedService, setSelectedService] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [servicesLoading, setServicesLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [business, setBusiness] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Staff state
    const [staffMembers, setStaffMembers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedStaff, setSelectedStaff] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [staffLoading, setStaffLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [date, setDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [selectedTime, setSelectedTime] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [availableSlots, setAvailableSlots] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [customerName, setCustomerName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [customerEmail, setCustomerEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [customerPhone, setCustomerPhone] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [notes, setNotes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    // Pre-fill customer info from logged-in user
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BookingPageContent.useEffect": ()=>{
            if (user) {
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                setCustomerName(fullName);
                setCustomerEmail(user.email || '');
                setCustomerPhone(user.phone || '');
            }
        }
    }["BookingPageContent.useEffect"], [
        user
    ]);
    const [bookingSuccess, setBookingSuccess] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [bookingId, setBookingId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    // Redirect unauthenticated users to public booking page
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BookingPageContent.useEffect": ()=>{
            if (!businessId) return;
            if (!user && !loading) {
                router.push(`/book/${businessId}`);
            }
        }
    }["BookingPageContent.useEffect"], [
        businessId,
        user,
        loading,
        router
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BookingPageContent.useEffect": ()=>{
            if (!businessId) return;
            loadBusinessData();
        }
    }["BookingPageContent.useEffect"], [
        businessId
    ]);
    // Load staff when service is selected
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BookingPageContent.useEffect": ()=>{
            if (selectedService) {
                loadStaffForService(selectedService.id);
            } else {
                setStaffMembers([]);
                setSelectedStaff(null);
            }
        }
    }["BookingPageContent.useEffect"], [
        selectedService
    ]);
    // Load available slots when date and service are selected (staff is optional)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BookingPageContent.useEffect": ()=>{
            if (date && selectedService) {
                loadAvailableSlots();
            }
        }
    }["BookingPageContent.useEffect"], [
        date,
        selectedService
    ]);
    // Reload slots when staff selection changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BookingPageContent.useEffect": ()=>{
            if (date && selectedService) {
                loadAvailableSlots();
            }
        }
    }["BookingPageContent.useEffect"], [
        selectedStaff
    ]);
    const loadBusinessData = async ()=>{
        try {
            setServicesLoading(true);
            setError('');
            const [servicesRes, businessRes] = await Promise.all([
                __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["servicesApi"].getBusinessServices(businessId),
                __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["businessApi"].getBusinessById(businessId)
            ]);
            if (servicesRes.data) {
                let list = [];
                if (Array.isArray(servicesRes.data)) {
                    list = servicesRes.data;
                } else if (typeof servicesRes.data === 'object' && servicesRes.data !== null) {
                    const data = servicesRes.data;
                    list = data.services || data.data || [];
                }
                setServices(list);
            }
            if (businessRes.data) {
                if (typeof businessRes.data === 'object') {
                    setBusiness(businessRes.data);
                }
            }
        } catch (err) {
            console.error('[v0] Error loading business data:', err);
            setError('Failed to load business information. Please try again.');
        } finally{
            setServicesLoading(false);
        }
    };
    const loadStaffForService = async (serviceId)=>{
        try {
            setStaffLoading(true);
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["staffApi"].getStaffForService(serviceId);
            if (response.data?.staff) {
                setStaffMembers(response.data.staff);
                // Don't auto-select - staff selection is now optional
                setSelectedStaff(null);
            } else {
                setStaffMembers([]);
                setSelectedStaff(null);
            }
        } catch (err) {
            console.error('[v0] Error loading staff:', err);
            setStaffMembers([]);
            setSelectedStaff(null);
        } finally{
            setStaffLoading(false);
        }
    };
    // Load available slots for the selected service (staff is optional)
    const loadAvailableSlots = async ()=>{
        if (!selectedService || !date || !businessId) return;
        try {
            setLoading(true);
            console.log('[v0] Loading business available slots:', {
                businessId,
                serviceId: selectedService.id,
                date,
                staffId: selectedStaff?.id || 'any'
            });
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bookingsApi"].getBusinessAvailableSlots(businessId, selectedService.id, date, selectedStaff?.id);
            console.log('[v0] Business available slots response:', response);
            if (response.success) {
                // Handle nested response: response.data could be array or {data: array}
                let slots = [];
                if (Array.isArray(response.data)) {
                    slots = response.data;
                } else if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
                    slots = response.data.data;
                }
                console.log('[v0] Available slots:', slots);
                if (slots.length > 0) {
                    // Store time strings directly
                    setAvailableSlots(slots);
                    setError('');
                } else {
                    setAvailableSlots([]);
                    setError('No available slots for the selected date');
                }
            } else {
                console.log('[v0] Failed to load slots:', response.error);
                setAvailableSlots([]);
                setError(response.error || 'Unable to load available slots');
            }
        } catch (err) {
            console.error('[v0] Error loading slots:', err);
            setAvailableSlots([]);
            setError('Failed to load available slots');
        } finally{
            setLoading(false);
        }
    };
    const formatTimeSlot = (timeString)=>{
        try {
            // Handle both "HH:MM" format and ISO date strings
            let hours, minutes;
            if (timeString.includes('T') || timeString.includes(':') && timeString.length > 5) {
                // ISO date string like "2026-08-06T11:00:00"
                const date = new Date(timeString);
                hours = date.getHours();
                minutes = date.getMinutes();
            } else {
                // Simple time string like "11:00"
                const parts = timeString.split(':');
                hours = parseInt(parts[0], 10);
                minutes = parseInt(parts[1], 10);
            }
            // Format as 12-hour time
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
        } catch  {
            return timeString;
        }
    };
    const getDisplayTime = (timeString)=>{
        if (!timeString) return 'N/A';
        try {
            // Handle "HH:MM" format
            const parts = timeString.split(':');
            if (parts.length === 2) {
                const hours = parseInt(parts[0], 10);
                const minutes = parseInt(parts[1], 10);
                const period = hours >= 12 ? 'PM' : 'AM';
                const displayHours = hours % 12 || 12;
                return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
            }
            return timeString;
        } catch  {
            return timeString;
        }
    };
    const handleConfirmBooking = async ()=>{
        if (!selectedService || !date || !selectedTime) {
            setError('Please select service, date, and time');
            return;
        }
        // Only validate customer details for public users
        if (!user) {
            if (!customerName || !customerEmail || !customerPhone) {
                setError('Please fill in all required fields');
                return;
            }
        }
        try {
            setLoading(true);
            // Combine date string (YYYY-MM-DD) with time string (HH:MM) to create valid datetime
            const dateTimeString = `${date}T${selectedTime}:00`;
            const startTime = new Date(dateTimeString);
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + selectedService.duration);
            const basePayload = {
                serviceId: selectedService.id,
                businessId,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                notes
            };
            // Only include staffId if a staff member was specifically selected
            if (selectedStaff?.id) {
                basePayload.staffId = selectedStaff.id;
            }
            // Call the appropriate API method based on user type
            let response;
            if (user) {
                // Authenticated user - use createBusinessBooking
                response = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bookingsApi"].createBusinessBooking(basePayload);
            } else {
                // Public user - use createBusinessPublicBooking with customer details
                response = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bookingsApi"].createBusinessPublicBooking({
                    ...basePayload,
                    customerName,
                    customerEmail,
                    customerPhone
                });
            }
            console.log('[v0] Booking response:', response);
            if (response.success && response.data) {
                const bookingId = response.data.booking?.id || response.data.id || '';
                if (bookingId) {
                    setBookingId(bookingId);
                    setBookingSuccess(true);
                    setError('');
                } else {
                    setError('Booking created but no ID returned. Please contact support.');
                }
            } else {
                setError(response.error || 'Failed to create booking');
            }
        } catch (err) {
            console.error('[v0] Booking error:', err);
            setError('Failed to book appointment. Please try again.');
        } finally{
            setLoading(false);
        }
    };
    // Show loading during auth check
    if (loading || !businessId) {
        if (loading) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mx-auto max-w-2xl text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto mb-4"
                        }, void 0, false, {
                            fileName: "[project]/app/book/[businessId]/page.tsx",
                            lineNumber: 308,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-lg text-muted-foreground",
                            children: "Loading..."
                        }, void 0, false, {
                            fileName: "[project]/app/book/[businessId]/page.tsx",
                            lineNumber: 309,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/book/[businessId]/page.tsx",
                    lineNumber: 307,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/book/[businessId]/page.tsx",
                lineNumber: 306,
                columnNumber: 9
            }, this);
        }
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mx-auto max-w-2xl text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                        className: "w-12 h-12 text-destructive mx-auto mb-4"
                    }, void 0, false, {
                        fileName: "[project]/app/book/[businessId]/page.tsx",
                        lineNumber: 318,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-3xl font-bold text-foreground mb-2",
                        children: "Invalid Request"
                    }, void 0, false, {
                        fileName: "[project]/app/book/[businessId]/page.tsx",
                        lineNumber: 319,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-muted-foreground mb-6",
                        children: "No business selected for booking"
                    }, void 0, false, {
                        fileName: "[project]/app/book/[businessId]/page.tsx",
                        lineNumber: 320,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                        onClick: ()=>router.push('/search'),
                        children: "Browse Businesses"
                    }, void 0, false, {
                        fileName: "[project]/app/book/[businessId]/page.tsx",
                        lineNumber: 321,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/book/[businessId]/page.tsx",
                lineNumber: 317,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/book/[businessId]/page.tsx",
            lineNumber: 316,
            columnNumber: 7
        }, this);
    }
    if (bookingSuccess) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8 flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mx-auto w-full max-w-2xl",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                    className: "border border-border shadow-2xl",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-8 md:p-12 text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__["CheckCircle2"], {
                                            className: "w-12 h-12 text-primary"
                                        }, void 0, false, {
                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                            lineNumber: 336,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 335,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "text-4xl font-bold text-foreground mb-3",
                                        children: "Booking Confirmed!"
                                    }, void 0, false, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 338,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-lg text-muted-foreground",
                                        children: "Your appointment has been successfully booked"
                                    }, void 0, false, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 339,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                lineNumber: 334,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-8 mb-10 text-left",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-start gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-sm font-semibold text-foreground min-w-fit",
                                                    children: "Business:"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                    lineNumber: 346,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-sm text-foreground",
                                                    children: business?.name || 'N/A'
                                                }, void 0, false, {
                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                    lineNumber: 347,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                            lineNumber: 345,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-start gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-sm font-semibold text-foreground min-w-fit",
                                                    children: "Service:"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                    lineNumber: 350,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-sm text-foreground",
                                                    children: selectedService?.name || 'N/A'
                                                }, void 0, false, {
                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                    lineNumber: 351,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                            lineNumber: 349,
                                            columnNumber: 19
                                        }, this),
                                        selectedStaff && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-start gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-sm font-semibold text-foreground min-w-fit",
                                                    children: "Staff:"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                    lineNumber: 355,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-sm text-foreground",
                                                    children: [
                                                        selectedStaff.firstName,
                                                        " ",
                                                        selectedStaff.lastName
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                    lineNumber: 356,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                            lineNumber: 354,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "h-px bg-border my-1"
                                        }, void 0, false, {
                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                            lineNumber: 359,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-start gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-sm font-semibold text-foreground min-w-fit",
                                                    children: "Date:"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                    lineNumber: 361,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-sm text-foreground",
                                                    children: new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })
                                                }, void 0, false, {
                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                    lineNumber: 362,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                            lineNumber: 360,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-start gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-sm font-semibold text-foreground min-w-fit",
                                                    children: "Time:"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                    lineNumber: 372,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-sm text-foreground font-medium",
                                                    children: getDisplayTime(selectedTime || '')
                                                }, void 0, false, {
                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                    lineNumber: 373,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                            lineNumber: 371,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "h-px bg-border my-1"
                                        }, void 0, false, {
                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                            lineNumber: 375,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-start gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-sm font-semibold text-foreground min-w-fit",
                                                    children: "Booking ID:"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                    lineNumber: 377,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                                    className: "text-xs bg-secondary/50 px-3 py-2 rounded font-mono text-foreground cursor-pointer hover:bg-secondary transition-colors",
                                                    onClick: ()=>{
                                                        navigator.clipboard.writeText(bookingId);
                                                    },
                                                    title: "Click to copy",
                                                    children: bookingId
                                                }, void 0, false, {
                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                    lineNumber: 378,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                            lineNumber: 376,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                    lineNumber: 344,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                lineNumber: 343,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-3 mb-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                        onClick: ()=>router.push(`/bookings/${bookingId}`),
                                        variant: "outline",
                                        className: "w-full h-12 font-semibold",
                                        children: "View Booking Details"
                                    }, void 0, false, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 403,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                        onClick: ()=>window.location.href = `/bookings/${business?.id}`,
                                        className: "w-full h-12 bg-primary hover:bg-primary/90 font-semibold",
                                        children: "Book Another Service"
                                    }, void 0, false, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 410,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                lineNumber: 391,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "pt-6 border-t border-border",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-muted-foreground",
                                    children: [
                                        "A confirmation email has been sent to ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-semibold text-foreground",
                                            children: customerEmail
                                        }, void 0, false, {
                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                            lineNumber: 421,
                                            columnNumber: 57
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                    lineNumber: 420,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                lineNumber: 419,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/book/[businessId]/page.tsx",
                        lineNumber: 332,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/book/[businessId]/page.tsx",
                    lineNumber: 331,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/book/[businessId]/page.tsx",
                lineNumber: 330,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/book/[businessId]/page.tsx",
            lineNumber: 329,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto max-w-3xl",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-10 text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-4xl font-bold text-foreground mb-3",
                            children: business?.name || 'Book Your Appointment'
                        }, void 0, false, {
                            fileName: "[project]/app/book/[businessId]/page.tsx",
                            lineNumber: 435,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-lg text-muted-foreground",
                            children: "Select a service, date, staff (optional) and time"
                        }, void 0, false, {
                            fileName: "[project]/app/book/[businessId]/page.tsx",
                            lineNumber: 436,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/book/[businessId]/page.tsx",
                    lineNumber: 434,
                    columnNumber: 9
                }, this),
                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                    className: "border border-destructive/50 bg-destructive/5 mb-6",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-4 flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                className: "w-5 h-5 text-destructive flex-shrink-0"
                            }, void 0, false, {
                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                lineNumber: 442,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-foreground",
                                children: error
                            }, void 0, false, {
                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                lineNumber: 443,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/book/[businessId]/page.tsx",
                        lineNumber: 441,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/book/[businessId]/page.tsx",
                    lineNumber: 440,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                    className: "border border-border shadow-lg",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-8 md:p-10",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-sm font-semibold text-foreground mb-4 flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Briefcase$3e$__["Briefcase"], {
                                                className: "w-4 h-4 text-primary"
                                            }, void 0, false, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 453,
                                                columnNumber: 17
                                            }, this),
                                            "1. Select Service"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 452,
                                        columnNumber: 15
                                    }, this),
                                    servicesLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-center py-8",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"
                                        }, void 0, false, {
                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                            lineNumber: 459,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 458,
                                        columnNumber: 17
                                    }, this) : services.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-secondary/40 border border-border rounded-lg p-6 flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                                className: "w-5 h-5 text-destructive flex-shrink-0"
                                            }, void 0, false, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 463,
                                                columnNumber: 19
                                            }, this),
                                            "No services available"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 462,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid grid-cols-1 md:grid-cols-2 gap-3",
                                        children: services.map((service)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>{
                                                    setSelectedService(service);
                                                    setSelectedStaff(null);
                                                    setDate('');
                                                    setSelectedTime(null);
                                                },
                                                className: `p-4 rounded-lg border-2 text-left transition-all ${selectedService?.id === service.id ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-card text-foreground border-border hover:border-primary'}`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "font-semibold",
                                                        children: service.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                                        lineNumber: 483,
                                                        columnNumber: 23
                                                    }, this),
                                                    service.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm opacity-75 mt-1",
                                                        children: service.description
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                                        lineNumber: 484,
                                                        columnNumber: 47
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex justify-between items-center mt-2 text-xs opacity-75",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: [
                                                                    service.duration,
                                                                    " mins"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                lineNumber: 486,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "font-semibold",
                                                                children: service.offerPrice ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "line-through",
                                                                            children: [
                                                                                "Rs.",
                                                                                service.price.toFixed(2)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                            lineNumber: 489,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        " Rs.",
                                                                        service.offerPrice.toFixed(2)
                                                                    ]
                                                                }, void 0, true) : `Rs.${service.price.toFixed(2)}`
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                lineNumber: 487,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                                        lineNumber: 485,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, service.id, true, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 469,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 467,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                lineNumber: 451,
                                columnNumber: 13
                            }, this),
                            selectedService && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-sm font-semibold text-foreground mb-3 flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {
                                                className: "w-4 h-4 text-primary"
                                            }, void 0, false, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 505,
                                                columnNumber: 19
                                            }, this),
                                            "2. Select Date"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 504,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                        type: "date",
                                        value: date,
                                        onChange: (e)=>{
                                            setDate(e.target.value);
                                            setSelectedTime(null);
                                        },
                                        min: new Date().toISOString().split('T')[0],
                                        className: "h-12"
                                    }, void 0, false, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 508,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                lineNumber: 503,
                                columnNumber: 15
                            }, this),
                            selectedService && date && staffMembers.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-sm font-semibold text-foreground mb-4 flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                                className: "w-4 h-4 text-primary"
                                            }, void 0, false, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 525,
                                                columnNumber: 19
                                            }, this),
                                            "3. Select Staff ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs opacity-60",
                                                children: "(Optional)"
                                            }, void 0, false, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 526,
                                                columnNumber: 35
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 524,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "grid grid-cols-2 md:grid-cols-3 gap-3",
                                                children: staffMembers.map((staff)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>{
                                                            setSelectedStaff(staff);
                                                            setSelectedTime(null);
                                                        },
                                                        className: `p-4 rounded-lg border-2 text-center transition-all ${selectedStaff?.id === staff.id ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-card text-foreground border-border hover:border-primary'}`,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-2",
                                                                children: staff.avatar ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                                    src: staff.avatar,
                                                                    alt: staff.firstName,
                                                                    className: "w-12 h-12 rounded-full object-cover"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                    lineNumber: 546,
                                                                    columnNumber: 29
                                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                                                    className: "w-6 h-6"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                    lineNumber: 548,
                                                                    columnNumber: 29
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                lineNumber: 544,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "font-semibold text-sm",
                                                                children: [
                                                                    staff.firstName,
                                                                    " ",
                                                                    staff.lastName
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                lineNumber: 551,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xs opacity-75 mt-1",
                                                                children: staff.role
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                lineNumber: 552,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, staff.id, true, {
                                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                                        lineNumber: 532,
                                                        columnNumber: 23
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 530,
                                                columnNumber: 19
                                            }, this),
                                            selectedStaff && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>{
                                                    setSelectedStaff(null);
                                                    setSelectedTime(null);
                                                },
                                                className: "w-full py-2 px-4 rounded-lg border-2 border-border hover:border-primary text-sm font-medium transition-all text-muted-foreground hover:text-foreground",
                                                children: "Clear selection (system will auto-assign any available staff)"
                                            }, void 0, false, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 558,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 529,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                lineNumber: 523,
                                columnNumber: 15
                            }, this),
                            selectedService && date && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-sm font-semibold text-foreground mb-4 flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                                className: "w-4 h-4 text-primary"
                                            }, void 0, false, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 576,
                                                columnNumber: 19
                                            }, this),
                                            "4. Select Time"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 575,
                                        columnNumber: 17
                                    }, this),
                                    loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-center py-8",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"
                                        }, void 0, false, {
                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                            lineNumber: 582,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 581,
                                        columnNumber: 19
                                    }, this) : availableSlots.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-secondary/40 border border-border rounded-lg p-6 flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                                className: "w-5 h-5 text-destructive flex-shrink-0"
                                            }, void 0, false, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 586,
                                                columnNumber: 21
                                            }, this),
                                            "No available slots for this date",
                                            selectedStaff ? ` with ${selectedStaff.firstName}` : ''
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 585,
                                        columnNumber: 19
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid grid-cols-3 md:grid-cols-4 gap-2",
                                        children: availableSlots.map((slot, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>setSelectedTime(slot),
                                                className: `p-3 rounded-lg border-2 text-sm font-medium transition-all ${selectedTime === slot ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:border-primary'}`,
                                                children: formatTimeSlot(slot)
                                            }, idx, false, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 592,
                                                columnNumber: 23
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 590,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                lineNumber: 574,
                                columnNumber: 15
                            }, this),
                            selectedService && date && selectedTime && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-8 p-6 bg-secondary/20 rounded-lg border border-border",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between mb-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "font-semibold text-foreground",
                                                children: "5. Your Information"
                                            }, void 0, false, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 613,
                                                columnNumber: 19
                                            }, this),
                                            user && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs bg-primary/10 text-primary px-2 py-1 rounded",
                                                children: "Verified"
                                            }, void 0, false, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 614,
                                                columnNumber: 28
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 612,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "text-sm font-medium text-foreground mb-1 flex items-center gap-2",
                                                        children: [
                                                            "Full Name *",
                                                            user && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-xs bg-primary/10 text-primary px-2 py-0.5 rounded",
                                                                children: "(verified)"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                lineNumber: 620,
                                                                columnNumber: 32
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                                        lineNumber: 618,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                        type: "text",
                                                        placeholder: "Full Name *",
                                                        value: customerName,
                                                        onChange: user ? undefined : (e)=>setCustomerName(e.target.value),
                                                        disabled: !!user,
                                                        className: `h-11 ${user ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                                        lineNumber: 622,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 617,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "text-sm font-medium text-foreground mb-1 flex items-center gap-2",
                                                        children: [
                                                            "Email Address *",
                                                            user && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-xs bg-primary/10 text-primary px-2 py-0.5 rounded",
                                                                children: "(verified)"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                lineNumber: 634,
                                                                columnNumber: 32
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                                        lineNumber: 632,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                        type: "email",
                                                        placeholder: "Email Address *",
                                                        value: customerEmail,
                                                        onChange: user ? undefined : (e)=>setCustomerEmail(e.target.value),
                                                        disabled: !!user,
                                                        className: `h-11 ${user ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                                        lineNumber: 636,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 631,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "text-sm font-medium text-foreground mb-1",
                                                        children: "Phone Number *"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                                        lineNumber: 646,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                        type: "tel",
                                                        placeholder: "Phone Number *",
                                                        value: customerPhone,
                                                        onChange: user ? undefined : (e)=>setCustomerPhone(e.target.value),
                                                        disabled: !!user,
                                                        className: `h-11 ${user ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                                        lineNumber: 647,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 645,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                type: "email",
                                                placeholder: "Email Address *",
                                                value: customerEmail,
                                                onChange: user ? undefined : (e)=>setCustomerEmail(e.target.value),
                                                disabled: !!user,
                                                className: `h-11 ${user ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`
                                            }, void 0, false, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 656,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                type: "tel",
                                                placeholder: "Phone Number *",
                                                value: customerPhone,
                                                onChange: user ? undefined : (e)=>setCustomerPhone(e.target.value),
                                                disabled: !!user,
                                                className: `h-11 ${user ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`
                                            }, void 0, false, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 664,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                placeholder: "Notes (optional)",
                                                value: notes,
                                                onChange: (e)=>setNotes(e.target.value),
                                                className: "w-full p-3 border-2 border-border rounded-lg text-sm focus:border-primary focus:outline-none bg-background",
                                                rows: 3
                                            }, void 0, false, {
                                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                                lineNumber: 672,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 616,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                lineNumber: 611,
                                columnNumber: 15
                            }, this),
                            selectedService && date && selectedTime && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-start gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__["CheckCircle2"], {
                                            className: "w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                                        }, void 0, false, {
                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                            lineNumber: 687,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "font-semibold text-foreground mb-3",
                                                    children: "Booking Summary"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                    lineNumber: 689,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-2 text-sm",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex justify-between",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-muted-foreground",
                                                                    children: "Service:"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                    lineNumber: 692,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "font-medium",
                                                                    children: selectedService.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                    lineNumber: 693,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                                            lineNumber: 691,
                                                            columnNumber: 23
                                                        }, this),
                                                        selectedStaff && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex justify-between",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-muted-foreground",
                                                                    children: "Staff:"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                    lineNumber: 697,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "font-medium",
                                                                    children: [
                                                                        selectedStaff.firstName,
                                                                        " ",
                                                                        selectedStaff.lastName
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                    lineNumber: 698,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                                            lineNumber: 696,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex justify-between",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-muted-foreground",
                                                                    children: "Date:"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                    lineNumber: 702,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "font-medium",
                                                                    children: new Date(date).toLocaleDateString()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                    lineNumber: 703,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                                            lineNumber: 701,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex justify-between",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-muted-foreground",
                                                                    children: "Time:"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                    lineNumber: 706,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "font-medium",
                                                                    children: formatTimeSlot(selectedTime)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                    lineNumber: 707,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                                            lineNumber: 705,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex justify-between",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-muted-foreground",
                                                                    children: "Duration:"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                    lineNumber: 710,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "font-medium",
                                                                    children: [
                                                                        selectedService.duration,
                                                                        " min"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                    lineNumber: 711,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                                            lineNumber: 709,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex justify-between pt-2 border-t border-primary/20",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-muted-foreground",
                                                                    children: "Price:"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                    lineNumber: 714,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "font-bold text-primary",
                                                                    children: [
                                                                        "Rs.",
                                                                        (selectedService.offerPrice || selectedService.price).toFixed(2)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                                    lineNumber: 715,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                                            lineNumber: 713,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                                    lineNumber: 690,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/book/[businessId]/page.tsx",
                                            lineNumber: 688,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/book/[businessId]/page.tsx",
                                    lineNumber: 686,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                lineNumber: 685,
                                columnNumber: 15
                            }, this),
                            selectedService && date && selectedTime && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                        onClick: handleConfirmBooking,
                                        disabled: loading || !customerName || !customerEmail || !customerPhone,
                                        className: "flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90",
                                        children: loading ? 'Confirming...' : 'Confirm Booking'
                                    }, void 0, false, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 726,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                        onClick: ()=>setSelectedTime(null),
                                        variant: "outline",
                                        className: "px-6 h-12",
                                        children: "Clear"
                                    }, void 0, false, {
                                        fileName: "[project]/app/book/[businessId]/page.tsx",
                                        lineNumber: 733,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/book/[businessId]/page.tsx",
                                lineNumber: 725,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/book/[businessId]/page.tsx",
                        lineNumber: 449,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/book/[businessId]/page.tsx",
                    lineNumber: 448,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/book/[businessId]/page.tsx",
            lineNumber: 433,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/book/[businessId]/page.tsx",
        lineNumber: 432,
        columnNumber: 5
    }, this);
}
_s(BookingPageContent, "dBzn1kX33HjRBRMr4k+aTwblShM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$authContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = BookingPageContent;
function BookingPage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
        fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-center min-h-screen",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"
            }, void 0, false, {
                fileName: "[project]/app/book/[businessId]/page.tsx",
                lineNumber: 751,
                columnNumber: 88
            }, void 0)
        }, void 0, false, {
            fileName: "[project]/app/book/[businessId]/page.tsx",
            lineNumber: 751,
            columnNumber: 25
        }, void 0),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BookingPageContent, {}, void 0, false, {
            fileName: "[project]/app/book/[businessId]/page.tsx",
            lineNumber: 752,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/book/[businessId]/page.tsx",
        lineNumber: 751,
        columnNumber: 5
    }, this);
}
_c1 = BookingPage;
var _c, _c1;
__turbopack_context__.k.register(_c, "BookingPageContent");
__turbopack_context__.k.register(_c1, "BookingPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_a970cd29._.js.map