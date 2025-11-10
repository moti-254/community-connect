const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkAndFixUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find();
    console.log('\n📋 CURRENT USERS:');
    console.log('================');
    users.forEach(user => {
      console.log(`ID: ${user._id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Username: ${user.username}`);
      console.log(`Role: ${user.role}`);
      console.log(`Active: ${user.isActive}`);
      console.log('----------------');
    });

    // Find which user is creating reports (likely the resident)
    const Report = require('../models/Report');
    const recentReport = await Report.findOne().sort({ createdAt: -1 }).populate('createdBy');
    
    if (recentReport && recentReport.createdBy) {
      console.log('\n🔍 MOST RECENT REPORT CREATED BY:');
      console.log(`User ID: ${recentReport.createdBy._id}`);
      console.log(`Email: ${recentReport.createdBy.email}`);
      console.log(`Username: ${recentReport.createdBy.username}`);
    }

    // Solution: Update the specific user who's creating reports
    if (recentReport && recentReport.createdBy) {
      const userIdToUpdate = recentReport.createdBy._id;
      
      // Check if this is the resident@community.com user
      const userToUpdate = await User.findById(userIdToUpdate);
      if (userToUpdate && userToUpdate.email === 'resident@community.com') {
        console.log('\n🔄 UPDATING RESIDENT USER EMAIL...');
        
        // Use Gmail alias
        const newEmail = 'kiptootim254+resident@gmail.com';
        
        userToUpdate.email = newEmail;
        await userToUpdate.save();
        
        console.log(`✅ Updated resident email to: ${newEmail}`);
        console.log('📧 Emails will now be sent to this address');
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ MongoDB disconnected');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkAndFixUsers();