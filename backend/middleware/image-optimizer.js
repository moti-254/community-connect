const { cloudinary } = require('../config/cloudinary');

// Function to generate optimized versions
const generateOptimizedVersions = async (publicId) => {
  try {
    console.log('🔄 Generating optimized versions for:', publicId);
    
    const optimizations = {
      thumbnail: cloudinary.url(publicId, {
        transformation: [
          { width: 300, height: 300, crop: 'fill', quality: 'auto' }
        ]
      }),
      webp: cloudinary.url(publicId, {
        transformation: [
          { width: 1200, height: 1200, crop: 'limit', quality: 'auto', format: 'webp' }
        ]
      }),
      avif: cloudinary.url(publicId, {
        transformation: [
          { width: 1200, height: 1200, crop: 'limit', quality: 'auto', format: 'avif' }
        ]
      })
    };

    console.log('✅ Generated optimized versions');
    return optimizations;
    
  } catch (error) {
    console.error('❌ Error generating optimized versions:', error);
    return null;
  }
};

module.exports = { generateOptimizedVersions };