require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔗 Testing MongoDB Atlas Connection...');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Successfully connected to MongoDB Atlas!');
  console.log('Database:', mongoose.connection.name);
  console.log('Host:', mongoose.connection.host);
  
  // Test basic operation
  const Report = require('../models/Report');
  return Report.countDocuments();
})
.then(count => {
  console.log(`📊 Total reports in database: ${count}`);
  process.exit(0);
})
.catch(error => {
  console.error('❌ MongoDB Atlas connection failed:');
  console.error('Error:', error.message);
  process.exit(1);
});