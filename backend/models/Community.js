const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  display_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: ['academic', 'university', 'general'],
    default: 'general'
  },
  subject: {
    type: String,
    trim: true,
    maxlength: 100
  },
  members: {
    type: Number,
    default: 0
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  icon_url: {
    type: String,
    default: ''
  },
  banner_url: {
    type: String,
    default: ''
  },
  rules: [{
    title: String,
    description: String
  }],
  is_private: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for search
communitySchema.index({ name: 'text', display_name: 'text', description: 'text' });

module.exports = mongoose.model('Community', communitySchema);
