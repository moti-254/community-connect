const express = require('express');
const Report = require('../models/Report');
const {
   
  sendNewReportNotification, 
  sendStatusUpdateNotification,
  sendReportResolvedNotification 
} = require('../config/email');
const { upload, handleUploadErrors } = require('../middleware/upload');
const { deleteImageFromCloudinary } = require('../utils/cloudinary-cleanup');
const { generateOptimizedVersions } = require('../middleware/image-optimizer');
const router = express.Router();

// Input validation middleware - UPDATED VERSION
const validateReportInput = (req, res, next) => {
  console.log('🔍 Validating report input...');
  console.log('📦 Raw request body:', req.body);
  
  let location;
  
  try {
    // Parse location if it's a JSON string (from FormData)
    if (typeof req.body.location === 'string') {
      console.log('🔄 Parsing location from JSON string...');
      location = JSON.parse(req.body.location);
      // Replace the string with parsed object for the route handler
      req.body.location = location;
    } else {
      location = req.body.location;
    }
    
    console.log('📍 Parsed location:', location);
  } catch (error) {
    console.error('❌ Error parsing location:', error);
    return res.status(400).json({
      success: false,
      message: 'Invalid location format',
      errors: ['Location must be a valid JSON object']
    });
  }

  const { title, description, category } = req.body;
  
  const errors = [];
  
  // Basic field validation
  if (!title || title.trim().length === 0) errors.push('Title is required');
  if (!description || description.trim().length === 0) errors.push('Description is required');
  if (!category) errors.push('Category is required');
  
  // Location validation with parsed data
  if (!location || !location.address || location.address.trim().length === 0) {
    errors.push('Location address is required');
  }
  
  if (!location || !location.coordinates) {
    errors.push('Valid coordinates are required');
  } else if (!location.coordinates.latitude || !location.coordinates.longitude) {
    errors.push('Both latitude and longitude coordinates are required');
  } else if (typeof location.coordinates.latitude !== 'number' || typeof location.coordinates.longitude !== 'number') {
    errors.push('Coordinates must be valid numbers');
  } else if (location.coordinates.latitude === 0 && location.coordinates.longitude === 0) {
    errors.push('Valid coordinates are required (cannot be 0,0)');
  }

  console.log('📋 Validation errors found:', errors);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  console.log('✅ Validation passed');
  next();
};

