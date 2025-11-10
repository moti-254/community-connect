const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const fixAdminEmail = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update admin email to use Gmail alias
    const admin = await User.findOneAndUpdate(
      { email: 'admin@community.com' },
      { email: 'kiptootim254+admin@gmail.com' },
      { new: true }
    );

    console.log('✅ Updated admin email:');
    console.log('From: admin@community.com');
    console.log('To: kiptootim254+admin@gmail.com');
    console.log('Admin ID:', admin._id);

    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixAdminEmail();