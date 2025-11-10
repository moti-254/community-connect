const { cloudinary } = require('../config/cloudinary');

// Delete image from Cloudinary
const deleteImageFromCloudinary = async (publicId) => {
  try {
    console.log('🗑️ Deleting image from Cloudinary:', publicId);
    
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      console.log('✅ Image deleted successfully from Cloudinary');
      return true;
    } else {
      console.log('❌ Failed to delete image from Cloudinary:', result);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error deleting image from Cloudinary:', error);
    return false;
  }
};

// Delete multiple images
const deleteMultipleImages = async (publicIds) => {
  try {
    console.log('🗑️ Deleting multiple images:', publicIds);
    
    const deletePromises = publicIds.map(publicId => 
      cloudinary.uploader.destroy(publicId)
    );
    
    const results = await Promise.all(deletePromises);
    const successCount = results.filter(result => result.result === 'ok').length;
    
    console.log(`✅ Deleted ${successCount}/${publicIds.length} images from Cloudinary`);
    return successCount;
    
  } catch (error) {
    console.error('❌ Error deleting multiple images:', error);
    return 0;
  }
};

module.exports = { deleteImageFromCloudinary, deleteMultipleImages };