// GET /api/reports - Advanced filtering, search, and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      // Basic filters
      status, 
      category, 
      priority,
      
      // Pagination
      page = 1, 
      limit = 10,
      
      // Sorting
      sortBy = 'createdAt',
      sortOrder = 'desc',
      
      // ⭐ NEW: Advanced search
      search, // Text search
      dateFrom, 
      dateTo, // Date range
      
      // ⭐ NEW: Location-based filtering
      radius, // in kilometers
      latitude,
      longitude,
      
      // ⭐ NEW: Advanced filters
      hasImages, // boolean - reports with images
      assigned, // boolean - assigned reports
      daysOld, // reports created in last X days
      
    } = req.query;
    
    console.log('🔍 Advanced search filters:', req.query);
    
    // Build filter object
    const filter = {};
    
    // Basic filters
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    
    // User-based filtering (residents see only their reports)
    if (!req.user.isAdmin()) {
      filter.createdBy = req.user._id;
    }
    
    // ⭐ NEW: Text search across multiple fields
    if (search && search.trim().length > 0) {
      filter.$text = { $search: search.trim() };
      console.log('🔍 Text search activated for:', search);
    }
    
    // ⭐ NEW: Date range filtering
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
        console.log('📅 Date from:', dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
        console.log('📅 Date to:', dateTo);
      }
    }
    
    // ⭐ NEW: Days old filter
    if (daysOld) {
      const days = parseInt(daysOld);
      if (!isNaN(days) && days > 0) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        filter.createdAt = { ...filter.createdAt, $gte: startDate };
        console.log('⏰ Days old filter:', days, 'days');
      }
    }
    
    // ⭐ NEW: Has images filter
    if (hasImages === 'true') {
      filter['images.0'] = { $exists: true }; // At least one image
      console.log('🖼️ Filter: Reports with images');
    } else if (hasImages === 'false') {
      filter.images = { $size: 0 }; // No images
      console.log('🖼️ Filter: Reports without images');
    }
    
    // ⭐ NEW: Assigned reports filter
    if (assigned === 'true') {
      filter.assignedTo = { $exists: true, $ne: null };
      console.log('👤 Filter: Assigned reports');
    } else if (assigned === 'false') {
      filter.assignedTo = { $eq: null };
      console.log('👤 Filter: Unassigned reports');
    }
    
    // Build sort object
    const sort = {};
    let textScoreSort = {};
    
    // ⭐ NEW: If text search is active, include text score in sorting
    if (search && search.trim().length > 0) {
      textScoreSort = { score: { $meta: 'textScore' } };
    }
    
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Combine text score sorting with regular sorting
    const finalSort = { ...textScoreSort, ...sort };
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // ⭐ NEW: Build query with text search projection
    let query = Report.find(filter)
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email')
      .sort(finalSort)
      .limit(parseInt(limit))
      .skip(skip);
    
    // Add text score projection if searching
    if (search && search.trim().length > 0) {
      query = query.select({ score: { $meta: 'textScore' } });
    }
    
    console.log('📊 Executing query with filter:', JSON.stringify(filter, null, 2));
    
    const reports = await query;
    const total = await Report.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));
    
    // ⭐ NEW: Build comprehensive response with search metadata
    const response = {
      success: true,
      data: reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalReports: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        pageSize: parseInt(limit)
      },
      search: {
        query: search || null,
        resultsCount: reports.length,
        totalMatches: total
      },
      filters: {
        status,
        category,
        priority,
        dateFrom,
        dateTo,
        hasImages,
        assigned,
        daysOld
      },
      userRole: req.user.role
    };
    
    console.log(`✅ Search completed: ${reports.length} results out of ${total} total`);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error in advanced search:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
});

// GET /api/reports/search/suggestions - Get search suggestions
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        data: {
          categories: [],
          statuses: [],
          commonSearches: []
        }
      });
    }
    
    const searchRegex = new RegExp(query, 'i');
    
    // Get matching categories
    const categories = await Report.distinct('category', {
      category: searchRegex,
      ...(!req.user.isAdmin() ? { createdBy: req.user._id } : {})
    });
    
    // Get matching statuses
    const statuses = await Report.distinct('status', {
      status: searchRegex,
      ...(!req.user.isAdmin() ? { createdBy: req.user._id } : {})
    });
    
    // Get recent similar searches from report titles
    const titleMatches = await Report.find({
      title: searchRegex,
      ...(!req.user.isAdmin() ? { createdBy: req.user._id } : {})
    })
    .select('title')
    .limit(5)
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        categories,
        statuses,
        titleSuggestions: titleMatches.map(r => r.title),
        query: query
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting search suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search suggestions',
      error: error.message
    });
  }
});

