// routes/auth.js
const express = require('express');
const User = require('../models/User');
const { mockAuth, requireAdmin } = require('../middleware/auth'); // Import from middleware
const router = express.Router();

// Mock user registration/sync endpoint
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

// Get current user profile
router.get('/me', mockAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.user._id,
        email: req.user.email,
        username: req.user.username,
        role: req.user.role,
        isAdmin: req.user.isAdmin()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
});

// Admin only: Promote user to admin
router.patch('/promote/:userId', mockAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.role = 'admin';
    await user.save();
    
    res.json({
      success: true,
      message: 'User promoted to admin successfully',
      data: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to promote user',
      error: error.message
    });
  }
});

module.exports = router;