const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const finalUserFix = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ⭐⭐⭐ COMPLETELY CLEAR AND RECREATE ⭐⭐⭐
    await User.deleteMany({});
    console.log('🗑️ Cleared all users from database');

    // Create fresh users with explicit isActive
    const resident = new User({
      clerkUserId: 'temp_resident_001',
      email: 'resident@community.com',
      username: 'Test Resident',
      role: 'resident',
      isActive: true
    });
    await resident.save();

    const admin = new User({
      clerkUserId: 'temp_admin_001',
      email: 'admin@community.com',
      username: 'Community Admin', 
      role: 'admin',
      isActive: true
    });
    await admin.save();

    console.log('✅ Users created successfully');

    // ⭐⭐⭐ PROPER VERIFICATION - Re-fetch from database ⭐⭐⭐
    const verifiedResident = await User.findOne({ email: 'resident@community.com' });
    const verifiedAdmin = await User.findOne({ email: 'admin@community.com' });

    console.log('\n🔍 DATABASE VERIFICATION:');
    console.log('Resident - Active:', verifiedResident.isActive);
    console.log('Admin - Active:', verifiedAdmin.isActive);
    console.log('Resident ID:', verifiedResident._id.toString());
    console.log('Admin ID:', verifiedAdmin._id.toString());

    // Show all fields to debug
    console.log('\n📋 FULL USER DATA:');
    console.log('Resident:', JSON.stringify(verifiedResident, null, 2));
    console.log('Admin:', JSON.stringify(verifiedAdmin, null, 2));

    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

finalUserFix();