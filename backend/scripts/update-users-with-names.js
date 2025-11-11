// scripts/update-users-with-names.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function updateUsersWithNames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find all users without names
    const usersWithoutNames = await User.find({ 
      $or: [
        { name: { $exists: false } },
        { name: null },
        { name: '' }
      ]
    });

    console.log(`📝 Found ${usersWithoutNames.length} users without names`);

    for (const user of usersWithoutNames) {
      // Use username as name if available, otherwise use email prefix
      const newName = user.username || user.email.split('@')[0];
      
      await User.findByIdAndUpdate(user._id, {
        name: newName
      });
      
      console.log(`✅ Updated user ${user.email} with name: ${newName}`);
    }

    console.log('🎉 All users updated successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error updating users:', error);
    process.exit(1);
  }
}

updateUsersWithNames();