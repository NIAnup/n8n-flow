const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['today', 'weekly', 'monthly'],
    required: true
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  weeklyConfig: {
    fileUrl: String,
    dayMapping: {
      monday: { topic: String, explanation: String, platforms: [String] },
      tuesday: { topic: String, explanation: String, platforms: [String] },
      wednesday: { topic: String, explanation: String, platforms: [String] },
      thursday: { topic: String, explanation: String, platforms: [String] },
      friday: { topic: String, explanation: String, platforms: [String] },
      saturday: { topic: String, explanation: String, platforms: [String] },
      sunday: { topic: String, explanation: String, platforms: [String] }
    }
  },
  monthlyConfig: {
    industry: String,
    targetAudience: String,
    contentGoal: {
      type: String,
      enum: ['branding', 'leads', 'engagement']
    },
    contentDistribution: {
      educational: { type: Number, default: 60 },
      engagement: { type: Number, default: 25 },
      promotional: { type: Number, default: 15 }
    },
    generatedTopics: [{
      day: Number,
      topic: String,
      explanation: String,
      tone: String,
      platforms: [String]
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  nextRunDate: {
    type: Date
  },
  lastRunDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Schedule', scheduleSchema);

