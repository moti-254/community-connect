const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 100,
    index: true // ⭐ Add index for faster searching
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    maxlength: 1000,
    index: true // ⭐ Add index for faster searching
  },
  category: { 
    type: String, 
    enum: ['Infrastructure', 'Sanitation', 'Parks & Recreation', 'Safety', 'Other'],
    required: true,
    index: true // ⭐ Add index for faster filtering 
  },
  status: { 
    type: String, 
    enum: ['Open', 'Acknowledged', 'In Progress', 'Resolved'],
    default: 'Open',
    index: true // ⭐ Add index for faster filtering 
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
    index: true // ⭐ Add index for faster filtering
  },
  location: {
    address: { type: String, required: true, index: true }, // ⭐ Add index for faster searching
    coordinates: {
      longitude: { type: Number, required: true },
      latitude: { type: Number, required: true }
    }
  },
  // ⭐ NEW: Add searchable tags array
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  images: [{
    url: String,
    publicId: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ⭐ NEW: Auto-generate tags from title and description before saving
reportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Generate search tags from title and description
  const text = `${this.title} ${this.description}`.toLowerCase();
  const words = text.split(/\W+/).filter(word => word.length > 2);
  const uniqueWords = [...new Set(words)];
  
  this.tags = uniqueWords.slice(0, 10); // Limit to 10 tags
  next();
});

// ⭐ NEW: Update tags on findOneAndUpdate
reportSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();

  if (update.title || update.description) {
    const text = `${update.title || ''} ${update.description || ''}`.toLowerCase();
    const words = text.split(/\W+/).filter(w => w.length > 2);
    update.tags = [...new Set(words)].slice(0, 10);
  }

  update.updatedAt = Date.now();
  this.setUpdate(update);
  next();
});


// ⭐ NEW: Create text index for full-text search
reportSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  'location.address': 'text',
  location: "2dsphere",
  


});

module.exports = mongoose.model('Report', reportSchema);