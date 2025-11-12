// ✅ 1. Load environment variables FIRST
require('dotenv').config();

// ✅ 2. Import core modules
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// ✅ 3. Import your local modules (AFTER dotenv)
const connectDB = require('./config/database');
const adminRoutes = require('./routes/admin');
const emailService = require('./config/email'); // <-- IMPORTANT: after dotenv.config()


// Initialize Express
const app = express();

// Connect to Database
connectDB();

require('./models/User');
require('./models/Report');

// Middleware
app.use(cors({
  origin: true, // Your React app URL
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // For large image uploads later
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check with detailed info
app.get('/api/health', (req, res) => {
  res.json({
    message: 'Community Connect API is running!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ⭐⭐⭐ ADD AUTH ROUTES ⭐⭐⭐
app.use('/api/auth', require('./routes/auth'));

// ⭐⭐⭐ UPDATE REPORTS ROUTE TO INCLUDE AUTH ⭐⭐⭐
// Import the auth middleware
const { mockAuth } = require('./middleware/auth');
app.use('/api/reports', mockAuth, require('./routes/reports'));

// ⭐⭐⭐ ADD ADMIN ROUTES ⭐⭐⭐
app.use('/api/admin', mockAuth, adminRoutes);

// 404 handler for undefined routes
app.use( (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Global Error Handler:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
🚀 Community Connect Backend Server Started!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📅 Started at: ${new Date().toISOString()}
  `);
}); 