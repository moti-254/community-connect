require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log('🔍 DEBUG Cloudinary Configuration:');
console.log('================================');

// Check if environment variables are loaded
console.log('1. Environment Variables Check:');
console.log('   CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? `"${process.env.CLOUDINARY_CLOUD_NAME}"` : '❌ NOT FOUND');
console.log('   CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? `"${process.env.CLOUDINARY_API_KEY.substring(0, 10)}..."` : '❌ NOT FOUND');
console.log('   CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? `"${process.env.CLOUDINARY_API_SECRET.substring(0, 10)}..."` : '❌ NOT FOUND');

console.log('\n2. Cloudinary Configuration:');
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  console.log('   ✅ Cloudinary config applied');
} catch (configError) {
  console.log('   ❌ Cloudinary config failed:', configError.message);
}

console.log('\n3. Testing Simple Upload (with error details):');
const testImageUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';

cloudinary.uploader.upload(testImageUrl, { folder: 'test-connection' })
  .then(result => {
    console.log('   ✅ Upload test successful!');
    console.log('   Public ID:', result.public_id);
    console.log('   URL:', result.secure_url);
    
    // Clean up - delete the test image
    return cloudinary.uploader.destroy(result.public_id);
  })
  .then(deletionResult => {
    console.log('   ✅ Test image cleaned up');
  })
  .catch(error => {
    console.log('   ❌ Upload test failed:');
    console.log('   Error Name:', error.name);
    console.log('   Error Message:', error.message);
    console.log('   Error HTTP Code:', error.http_code);
    console.log('   Full Error:', JSON.stringify(error, null, 2));
  });

console.log('\n4. Alternative Test - List Resources:');
cloudinary.api.resources({ max_results: 1 })
  .then(result => {
    console.log('   ✅ API connection successful!');
    console.log('   Resources found:', result.resources.length);
  })
  .catch(error => {
    console.log('   ❌ API test failed:');
    console.log('   Error:', error.message);
  });