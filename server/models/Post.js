const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  explanation: {
    type: String,
    required: true,
    trim: true
  },
  tone: {
    type: String,
    enum: ['professional', 'educational', 'promotional', 'casual'],
    default: 'professional'
  },
  aiModel: {
    type: String,
    enum: ['chatgpt', 'gemini'],
    required: true
  },
  generatedContent: {
    linkedin: { type: String, trim: true },
    facebook: { type: String, trim: true },
    twitter: { type: String, trim: true },
    instagram: { type: String, trim: true }
  },
  generatedImage: {
    url: String,
    prompt: String,
    style: String,
    platformVariants: {
      linkedin: String,
      facebook: String,
      twitter: String,
      instagram: String
    }
  },
  platforms: [{
    type: String,
    enum: ['linkedin', 'facebook', 'twitter', 'instagram']
  }],
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'scheduled', 'posted', 'failed'],
    default: 'draft'
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  scheduledTime: {
    type: Date
  },
  postedAt: {
    type: Date
  },
  postResults: [{
    platform: {
      type: String,
      enum: ['linkedin', 'facebook', 'twitter', 'instagram']
    },
    postId: String,
    url: String,
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success'
    },
    error: String,
    postedAt: Date
  }],
  metadata: {
    wordCount: Number,
    hashtags: [String],
    mentions: [String]
  }
}, {
  timestamps: true
});

// Index for efficient queries
postSchema.index({ user: 1, scheduledTime: 1 });
postSchema.index({ status: 1, scheduledTime: 1 });

module.exports = mongoose.model('Post', postSchema);

