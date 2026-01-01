const express = require('express');
const { body, validationResult } = require('express-validator');
const Schedule = require('../models/Schedule');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');
const aiService = require('../services/aiService');
const fileProcessor = require('../services/fileProcessor');
const socialMediaService = require('../services/socialMediaService');
const imageService = require('../services/imageService');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/schedules/today
// @desc    Create a post for today
// @access  Private
router.post('/today', [
  body('topic').trim().notEmpty().withMessage('Topic is required'),
  body('explanation').trim().notEmpty().withMessage('Explanation is required'),
  body('platforms').isArray().withMessage('Platforms must be an array'),
  body('postTime').isISO8601().withMessage('Invalid post time')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { topic, explanation, tone, platforms, aiModel, postTime, generateImage, requiresApproval } = req.body;
    const user = req.user;

    // Generate content
    const generatedContent = await aiService.generatePlatformContent(
      topic,
      explanation,
      tone || 'professional',
      platforms,
      aiModel || user.aiPreference
    );

    // Generate image if requested
    let imageData = null;
    if (generateImage) {
      try {
        const styleData = aiService.detectImageStyle(topic, explanation);
        const imagePrompt = styleData.prompt;
        const dalleResponse = await aiService.generateImageWithDALLE(imagePrompt);
        const platformVariants = await imageService.generatePlatformVariants(dalleResponse.url);
        
        imageData = {
          url: dalleResponse.url,
          prompt: imagePrompt,
          style: styleData.style,
          platformVariants
        };
      } catch (error) {
        console.error('Image generation error:', error);
      }
    }

    // For "today" posts, default to requiring approval (user can review)
    const needsApproval = requiresApproval !== undefined ? requiresApproval : true;

    // Create post
    const post = await Post.create({
      user: user._id,
      topic,
      explanation,
      tone: tone || 'professional',
      aiModel: aiModel || user.aiPreference,
      generatedContent,
      generatedImage: imageData,
      platforms,
      scheduledTime: new Date(postTime),
      requiresApproval: needsApproval,
      status: needsApproval ? 'pending_review' : 'scheduled'
    });

    // Create schedule
    const schedule = await Schedule.create({
      user: user._id,
      type: 'today',
      posts: [post._id],
      nextRunDate: new Date(postTime),
      isActive: true
    });

    res.status(201).json({
      message: 'Post scheduled for today',
      schedule,
      post
    });
  } catch (error) {
    res.status(500).json({ message: 'Scheduling failed', error: error.message });
  }
});

