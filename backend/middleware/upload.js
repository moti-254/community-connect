const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 Processing file:', file.originalname);
    
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Error handling middleware
const handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
        error: error.message
      });
    }
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
  next();
};

module.exports = { upload, handleUploadErrors };