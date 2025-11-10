const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const cleanAndCreateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ⭐⭐⭐ FORCE DELETE existing test users ⭐⭐⭐
    const deleteResult = await User.deleteMany({ 
      $or: [
        { email: 'resident@community.com' },
        { email: 'admin@community.com' },
        { clerkUserId: 'temp_resident_001' },
        { clerkUserId: 'temp_admin_001' }
      ]
    });
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing test users`);

    // ⭐⭐⭐ CREATE FRESH USERS with isActive: true ⭐⭐⭐
    const resident = new User({
      clerkUserId: 'temp_resident_001',
      email: 'resident@community.com',
      username: 'Test Resident',
      role: 'resident',
      isActive: true
    });
    await resident.save();
    console.log('✅ Test resident created:', resident._id.toString());

    const admin = new User({
      clerkUserId: 'temp_admin_001',
      email: 'admin@community.com',
      username: 'Community Admin',
      role: 'admin',
      isActive: true
    });
    await admin.save();
    console.log('✅ Test admin created:', admin._id.toString());

    console.log('\n📋 NEW IDs FOR TESTING:');
    console.log('================================');
    console.log('Resident ID:', resident._id.toString());
    console.log('Admin ID:   ', admin._id.toString());
    console.log('================================\n');

    // ⭐⭐⭐ VERIFY THE USERS ARE ACTIVE ⭐⭐⭐
    const verifyResident = await User.findById(resident._id);
    const verifyAdmin = await User.findById(admin._id);
    
    console.log('🔍 VERIFICATION:');
    console.log('Resident - Active:', verifyResident.isActive);
    console.log('Admin - Active:', verifyAdmin.isActive);
    
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

cleanAndCreateUsers();