// @route   POST /api/schedules/weekly
// @desc    Create weekly schedule from file
// @access  Private
router.post('/weekly', [
  body('fileUrl').notEmpty().withMessage('File URL is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fileUrl, aiModel, generateImage } = req.body;
    const user = req.user;

    // Process file
    const weeklyConfig = await fileProcessor.processFile(fileUrl);

    // Generate posts for each day
    const posts = [];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
      const dayConfig = weeklyConfig[day];
      if (dayConfig && dayConfig.topic) {
        // Generate content
        const generatedContent = await aiService.generatePlatformContent(
          dayConfig.topic,
          dayConfig.explanation,
          'professional',
          dayConfig.platforms || ['linkedin', 'twitter'],
          aiModel || user.aiPreference
        );

        // Generate image if requested
        let imageData = null;
        if (generateImage) {
          try {
            const styleData = aiService.detectImageStyle(dayConfig.topic, dayConfig.explanation);
            const imagePrompt = styleData.prompt;
            const dalleResponse = await aiService.generateImageWithDALLE(imagePrompt);
            const platformVariants = await imageService.generatePlatformVariants(dalleResponse.url);
            
            imageData = {
              url: dalleResponse.url,
              prompt: imagePrompt,
              style: styleData.style,
              platformVariants
            };
          } catch (error) {
            console.error('Image generation error:', error);
          }
        }

        // Create post (weekly/monthly: auto-publish, no approval needed)
        const post = await Post.create({
          user: user._id,
          topic: dayConfig.topic,
          explanation: dayConfig.explanation,
          tone: 'professional',
          aiModel: aiModel || user.aiPreference,
          generatedContent,
          generatedImage: imageData,
          platforms: dayConfig.platforms || ['linkedin', 'twitter'],
          requiresApproval: false, // Auto-publish for weekly schedules
          status: 'scheduled'
        });

        posts.push(post._id);
      }
    }

    // Create schedule
    const schedule = await Schedule.create({
      user: user._id,
      type: 'weekly',
      posts,
      weeklyConfig: {
        fileUrl,
        dayMapping: weeklyConfig
      },
      isActive: true
    });

    res.status(201).json({
      message: 'Weekly schedule created',
      schedule,
      postsCount: posts.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Weekly scheduling failed', error: error.message });
  }
});

// @route   POST /api/schedules/monthly
// @desc    Create monthly schedule
// @access  Private
router.post('/monthly', [
  body('industry').trim().notEmpty().withMessage('Industry is required'),
  body('targetAudience').trim().notEmpty().withMessage('Target audience is required'),
  body('contentGoal').isIn(['branding', 'leads', 'engagement']).withMessage('Invalid content goal')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { industry, targetAudience, contentGoal, contentDistribution, aiModel, generateImage } = req.body;
    const user = req.user;

    // Generate monthly plan
    const distribution = contentDistribution || {
      educational: 60,
      engagement: 25,
      promotional: 15
    };

    const generatedTopics = await aiService.generateMonthlyPlan(
      industry,
      targetAudience,
      contentGoal,
      distribution
    );

    // Generate posts for each topic
    const posts = [];
    for (const topicData of generatedTopics) {
      try {
        const generatedContent = await aiService.generatePlatformContent(
          topicData.topic,
          topicData.explanation,
          topicData.tone || 'professional',
          topicData.platforms || ['linkedin', 'twitter'],
          aiModel || user.aiPreference
        );

        let imageData = null;
        if (generateImage) {
          try {
            const styleData = aiService.detectImageStyle(topicData.topic, topicData.explanation);
            const imagePrompt = styleData.prompt;
            const dalleResponse = await aiService.generateImageWithDALLE(imagePrompt);
            const platformVariants = await imageService.generatePlatformVariants(dalleResponse.url);
            
            imageData = {
              url: dalleResponse.url,
              prompt: imagePrompt,
              style: styleData.style,
              platformVariants
            };
          } catch (error) {
            console.error('Image generation error:', error);
          }
        }

        const post = await Post.create({
          user: user._id,
          topic: topicData.topic,
          explanation: topicData.explanation,
          tone: topicData.tone || 'professional',
          aiModel: aiModel || user.aiPreference,
          generatedContent,
          generatedImage: imageData,
          platforms: topicData.platforms || ['linkedin', 'twitter'],
          requiresApproval: false, // Auto-publish for monthly schedules
          status: 'scheduled'
        });

        posts.push(post._id);
      } catch (error) {
        console.error(`Error creating post for day ${topicData.day}:`, error);
      }
    }

    // Create schedule
    const schedule = await Schedule.create({
      user: user._id,
      type: 'monthly',
      posts,
      monthlyConfig: {
        industry,
        targetAudience,
        contentGoal,
        contentDistribution: distribution,
        generatedTopics
      },
      isActive: true
    });

    res.status(201).json({
      message: 'Monthly schedule created',
      schedule,
      postsCount: posts.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Monthly scheduling failed', error: error.message });
  }
});

// @route   GET /api/schedules
// @desc    Get user's schedules
// @access  Private
router.get('/', async (req, res) => {
  try {
    const schedules = await Schedule.find({ user: req.user._id })
      .populate('posts')
      .sort({ createdAt: -1 });

    res.json({ schedules });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch schedules', error: error.message });
  }
});

// @route   GET /api/schedules/:id
// @desc    Get a single schedule
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ _id: req.params.id, user: req.user._id })
      .populate('posts');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json({ schedule });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch schedule', error: error.message });
  }
});

// @route   PUT /api/schedules/:id/toggle
// @desc    Toggle schedule active status
// @access  Private
router.put('/:id/toggle', async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ _id: req.params.id, user: req.user._id });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    schedule.isActive = !schedule.isActive;
    await schedule.save();

    res.json({
      message: `Schedule ${schedule.isActive ? 'activated' : 'deactivated'}`,
      schedule
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle schedule', error: error.message });
  }
});

module.exports = router;