// GET /api/reports/stats/overview - Get searchable statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const baseFilter = !req.user.isAdmin() ? { createdBy: req.user._id } : {};
    
    const stats = await Report.aggregate([
      { $match: baseFilter },
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byCategory: [
            { $group: { _id: '$category', count: { $sum: 1 } } }
          ],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } }
          ],
          withImages: [
            { $match: { 'images.0': { $exists: true } } },
            { $count: 'count' }
          ],
          assigned: [
            { $match: { assignedTo: { $exists: true, $ne: null } } },
            { $count: 'count' }
          ],
          recent: [
            { 
              $match: { 
                createdAt: { 
                  $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
                } 
              } 
            },
            { $count: 'count' }
          ]
        }
      }
    ]);
    
    const result = stats[0];
    
    res.json({
      success: true,
      data: {
        byStatus: result.byStatus,
        byCategory: result.byCategory,
        byPriority: result.byPriority,
        withImages: result.withImages[0]?.count || 0,
        assigned: result.assigned[0]?.count || 0,
        recent: result.recent[0]?.count || 0,
        total: result.byStatus.reduce((sum, item) => sum + item.count, 0)
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting stats overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

// GET /api/reports/stats - Get report statistics quickly
router.get('/stats/summary', async (req, res) => {
  try {
    // ⭐ ENHANCED: Add user-based filtering
    const baseFilter = !req.user.isAdmin() ? { createdBy: req.user._id } : {};
    
    const stats = await Report.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const categoryStats = await Report.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalReports = await Report.countDocuments(baseFilter);
    const recentReports = await Report.countDocuments({
      ...baseFilter,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    // ⭐ NEW: Add reports with images count
    const reportsWithImages = await Report.countDocuments({
      ...baseFilter,
      'images.0': { $exists: true }
    });
    
    res.json({
      success: true,
      data: {
        byStatus: stats,
        byCategory: categoryStats,
        totals: {
          all: totalReports,
          recent: recentReports,
          withImages: reportsWithImages,
          percentageWithImages: totalReports > 0 ? Math.round((reportsWithImages / totalReports) * 100) : 0
        }
      },
      userRole: req.user.role
    });
    
  } catch (error) {
    console.error('❌ Error in stats summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// GET /api/reports/:id - Get single report
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email');
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    res.json({
      success: true,
      data: report
    });
    
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error.message
    });
  }
});

// GET /api/reports/:id/images - Get all images for a report with optimized versions
router.get('/:id/images', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).select('images title');
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    // Generate optimized URLs for each image
    const imagesWithOptimized = await Promise.all(
      report.images.map(async (image) => {
        const optimized = await generateOptimizedVersions(image.publicId);
        return {
          ...image.toObject(),
          optimized: optimized || {}
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        reportTitle: report.title,
        images: imagesWithOptimized,
        total: report.images.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching images:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to fetch images',
      error: error.message
    });
  }
});

// GET /api/reports/:reportId/images/:imageIndex - Get specific image with all formats
router.get('/:reportId/images/:imageIndex', async (req, res) => {
  try {
    const { reportId, imageIndex } = req.params;
    const index = parseInt(imageIndex);
    
    const report = await Report.findById(reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    if (index < 0 || index >= report.images.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image index'
      });
    }
    
    const image = report.images[index];
    const optimized = await generateOptimizedVersions(image.publicId);
    
    res.json({
      success: true,
      data: {
        original: image,
        optimized: optimized || {},
        availableFormats: ['original', 'webp', 'avif', 'thumbnail']
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching image:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to fetch image',
      error: error.message
    });
  }
});


// POST /api/reports - Create new report
router.post('/', 
  upload.array('images', 5), // ⭐⭐⭐ ADD THIS LINE - handles file upload
  handleUploadErrors,        // ⭐⭐⭐ ADD THIS LINE - error handling
  validateReportInput, 
  async (req, res) => {
  try {
    console.log('🎯 POST /api/reports route reached!');
    console.log('📋 Request body:', req.body);
    console.log('👤 Authenticated user:', req.user._id);
    console.log('📁 Uploaded files:', req.files); // ⭐⭐⭐ ADD THIS - see uploaded files

    // ⭐⭐⭐ PROCESS UPLOADED IMAGES
    const images = req.files ? req.files.map(file => ({
      url: file.path,        // Cloudinary URL
      publicId: file.filename, // Cloudinary public ID
      uploadedAt: new Date()
    })) : [];

    console.log('🖼️ Processed images:', images);

    // ⭐⭐⭐ Use the authenticated user's ID from middleware
    const reportData = {
      ...req.body,
      createdBy: req.user._id, // From auth middleware
      images: images           // ⭐⭐⭐ ADD IMAGES TO REPORT DATA
    };

    console.log('💾 Creating report with data:', reportData);
    
    console.log('🔍 About to create Report instance...');
    const report = new Report(reportData);

    console.log('🔍 About to save report to database...');
    await report.save();

    console.log('✅ Report saved successfully:', report._id);
    console.log('📸 Images saved:', report.images.length);
    
    console.log('🔍 About to populate user data...');
    // Populate the response with user data
    await report.populate('createdBy', 'username email');

    // ⭐ NEW: Send email notification to admins (in background, don't wait)
    sendNewReportNotification(report)
      .then(() => console.log('✅ Email notification processed'))
      .catch(emailError => console.error('❌ Email notification failed:', emailError));
    
    console.log('🔍 Sending success response...');
    res.status(201).json({
      success: true,
      message: `Report created successfully ${images.length > 0 ? 'with ' + images.length + ' images' : ''}`,
      data: report,
      userRole: req.user.role, // Include user role in response
      imagesCount: images.length // ⭐⭐⭐ ADD IMAGE COUNT
    });

    console.log('✅ Response sent successfully!');
    
  } catch (error) {
    console.error('❌ Error creating report:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create report',
      error: error.message
    });
  }
});

// POST /api/reports/:id/images - Add more images to existing report
router.post('/:id/images', 
  upload.array('images', 5),
  handleUploadErrors,
  async (req, res) => {
  try {
    console.log('🖼️ Adding images to report:', req.params.id);
    
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    // Authorization check
    if (!req.user.canModifyReport(report)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this report'
      });
    }
    
    const newImages = req.files ? req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
      uploadedAt: new Date()
    })) : [];
    
    report.images.push(...newImages);
    report.updatedAt = new Date();
    await report.save();
    
    console.log('✅ Added', newImages.length, 'images to report');
    
    res.json({
      success: true,
      message: `Added ${newImages.length} images successfully`,
      data: {
        newImages,
        totalImages: report.images.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error adding images:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to add images',
      error: error.message
    });
  }
});

