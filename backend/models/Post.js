const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  content: {
    type: String,
    maxlength: 10000
  },
  type: {
    type: String,
    enum: ['text', 'link', 'image', 'note'],
    default: 'text'
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
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  comment_count: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  link_url: {
    type: String,
    trim: true
  },
  image_url: {
    type: String,
    trim: true
  },
  note_file: {
    name: String,
    url: String,
    type: String,
    size: Number
  },
  is_pinned: {
    type: Boolean,
    default: false
  },
  is_locked: {
    type: Boolean,
    default: false
  },
  edited_at: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for search and sorting
postSchema.index({ community: 1, createdAt: -1 });
postSchema.index({ group: 1, createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Validation: post must belong to either community or group
postSchema.pre('save', function(next) {
  if (!this.community && !this.group) {
    next(new Error('Post must belong to either a community or a group'));
  } else if (this.community && this.group) {
    next(new Error('Post cannot belong to both community and group'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Post', postSchema);
