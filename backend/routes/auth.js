// routes/auth.js
const express = require('express');
const User = require('../models/User');
const { mockAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// POST /api/auth/sync - Sync Clerk user with our database (Enhanced version)
router.post('/sync', async (req, res) => {
  try {
    console.log('🔄 Syncing Clerk user with database...');
    console.log('📦 Clerk user data:', req.body);

    const { clerkUserId, email, username, name } = req.body;

    if (!clerkUserId || !email) {
      return res.status(400).json({
        success: false,
        message: 'clerkUserId and email are required'
      });
    }

    // Check if user already exists by clerkUserId or email
    let user = await User.findOne({ 
      $or: [
        { clerkUserId: clerkUserId },
        { email: email }
      ]
    });

    if (user) {
      console.log('✅ User already exists, updating...');
      
      // Update existing user with Clerk data
      user.clerkUserId = clerkUserId;
      user.email = email;
      if (username) user.username = username;
      if (name) user.name = name;
      user.lastSyncedAt = new Date();
      
      await user.save();
    } else {
      console.log('🆕 Creating new user from Clerk...');
      
      // Create new user
      user = new User({
        clerkUserId,
        email,
        username: username || email.split('@')[0],
        name: name || 'Community User',
        role: 'resident', // Default role
        isActive: true
      });

      await user.save();
    }

    // Prepare response
    const userResponse = {
      _id: user._id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    console.log('✅ User sync completed:', userResponse.email);
    
    res.json({
      success: true,
      message: 'User synced successfully',
      data: userResponse
    });

  } catch (error) {
    console.error('❌ Error syncing user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync user',
      error: error.message
    });
  }
});

// Keep your existing sync-user endpoint for backward compatibility
router.post('/sync-user', async (req, res) => {
  try {
    const { clerkUserId, email, username } = req.body;
    
    let user = await User.findOne({ 
      $or: [{ clerkUserId }, { email }] 
    });
    
    if (user) {
      user.clerkUserId = clerkUserId;
      user.username = username;
      await user.save();
    } else {
      user = new User({
        clerkUserId,
        email,
        username,
        role: 'resident'
      });
      await user.save();
    }
    
    res.json({
      success: true,
      message: 'User synced successfully',
      data: {
        id: user._id,
        clerkUserId: user.clerkUserId,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to sync user',
      error: error.message
    });
  }
});

// GET /api/auth/me - Get current user profile (Enhanced version)
router.get('/me', mockAuth, async (req, res) => {
  try {
    console.log('🔍 Fetching user profile for:', req.user._id);
    
    // Fetch fresh user data from database
    const user = await User.findById(req.user._id)
      .select('-password') // Exclude password
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ User profile found:', user.email);
    
    res.json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        isAdmin: user.role === 'admin',
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
});

// GET /api/auth/users - Get all users (Admin only)
router.get('/users', mockAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// PATCH /api/auth/promote/:userId - Promote user to admin (Enhanced version)
router.patch('/promote/:userId', mockAuth, requireAdmin, async (req, res) => {
  try {
    console.log('👑 Promoting user to admin:', req.params.userId);
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'User is already an admin'
      });
    }
    
    user.role = 'admin';
    user.updatedAt = new Date();
    await user.save();
    
    console.log('✅ User promoted to admin:', user.email);
    
    res.json({
      success: true,
      message: 'User promoted to admin successfully',
      data: {
        _id: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('❌ Error promoting user:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to promote user',
      error: error.message
    });
  }
});

// PATCH /api/auth/demote/:userId - Demote admin to resident (New endpoint)
router.patch('/demote/:userId', mockAuth, requireAdmin, async (req, res) => {
  try {
    console.log('👤 Demoting admin to resident:', req.params.userId);
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'User is not an admin'
      });
    }
    
    // Prevent demoting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot demote yourself'
      });
    }
    
    user.role = 'resident';
    user.updatedAt = new Date();
    await user.save();
    
    console.log('✅ Admin demoted to resident:', user.email);
    
    res.json({
      success: true,
      message: 'User demoted to resident successfully',
      data: {
        _id: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('❌ Error demoting user:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to demote user',
      error: error.message
    });
  }
});

// PATCH /api/auth/users/:userId/toggle-active - Toggle user active status (New endpoint)
router.patch('/users/:userId/toggle-active', mockAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent deactivating yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate yourself'
      });
    }
    
    user.isActive = !user.isActive;
    user.updatedAt = new Date();
    await user.save();
    
    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        _id: user._id,
        email: user.email,
        username: user.username,
        isActive: user.isActive
      }
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to toggle user status',
      error: error.message
    });
  }
});

module.exports = router;