// DELETE /api/reports/:reportId/images/:imageIndex - Remove specific image
router.delete('/:reportId/images/:imageIndex', async (req, res) => {
  try {
    const { reportId, imageIndex } = req.params;
    const index = parseInt(imageIndex);
    
    const report = await Report.findById(reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    // Authorization check
    if (!req.user.canModifyReport(report)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this report'
      });
    }
    
    if (index < 0 || index >= report.images.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image index'
      });
    }
    
    const removedImage = report.images[index];

    // ⭐ NEW: Delete from Cloudinary first
    const cloudinaryDeleteSuccess = await deleteImageFromCloudinary(removedImage.publicId);
    
    // Remove from array
    report.images.splice(index, 1);
    report.updatedAt = new Date();
    await report.save();
    
    
    
    res.json({
      success: true,
      message: `Image removed successfully ${cloudinaryDeleteSuccess ? '(and deleted from Cloudinary)' : '(Cloudinary deletion failed)'}`,
      data: {
        removedImage,
        cloudinaryDeleted: cloudinaryDeleteSuccess,
        remainingImages: report.images.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error removing image:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to remove image',
      error: error.message
    });
  }
});

// NEW: Bulk image deletion endpoint
router.delete('/:reportId/images', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { imageIndexes } = req.body; // Array of indexes to delete
    
    const report = await Report.findById(reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    // Authorization check
    if (!req.user.canModifyReport(report)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this report'
      });
    }
    
    if (!imageIndexes || !Array.isArray(imageIndexes)) {
      return res.status(400).json({
        success: false,
        message: 'imageIndexes array is required'
      });
    }
    
    // Sort in descending order to avoid index issues when splicing
    const sortedIndexes = [...imageIndexes].sort((a, b) => b - a);
    const removedImages = [];
    
    // Delete from Cloudinary and prepare for removal
    for (const index of sortedIndexes) {
      if (index >= 0 && index < report.images.length) {
        const image = report.images[index];
        await deleteImageFromCloudinary(image.publicId);
        removedImages.unshift(image); // Add to beginning to maintain order
      }
    }
    
    // Remove from report (using sorted indexes to avoid issues)
    for (const index of sortedIndexes) {
      if (index >= 0 && index < report.images.length) {
        report.images.splice(index, 1);
      }
    }
    
    report.updatedAt = new Date();
    await report.save();
    
    res.json({
      success: true,
      message: `Removed ${removedImages.length} images successfully`,
      data: {
        removedImages,
        remainingImages: report.images.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error bulk removing images:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to remove images',
      error: error.message
    });
  }
});


