// =============================================
// ✅ 1. Load environment variables FIRST
// =============================================
require('dotenv').config();

// =============================================
// ✅ 2. Import core modules
// =============================================
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// =============================================
// ✅ 3. Import local modules (AFTER dotenv)
// =============================================
const connectDB = require('./config/database');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const { mockAuth } = require('./middleware/auth'); // Switch to real auth later!

// =============================================
// 📧 EMAIL CONFIG CHECK
// =============================================
console.log("=== EMAIL CONFIG CHECK ===");
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "[HIDDEN]" : "❌ Missing");
console.log("===========================");

// =============================================
// 🚀 Initialize Express
// =============================================
const app = express();

// =============================================
// 🔗 Connect to Database
// =============================================
connectDB();

// =============================================
// 🧩 Safely Load Mongoose Models (prevents overwrite errors)
// =============================================
const User = mongoose.models.User || require('./models/User');
const Report = mongoose.models.Report || require('./models/Report');

// =============================================
// 🛡 Global Middleware
// =============================================
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan('dev'));

// =============================================
// 🚫 API Rate Limiting (Anti-DDoS / Spam Control)
// =============================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: "Too many requests. Please slow down."
});
app.use('/api', apiLimiter);

// =============================================
// 📝 Simple Request Logger
// =============================================
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// =============================================
// ❤️ Health Check Route
// =============================================
app.get('/api/health', (req, res) => {
  res.json({
    message: 'Community Connect API is running!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// =============================================
// 🔐 AUTH ROUTES
// =============================================
app.use('/api/auth', authRoutes);

// =============================================
// 📝 REPORT ROUTES (currently using mockAuth)
// Replace mockAuth with real JWT auth soon
// =============================================
app.use('/api/reports', mockAuth, reportRoutes);

// =============================================
// ⭐ ADMIN ROUTES (Protected)
// =============================================
app.use('/api/admin', mockAuth, adminRoutes);

// =============================================
// ❌ 404 Handler
// =============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// =============================================
// ⚠ Validation Error Handler (Mongoose)
// =============================================
app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors
    });
  }
  next(err);
});

// =============================================
// 🚨 Global Error Handler
// =============================================
app.use((err, req, res, next) => {
  console.error("🚨 Global Error Handler:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {}
  });
});

// =============================================
// 🔌 Graceful Shutdown
// =============================================
process.on("SIGINT", () => {
  mongoose.connection.close(() => {
    console.log("📴 MongoDB Disconnected on app termination");
    process.exit(0);
  });
});

// =============================================
// 🚀 Start Server
// =============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
🚀 Community Connect Backend Server Started!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📅 Started at: ${new Date().toISOString()}
  `);
});
