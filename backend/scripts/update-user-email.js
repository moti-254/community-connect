const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const updateUserEmail = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update resident user email
    const resident = await User.findOneAndUpdate(
      { email: 'resident@community.com' },
      { email: 'kiptootim254@gmail.com' },
      { new: true }
    );

    // Update admin user email  
    const admin = await User.findOneAndUpdate(
      { email: 'admin@community.com' },
      { email: 'kiptootim254@gmail.com' },
      { new: true }
    );

    console.log('✅ Updated user emails:');
    console.log('Resident:', resident ? resident.email : 'Not found');
    console.log('Admin:', admin ? admin.email : 'Not found');

    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
    
  } catch (error) {
    console.error('❌ Error updating emails:', error);
    process.exit(1);
  }
};

updateUserEmail();