const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  content: {
    type: String,
    required: true,
    maxlength: 50000 // Larger content for detailed notes
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: false
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  category: {
    type: String,
    enum: ['lecture', 'study-guide', 'summary', 'homework', 'exam-prep', 'research', 'other'],
    default: 'other'
  },
  difficulty_level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  attachments: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      default: ''
    },
    alt_text: {
      type: String,
      default: ''
    }
  }],
  is_public: {
    type: Boolean,
    default: true
  },
  is_template: {
    type: Boolean,
    default: false
  },
  views_count: {
    type: Number,
    default: 0
  },
  likes_count: {
    type: Number,
    default: 0
  },
  shares_count: {
    type: Number,
    default: 0
  },
  version: {
    type: Number,
    default: 1
  },
  parent_note: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note'
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['read', 'edit', 'admin'],
      default: 'read'
    }
  }],
  edited_at: {
    type: Date
  },
  last_accessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for search and performance
noteSchema.index({ community: 1, createdAt: -1 });
noteSchema.index({ group: 1, createdAt: -1 });
noteSchema.index({ author: 1, createdAt: -1 });
noteSchema.index({ subject: 1, category: 1 });
noteSchema.index({ title: 'text', content: 'text', tags: 'text', subject: 'text' });
noteSchema.index({ is_public: 1, community: 1 });
noteSchema.index({ is_public: 1, group: 1 });

// Validation: note must belong to either community or group
noteSchema.pre('save', function(next) {
  if (!this.community && !this.group) {
    next(new Error('Note must belong to either a community or a group'));
  } else if (this.community && this.group) {
    next(new Error('Note cannot belong to both community and group'));
  } else {
    next();
  }
});

// Update last_accessed when note is viewed
noteSchema.pre('findOne', function() {
  this.set({ last_accessed: new Date() });
});

module.exports = mongoose.model('Note', noteSchema);
