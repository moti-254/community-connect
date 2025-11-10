const express = require('express');
const Report = require('../models/Report');
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes in this file require admin privileges
router.use(requireAdmin);

// GET /api/admin/stats - Dashboard overview statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Admin accessing dashboard stats');
    
    const stats = await Report.aggregate([
      {
        $facet: {
          statusSummary: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          categorySummary: [
            { $group: { _id: '$category', count: { $sum: 1 } } }
          ],
          prioritySummary: [
            { $group: { _id: '$priority', count: { $sum: 1 } } }
          ],
          recentActivity: [
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            { 
              $project: {
                title: 1,
                status: 1,
                category: 1,
                priority: 1,
                createdAt: 1,
                'createdBy.username': 1
              }
            }
          ],
          reportsByDay: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: -1 } },
            { $limit: 7 }
          ]
        }
      }
    ]);

    const userStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Get reports with images count
    const reportsWithImages = await Report.countDocuments({
      'images.0': { $exists: true }
    });

    // Get today's reports
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const reportsToday = await Report.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    res.json({
      success: true,
      data: {
        reports: stats[0],
        users: userStats,
        summary: {
          totalReports: await Report.countDocuments(),
          totalUsers: await User.countDocuments(),
          reportsToday: reportsToday,
          reportsWithImages: reportsWithImages,
          percentageWithImages: Math.round((reportsWithImages / (await Report.countDocuments()) * 100)) || 0
        }
      },
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role
      }
    });

  } catch (error) {
    console.error('❌ Error in admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics',
      error: error.message
    });
  }
});

// GET /api/admin/reports - All reports with admin filters
router.get('/reports', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      category, 
      priority,
      assigned,
      hasImages,
      search 
    } = req.query;
    
    console.log('📋 Admin accessing reports with filters:', req.query);

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    
    if (assigned === 'true') filter.assignedTo = { $exists: true, $ne: null };
    if (assigned === 'false') filter.assignedTo = { $eq: null };
    
    if (hasImages === 'true') filter['images.0'] = { $exists: true };
    if (hasImages === 'false') filter.images = { $size: 0 };
    
    // Text search
    if (search && search.trim().length > 0) {
      filter.$text = { $search: search.trim() };
    }

    const reports = await Report.find(filter)
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Report.countDocuments(filter);

    res.json({
      success: true,
      data: reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalReports: total,
        pageSize: parseInt(limit)
      },
      filters: {
        status, category, priority, assigned, hasImages, search
      }
    });

  } catch (error) {
    console.error('❌ Error in admin reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin reports',
      error: error.message
    });
  }
});

// GET /api/admin/users - User management
router.get('/users', async (req, res) => {
  try {
    console.log('👥 Admin accessing user management');
    
    const users = await User.find()
      .select('-clerkUserId') // Exclude sensitive fields
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
      total: users.length
    });

  } catch (error) {
    console.error('❌ Error in admin users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// PATCH /api/admin/users/:id/role - Update user role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!['resident', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "resident" or "admin"'
      });
    }

    // Prevent self-demotion
    if (userId === req.user._id.toString() && role === 'resident') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role to resident'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-clerkUserId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: user
    });

  } catch (error) {
    console.error('❌ Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
});

module.exports = router;