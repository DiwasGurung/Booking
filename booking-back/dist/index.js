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
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.use(express_1.default.json());
app.use("/api/users", user_routes_1.default);
app.use("/api/booking", booking_routes_1.default);
app.use("/api/businesses", business_routes_1.default);
app.use("/api/customers", customer_routes_1.default);
app.use("/api/business-hours", businessHours_routes_1.default);
app.use("/api/notifications", notification_routes_1.default);
app.use("/api/payments", payment_routes_1.default);
app.use("/api/reviews", review_routes_1.default);
app.use("/api/services", service_routes_1.default);
// Handle preflight OPTIONS requests globally
app.options('/*', (0, cors_1.default)());
// Catch-all route (should be last)
app.use('/*', (req, res) => {
    res.status(404).send('Not Found');
});
// Start server
app.listen(5000, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
