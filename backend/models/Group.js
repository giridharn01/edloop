const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  category: {
    type: String,
    required: true,
    enum: [
      'Computer Science',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Engineering',
      'Business',
      'Literature',
      'History',
      'Psychology',
      'Economics',
      'Art',
      'Music',
      'Philosophy',
      'Medicine',
      'Law',
      'Other'
    ]
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  privacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true // Only for private groups
  },
  maxMembers: {
    type: Number,
    default: 100,
    min: 2,
    max: 1000
  },
  rules: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  avatar: {
    type: String, // URL or file path
    default: null
  },
  banner: {
    type: String, // URL or file path
    default: null
  },
  settings: {
    allowMemberPosts: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    allowFileSharing: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    totalPosts: {
      type: Number,
      default: 0
    },
    totalNotes: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
groupSchema.index({ name: 'text', description: 'text', tags: 'text' });
groupSchema.index({ category: 1 });
groupSchema.index({ privacy: 1 });
groupSchema.index({ creator: 1 });
groupSchema.index({ 'members.user': 1 });

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Generate invite code for private groups
groupSchema.pre('save', function(next) {
  if (this.privacy === 'private' && !this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

// Add creator as admin when group is created
groupSchema.pre('save', function(next) {
  if (this.isNew) {
    this.members.push({
      user: this.creator,
      role: 'admin',
      joinedAt: new Date()
    });
  }
  next();
});

module.exports = mongoose.model('Group', groupSchema);
