const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'community-connect',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { 
        width: 1200, 
        height: 1200, 
        crop: 'limit', 
        quality: 'auto:good', // ⭐ Auto quality optimization
        fetch_format: 'auto' // ⭐ Auto format selection
      }
    ],
    // ⭐ NEW: Additional optimization flags
    format: 'jpg',
    quality_analysis: true,
    colors: true
  },
});


console.log('✅ Cloudinary configured successfully with optimization');

module.exports = { cloudinary, storage };