const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const rateLimit = require("express-rate-limit")
const helmet = require("helmet")
const detectPort = require('detect-port')
require("dotenv").config()

// Debug environment variables loading
console.log('🔍 Server Environment Variables Check:');
console.log('📝 NODE_ENV:', process.env.NODE_ENV);
console.log('📝 OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('📝 OPENAI_API_KEY length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 'undefined');
console.log('📝 OPENAI_API_KEY starts with sk-:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.startsWith('sk-') : 'undefined');

if (!process.env.JWT_SECRET) {
  console.warn("⚠️  JWT_SECRET is not set in the environment variables. Using default value for testing.");
  process.env.JWT_SECRET = "default-jwt-secret-for-testing-only";
}

const app = express()

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)

// Raw body middleware for Stripe webhooks
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }))

// JSON body middleware for all other routes
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
})
app.use("/api/", limiter)

// MongoDB connection will be handled in the server startup

// Import Routes
let authRoutes, userRoutes, adminRoutes, subscriptionRoutes, aiToolRoutes, analyticsRoutes, dashboardRoutes, stripeRoutes, openaiRoutes;

try {
  console.log('📁 Loading routes...');
  authRoutes = require("./routes/auth")
  userRoutes = require("./routes/users")
  adminRoutes = require("./routes/admin")
  subscriptionRoutes = require("./routes/subscriptions")
  aiToolRoutes = require("./routes/aiTools")
  analyticsRoutes = require("./routes/analytics")
  dashboardRoutes = require("./routes/dashboard")
  stripeRoutes = require("./routes/stripe")
  openaiRoutes = require("./routes/openai")
  console.log('✅ Routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  process.exit(1);
}

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/user", userRoutes) // Add this line to handle /api/user/notifications
app.use("/api/admin", require("./routes/admin"));
app.use("/api/subscriptions", subscriptionRoutes)
app.use("/api/ai-tools", aiToolRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/stripe", stripeRoutes)
app.use("/api/openai", openaiRoutes)

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" })
})

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000

console.log('🔧 About to start server startup process...');

(async () => {
  try {
    console.log('🚀 Starting server...');
    const freePort = await detectPort(DEFAULT_PORT);

    if (freePort !== DEFAULT_PORT) {
      console.log(`ℹ️ Port ${DEFAULT_PORT} was busy, switched to port ${freePort}`);
    } else {
      console.log(`✅ Port ${DEFAULT_PORT} is free`);
    }

    try {
      await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ MongoDB Connected');
    } catch (err) {
      console.error('❌ MongoDB connection error:', err.message);
      console.log('⚠️  Server will continue running without MongoDB connection');
    }

    app.listen(freePort, () => {
      console.log(`🚀 Server running on port ${freePort}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
    console.log('🎉 Server startup complete!');
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('❌ Error stack:', error.stack);
    process.exit(1);
  }
})();

console.log('🔧 Server startup process initiated...');

// Add unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});