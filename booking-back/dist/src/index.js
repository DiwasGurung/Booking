"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.js
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_routes_1 = __importDefault(require("./routes/user.routes")); // Adjust path if needed
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const business_routes_1 = __importDefault(require("./routes/business.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const businessHours_routes_1 = __importDefault(require("./routes/businessHours.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const service_routes_1 = __importDefault(require("./routes/service.routes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const sse_routes_1 = __importDefault(require("./routes/sse.routes"));
const subscription_routes_1 = __importDefault(require("./routes/subscription.routes"));
const seed_routes_1 = __importDefault(require("./routes/seed.routes"));
const push_subscription_route_1 = __importDefault(require("./routes/push-subscription.route"));
const staff_routes_1 = __importDefault(require("./routes/staff.routes"));
const subscription_payment_routes_1 = __importDefault(require("./routes/subscription-payment.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const staff_auth_routes_1 = __importDefault(require("./routes/staff-auth.routes"));
const staff_verification_routes_1 = __importDefault(require("./routes/staff-verification.routes"));
const public_verification_routes_1 = __importDefault(require("./routes/public-verification.routes"));
const phone_verification_routes_1 = __importDefault(require("./routes/phone-verification.routes"));
const feedback_routes_1 = __importDefault(require("./routes/feedback.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'https://appoint-nepal.com',
        'https://www.appoint-nepal.com'
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "5mb" }));
app.use(express_1.default.urlencoded({ limit: "5mb", extended: true }));
app.get("/", (req, res) => {
    res.send("Backend is running!");
});
app.use("/api/users", user_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use("/api/sse", sse_routes_1.default);
app.use("/api/feedback", feedback_routes_1.default);
app.use("/api/booking", booking_routes_1.default);
app.use("/api/subscriptions", subscription_routes_1.default);
app.use("/api/businesses", business_routes_1.default);
app.use("/api/customers", customer_routes_1.default);
app.use("/api/business-hours", businessHours_routes_1.default);
app.use("/api/notifications", notification_routes_1.default);
app.use("/api/seed", seed_routes_1.default);
app.use("/api/payments", payment_routes_1.default);
app.use("/api/reviews", review_routes_1.default);
app.use("/api/services", service_routes_1.default);
app.use("/api/public-verification", public_verification_routes_1.default);
app.use("/api/phone-verification", phone_verification_routes_1.default);
app.use('/api/push-subscriptions', push_subscription_route_1.default);
app.use("/api/staff", staff_routes_1.default);
app.use("/api/staff-verification", staff_verification_routes_1.default);
app.use("/api/staff-auth", staff_auth_routes_1.default);
app.use("/api/subscription-payment", subscription_payment_routes_1.default);
app.use("/api/upload", upload_routes_1.default);
// Catch-all route (should be last)
app.use((req, res) => {
    res.status(404).send('Not Found');
});
app.listen(PORT, () => {
    // emailService.verifyTransporter()
    //   .then(({ host, port, user }) => console.log(`[Email Service] SMTP ready: ${host}:${port} (${user})`))
    //   .catch((error: any) => console.error('[Email Service] SMTP verification failed:', {
    //     code: error.code,
    //     responseCode: error.responseCode,
    //     command: error.command,
    //     message: error.message,
    //   }))
});
