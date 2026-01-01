const mongoose = require('mongoose');

const socialAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['linkedin', 'facebook', 'twitter', 'instagram'],
    required: true
  },
  accountId: {
    type: String,
    required: true
  },
  accountName: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String
  },
  tokenExpiresAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileData: {
    name: String,
    username: String,
    profilePicture: String,
    followers: Number
  },
  lastSyncAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Ensure one account per platform per user
socialAccountSchema.index({ user: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model('SocialAccount', socialAccountSchema);

