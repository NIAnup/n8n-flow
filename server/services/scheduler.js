const cron = require('node-cron');
const Post = require('../models/Post');
const Schedule = require('../models/Schedule');
const socialMediaService = require('./socialMediaService');
const imageService = require('./imageService');

class SchedulerService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Scheduler is already running');
      return;
    }

    // Run every minute to check for scheduled posts
    cron.schedule('* * * * *', async () => {
      await this.processScheduledPosts();
    });

    // Process weekly schedules daily at midnight
    cron.schedule('0 0 * * *', async () => {
      await this.processWeeklySchedules();
    });

    // Process monthly schedules daily at midnight
    cron.schedule('0 0 * * *', async () => {
      await this.processMonthlySchedules();
    });

    this.isRunning = true;
    console.log('✅ Scheduler started');
  }

  /**
   * Process scheduled posts that are due
   */
  async processScheduledPosts() {
    try {
      const now = new Date();
      const duePosts = await Post.find({
        status: 'scheduled',
        scheduledTime: { $lte: now },
        $or: [
          { requiresApproval: false },
          { requiresApproval: true, isApproved: true }
        ]
      }).populate('user');

      for (const post of duePosts) {
        try {
          // Skip if post requires approval but not approved
          if (post.requiresApproval && !post.isApproved) {
            continue;
          }

          await this.publishPost(post);
        } catch (error) {
          console.error(`Error publishing post ${post._id}:`, error);
          
          // Retry logic
          post.retryCount = (post.retryCount || 0) + 1;
          
          if (post.retryCount >= (post.maxRetries || 3)) {
            post.status = 'failed';
            post.postResults.push({
              platform: 'all',
              status: 'failed',
              error: error.message,
              postedAt: new Date()
            });
          } else {
            // Reschedule for retry (5 minutes later)
            post.scheduledTime = new Date(now.getTime() + 5 * 60 * 1000);
          }
          
          await post.save();
        }
      }
    } catch (error) {
      console.error('Error processing scheduled posts:', error);
    }
  }

  /**
   * Publish a post to all platforms with retry and graceful degradation
   */
  async publishPost(post) {
    const postResults = [];

    for (const platform of post.platforms) {
      try {
        const content = post.generatedContent[platform];
        if (!content) {
          throw new Error(`No content generated for ${platform}`);
        }

        // Use platform-specific image variant
        const result = await socialMediaService.postToPlatforms(
          post.user._id,
          content,
          [platform],
          post.generatedImage
        );

        postResults.push(...result);
      } catch (error) {
        console.error(`Error posting to ${platform} for post ${post._id}:`, error);
        postResults.push({
          platform,
          status: 'failed',
          error: error.message,
          postedAt: new Date()
        });
      }
    }

    post.postResults = postResults;
    const successCount = postResults.filter(r => r.status === 'success').length;
    post.status = successCount > 0 ? 'posted' : 'failed';
    post.postedAt = new Date();
    post.retryCount = 0; // Reset on success
    await post.save();

    if (successCount > 0) {
      console.log(`✅ Post ${post._id} published to ${successCount}/${post.platforms.length} platform(s)`);
    } else {
      console.error(`❌ Post ${post._id} failed on all platforms`);
    }
  }

  /**
   * Process weekly schedules
   */
  async processWeeklySchedules() {
    try {
      const schedules = await Schedule.find({
        type: 'weekly',
        isActive: true
      }).populate('user').populate('posts');

      for (const schedule of schedules) {
        const today = new Date();
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const dayConfig = schedule.weeklyConfig?.dayMapping?.[dayName];

        if (dayConfig && dayConfig.topic) {
          // Check if post already exists for today
          const existingPost = await Post.findOne({
            user: schedule.user._id,
            topic: dayConfig.topic,
            scheduledTime: {
              $gte: new Date(today.setHours(0, 0, 0, 0)),
              $lt: new Date(today.setHours(23, 59, 59, 999))
            }
          });

          if (!existingPost) {
            // Generate and schedule post for today
            await this.createWeeklyPost(schedule, dayConfig, today);
          }
        }
      }
    } catch (error) {
      console.error('Error processing weekly schedules:', error);
    }
  }

  /**
   * Create a post from weekly schedule
   */
  async createWeeklyPost(schedule, dayConfig, scheduledDate) {
    try {
      const aiService = require('./aiService');
      const user = schedule.user;

      // Generate content
      const generatedContent = await aiService.generatePlatformContent(
        dayConfig.topic,
        dayConfig.explanation,
        'professional',
        dayConfig.platforms || ['linkedin', 'twitter'],
        user.aiPreference
      );

      // Create post
      const post = await Post.create({
        user: user._id,
        topic: dayConfig.topic,
        explanation: dayConfig.explanation,
        tone: 'professional',
        aiModel: user.aiPreference,
        generatedContent,
        platforms: dayConfig.platforms || ['linkedin', 'twitter'],
        scheduledTime: scheduledDate,
        status: 'scheduled'
      });

      schedule.posts.push(post._id);
      schedule.lastRunDate = new Date();
      await schedule.save();

      console.log(`✅ Created weekly post for ${dayConfig.topic}`);
    } catch (error) {
      console.error('Error creating weekly post:', error);
    }
  }

  /**
   * Process monthly schedules
   */
  async processMonthlySchedules() {
    try {
      const schedules = await Schedule.find({
        type: 'monthly',
        isActive: true
      }).populate('user').populate('posts');

      for (const schedule of schedules) {
        const today = new Date();
        const dayOfMonth = today.getDate();
        
        // Find topic for today
        const topicData = schedule.monthlyConfig?.generatedTopics?.find(
          t => t.day === dayOfMonth
        );

        if (topicData) {
          // Check if post already exists for today
          const existingPost = await Post.findOne({
            user: schedule.user._id,
            topic: topicData.topic,
            scheduledTime: {
              $gte: new Date(today.setHours(0, 0, 0, 0)),
              $lt: new Date(today.setHours(23, 59, 59, 999))
            }
          });

          if (!existingPost) {
            // Generate and schedule post for today
            await this.createMonthlyPost(schedule, topicData, today);
          }
        }
      }
    } catch (error) {
      console.error('Error processing monthly schedules:', error);
    }
  }

  /**
   * Create a post from monthly schedule
   */
  async createMonthlyPost(schedule, topicData, scheduledDate) {
    try {
      const aiService = require('./aiService');
      const user = schedule.user;

      // Generate content
      const generatedContent = await aiService.generatePlatformContent(
        topicData.topic,
        topicData.explanation,
        topicData.tone || 'professional',
        topicData.platforms || ['linkedin', 'twitter'],
        user.aiPreference
      );

      // Create post
      const post = await Post.create({
        user: user._id,
        topic: topicData.topic,
        explanation: topicData.explanation,
        tone: topicData.tone || 'professional',
        aiModel: user.aiPreference,
        generatedContent,
        platforms: topicData.platforms || ['linkedin', 'twitter'],
        scheduledTime: scheduledDate,
        status: 'scheduled'
      });

      schedule.posts.push(post._id);
      schedule.lastRunDate = new Date();
      await schedule.save();

      console.log(`✅ Created monthly post for ${topicData.topic}`);
    } catch (error) {
      console.error('Error creating monthly post:', error);
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    this.isRunning = false;
    console.log('⏹️  Scheduler stopped');
  }
}

module.exports = new SchedulerService();

