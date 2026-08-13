// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes.js"; // Adjust path if needed
import bookingRoutes from "./routes/booking.routes.js";
import businessRoutes from "./routes/business.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import businessHoursRoutes from "./routes/businessHours.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import cookieParser from "cookie-parser";
import authRoutes from './routes/auth.routes.js'
import sseRoutes from "./routes/sse.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import seedRoutes from "./routes/seed.routes.js"
import pushSubscriptionRoutes from "./routes/push-subscription.route.js"
import staffRoutes from "./routes/staff.routes.js" 
import subscriptionPaymentRoutes from "./routes/subscription-payment.routes.js"
import uploadRoutes from "./routes/upload.routes.js"
import StaffAuthRoutes from "./routes/staff-auth.routes.js"
import staffVerificationRoutes from "./routes/staff-verification.routes.js"


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;



app.use(
  cors({
    origin: ['http://localhost:3000',
    'https://api.appoint-nepal.com',
    'https://appoint-nepal.com'],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, 
  })
);

app.use(cookieParser());

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running!");
});


app.use("/api/users", userRoutes);

app.use('/api/auth', authRoutes)

app.use("/api/sse", sseRoutes);


app.use("/api/booking", bookingRoutes);

app.use("/api/subscriptions", subscriptionRoutes);

app.use("/api/businesses", businessRoutes);

app.use("/api/customers", customerRoutes);

app.use("/api/business-hours", businessHoursRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/seed", seedRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/reviews", reviewRoutes);

app.use("/api/services", serviceRoutes);

app.use('/api/push-subscriptions', pushSubscriptionRoutes)

app.use("/api/staff", staffRoutes)

app.use("/api/staff-verification", staffVerificationRoutes)

app.use("/api/staff-auth", StaffAuthRoutes)

app.use("/api/subscription-payment", subscriptionPaymentRoutes)

app.use("/api/upload", uploadRoutes)


// Catch-all route (should be last)
app.use( (req, res) => {
  res.status(404).send('Not Found');
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});