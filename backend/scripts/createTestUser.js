const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createTestUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing test users to avoid duplicates
    await User.deleteMany({ 
      email: { $in: ['resident@community.com', 'admin@community.com'] } 
    });

    // Create test resident
    const resident = new User({
      clerkUserId: 'temp_resident_001',
      email: 'resident@community.com',
      username: 'Test Resident',
      role: 'resident',
      isActive: true // ⭐⭐⭐ ADD THIS LINE ⭐⭐⭐
    });
    await resident.save();
    console.log('✅ Test resident created:', resident._id.toString());

    // Create test admin
    const admin = new User({
      clerkUserId: 'temp_admin_001',
      email: 'admin@community.com',
      username: 'Community Admin',
      role: 'admin',
      isActive: true // ⭐⭐⭐ ADD THIS LINE ⭐⭐⭐
    });
    await admin.save();
    console.log('✅ Test admin created:', admin._id.toString());

    console.log('\n📋 COPY THESE IDs FOR TESTING:');
    console.log('================================');
    console.log('Resident ID:', resident._id.toString());
    console.log('Admin ID:   ', admin._id.toString());
    console.log('================================\n');
    
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  }
};

createTestUsers();