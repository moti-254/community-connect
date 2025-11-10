// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkUserId: { 
    type: String, 
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [2, 'Username must be at least 2 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  role: { 
    type: String, 
    enum: ['resident', 'admin'], 
    default: 'resident' 
  },
  isActive: {
    type: Boolean,
    default: true, // ⭐⭐⭐ MAKE SURE THIS HAS A DEFAULT VALUE ⭐⭐⭐
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Add method to check if user can modify report
userSchema.methods.canModifyReport = function(report) {
  return this.isAdmin() || report.createdBy.toString() === this._id.toString();
};

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);