// PUT /api/reports/:id - Update report with email notifications
router.put('/:id', async (req, res) => {
  try {
    console.log('\n🎯 ========== FRONTEND REPORT UPDATE STARTED ==========');
    console.log('📋 Request details:');
    console.log('   User ID:', req.headers['x-user-id']);
    console.log('   Report ID:', req.params.id);
    console.log('   Request body:', req.body);

    const report = await Report.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email');

    console.log('📊 Report data loaded:');
    console.log('   Report title:', report.title);
    console.log('   CreatedBy email:', report.createdBy?.email);
    console.log('   Current status:', report.status);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Authorization check
    if (!req.user.canModifyReport(report)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { status, assignedTo, priority } = req.body;
    const oldStatus = report.status;

    console.log('🔄 Status change analysis:');
    console.log('   Old status:', oldStatus);
    console.log('   New status:', status);
    console.log('   Status changed?', status && status !== oldStatus);

    const updateData = { updatedAt: new Date() };
    
    if (req.user.isAdmin()) {
      if (status) updateData.status = status;
      if (assignedTo) updateData.assignedTo = assignedTo;
      if (priority) updateData.priority = priority;
    }

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'username email')
    .populate('assignedTo', 'username email');

    console.log('✅ Report updated in database');

    // ⭐ CRITICAL: Email debugging section
    if (status && status !== oldStatus) {
  console.log('\n📧 ========== EMAIL PROCESS STARTED ==========');

  

  

  // 2️⃣ Check recipient details
  const recipientEmail = updatedReport.createdBy?.email;
  const recipientUsername = updatedReport.createdBy?.username;

  console.log('2. Checking recipient details:');
  console.log('   Recipient email:', recipientEmail);
  console.log('   Recipient username:', recipientUsername);

  if (!recipientEmail) {
    console.log('❌ ABORTING: No recipient email found!');
  } else {
    

    // 4️⃣ Send status update notification
    console.log('4. Sending status update notification...');
    const statusEmailResult = await sendStatusUpdateNotification(updatedReport, oldStatus, status);
    console.log('5. Status update email result:', statusEmailResult);

    // 5️⃣ Send resolved report notification if needed
    if (status === 'Resolved') {
      console.log('6. Sending resolved report notification...');
      const resolvedEmailResult = await sendReportResolvedNotification(updatedReport);
      console.log('7. Resolved email result:', resolvedEmailResult);
    }
  }

  console.log('📧 ========== EMAIL PROCESS COMPLETED ==========');
} else {
      console.log('📧 No email sent - status unchanged or not provided');
    }

    console.log('🎯 ========== FRONTEND REQUEST COMPLETED ==========\n');
    
    res.json({
      success: true,
      message: 'Report updated successfully',
      data: updatedReport
    });

  } catch (error) {
    console.error('❌ Report update error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update report',
      error: error.message
    });
  }
});

// DELETE /api/reports/:id - Delete report
router.delete('/:id', async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Report deleted successfully',
      data: { id: req.params.id }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete report',
      error: error.message
    });
  }
});

module.exports = router;