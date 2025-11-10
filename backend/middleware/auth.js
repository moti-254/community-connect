// middleware/auth.js
const User = require('../models/User');

const mockAuth = async (req, res, next) => {
  try {
    console.log('\n=== 🔐 AUTH MIDDLEWARE STARTED ===');
    console.log('📨 Request Details:');
    console.log('   Method:', req.method);
    console.log('   URL:', req.url);
    console.log('   Path:', req.path);
    console.log('   Headers Received:', Object.keys(req.headers));
    
    // Check all possible header variations
    const mockUserId = req.headers['x-user-id'] || 
                      req.headers['X-User-Id'] || 
                      req.headers['X-User-ID'] ||
                      req.headers['user-id'] ||
                      req.headers['User-Id'] ||
                      req.headers['authorization'] ||
                      req.headers['Authorization'];
    
    console.log('🔍 Header Check Results:');
    console.log('   x-user-id:', req.headers['x-user-id'] || 'NOT FOUND');
    console.log('   X-User-Id:', req.headers['x-user-id'] || 'NOT FOUND');
    console.log('   user-id:', req.headers['user-id'] || 'NOT FOUND');
    console.log('   authorization:', req.headers['authorization'] || 'NOT FOUND');
    console.log('   ➡️ Final Extracted User ID:', mockUserId || 'NO ID FOUND');
    
    if (!mockUserId) {
      console.log('❌ AUTH FAILED: No user ID found in any header');
      console.log('📋 All headers received:');
      Object.keys(req.headers).forEach(header => {
        console.log(`   ${header}: ${req.headers[header]}`);
      });
      
      return res.status(401).json({
        success: false,
        message: 'Authentication required - Please include x-user-id header',
        details: 'No user ID found in request headers',
        availableHeaders: Object.keys(req.headers),
        expectedHeader: 'x-user-id',
        example: 'x-user-id: 690a4ceeabe667c58e84d738'
      });
    }

    console.log('🔎 Database Lookup:');
    console.log('   Searching for user with ID:', mockUserId);
    
    const user = await User.findById(mockUserId);
    
    if (!user) {
      console.log('❌ AUTH FAILED: User not found in database');
      console.log('   Attempted to find user with ID:', mockUserId);
      console.log('   This ID might be invalid or user was deleted');
      
      return res.status(401).json({
        success: false,
        message: 'User not found - Invalid user ID',
        details: `No user found with ID: ${mockUserId}`,
        suggestion: 'Run node scripts/createTestUsers.js to create test users'
      });
    }
    
    if (!user.isActive) {
      console.log('❌ AUTH FAILED: User account is inactive');
      console.log('   User:', user.email, 'ID:', user._id);
      
      return res.status(401).json({
        success: false,
        message: 'User account is inactive',
        details: 'Please contact administrator'
      });
    }
    
    console.log('✅ USER FOUND:');
    console.log('   User ID:', user._id);
    console.log('   Email:', user.email);
    console.log('   Username:', user.username);
    console.log('   Role:', user.role);
    console.log('   Active:', user.isActive);
    
    // Attach user to request
    req.user = user;
    
    console.log('✅ AUTH SUCCESSFUL:');
    console.log('   User attached to req.user');
    console.log('   Proceeding to route handler...');
    console.log('=== 🔐 AUTH MIDDLEWARE COMPLETED ===\n');
    
    next();
  } catch (error) {
    console.error('🚨 AUTH MIDDLEWARE ERROR:');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
    
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
};

// Authorization middleware - Admin only
const requireAdmin = (req, res, next) => {
  console.log('\n=== 👮 ADMIN CHECK STARTED ===');
  console.log('   Checking if user is admin...');
  console.log('   User Role:', req.user?.role);
  console.log('   User Email:', req.user?.email);
  
  if (!req.user.isAdmin()) {
    console.log('❌ ADMIN CHECK FAILED: User is not admin');
    console.log('   Current role:', req.user.role);
    console.log('   Required role: admin');
    console.log('=== 👮 ADMIN CHECK FAILED ===\n');
    
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      details: `Your role: ${req.user.role}, Required: admin`
    });
  }
  
  console.log('✅ ADMIN CHECK PASSED: User has admin privileges');
  console.log('=== 👮 ADMIN CHECK COMPLETED ===\n');
  next();
};

module.exports = {
  mockAuth,
  requireAdmin
};