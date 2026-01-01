const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const aiService = require('../services/aiService');
const socialMediaService = require('../services/socialMediaService');
const imageService = require('../services/imageService');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/posts/generate
// @desc    Generate AI content for a post
// @access  Private
router.post('/generate', [
  body('topic').trim().notEmpty().withMessage('Topic is required'),
  body('explanation').trim().notEmpty().withMessage('Explanation is required'),
  body('platforms').isArray().withMessage('Platforms must be an array'),
  body('aiModel').isIn(['chatgpt', 'gemini']).withMessage('Invalid AI model')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { topic, explanation, tone, platforms, aiModel, generateImage } = req.body;
    const user = req.user;

    // Generate content for each platform
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
        
        // Generate platform-specific variants
        const platformVariants = await imageService.generatePlatformVariants(dalleResponse.url);
        
        imageData = {
          url: dalleResponse.url,
          prompt: imagePrompt,
          style: styleData.style,
          platformVariants
        };
      } catch (error) {
        console.error('Image generation error:', error);
        // Continue without image if generation fails
      }
    }

    // Determine if approval is required (default: only for single "today" posts)
    const requiresApproval = req.body.requiresApproval !== undefined 
      ? req.body.requiresApproval 
      : false; // Default to auto-publish for weekly/monthly

    // Create post record
    const post = await Post.create({
      user: user._id,
      topic,
      explanation,
      tone: tone || 'professional',
      aiModel: aiModel || user.aiPreference,
      generatedContent,
      generatedImage: imageData,
      platforms,
      requiresApproval,
      status: requiresApproval ? 'pending_review' : 'draft'
    });

    // Update user usage
    await User.findByIdAndUpdate(user._id, {
      $inc: {
        'usage.postsGenerated': 1,
        'usage.apiCalls': 1,
        ...(imageData && { 'usage.imagesGenerated': 1 })
      }
    });

    res.status(201).json({
      message: 'Content generated successfully',
      post
    });
  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({ message: 'Content generation failed', error: error.message });
  }
});

// @route   POST /api/posts/:id/schedule
// @desc    Schedule a post
// @access  Private
router.post('/:id/schedule', [
  body('scheduledTime').isISO8601().withMessage('Invalid scheduled time'),
  body('platforms').isArray().withMessage('Platforms must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { scheduledTime, platforms } = req.body;
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.scheduledTime = new Date(scheduledTime);
    post.platforms = platforms;
    post.status = 'scheduled';

    await post.save();

    res.json({
      message: 'Post scheduled successfully',
      post
    });
  } catch (error) {
    res.status(500).json({ message: 'Scheduling failed', error: error.message });
  }
});

// @route   POST /api/posts/:id/publish
// @desc    Publish a post immediately
// @access  Private
router.post('/:id/publish', async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.generatedContent) {
      return res.status(400).json({ message: 'Post content not generated' });
    }

    // Post to each platform with platform-specific image variants
    const postResults = [];
    for (const platform of post.platforms) {
      try {
        const content = post.generatedContent[platform];
        
        const result = await socialMediaService.postToPlatforms(
          req.user._id,
          content,
          [platform],
          post.generatedImage
        );
        
        postResults.push(...result);
      } catch (error) {
        postResults.push({
          platform,
          status: 'failed',
          error: error.message,
          postedAt: new Date()
        });
      }
    }

    post.postResults = postResults;
    post.status = postResults.some(r => r.status === 'success') ? 'posted' : 'failed';
    post.postedAt = new Date();
    await post.save();

    res.json({
      message: 'Post published',
      post,
      results: postResults
    });
  } catch (error) {
    res.status(500).json({ message: 'Publishing failed', error: error.message });
  }
});

// @route   GET /api/posts
// @desc    Get user's posts
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { user: req.user._id };
    
    if (status) {
      query.status = status;
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email');

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch posts', error: error.message });
  }
});

// @route   GET /api/posts/:id
// @desc    Get a single post
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id })
      .populate('user', 'name email');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch post', error: error.message });
  }
});

// @route   PUT /api/posts/:id/approve
// @desc    Approve a post for publishing
// @access  Private
router.put('/:id/approve', async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.status !== 'pending_review') {
      return res.status(400).json({ message: 'Post is not pending review' });
    }

    // Allow editing before approval
    if (req.body.editedContent) {
      post.generatedContent = { ...post.generatedContent, ...req.body.editedContent };
    }

    post.isApproved = true;
    post.status = post.scheduledTime ? 'scheduled' : 'draft';
    await post.save();

    res.json({
      message: 'Post approved successfully',
      post
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve post', error: error.message });
  }
});

// @route   PUT /api/posts/:id/regenerate
// @desc    Regenerate content or image
// @access  Private
router.put('/:id/regenerate', [
  body('type').isIn(['content', 'image', 'both']).withMessage('Invalid regeneration type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await Post.findOne({ _id: req.params.id, user: req.user._id });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const { type } = req.body;
    const user = req.user;

    if (type === 'content' || type === 'both') {
      // Regenerate content
      post.generatedContent = await aiService.generatePlatformContent(
        post.topic,
        post.explanation,
        post.tone,
        post.platforms,
        post.aiModel
      );
    }

    if (type === 'image' || type === 'both') {
      // Regenerate image
      try {
        const styleData = aiService.detectImageStyle(post.topic, post.explanation);
        const imagePrompt = styleData.prompt;
        const dalleResponse = await aiService.generateImageWithDALLE(imagePrompt);
        const platformVariants = await imageService.generatePlatformVariants(dalleResponse.url);
        
        post.generatedImage = {
          url: dalleResponse.url,
          prompt: imagePrompt,
          style: styleData.style,
          platformVariants
        };
      } catch (error) {
        console.error('Image regeneration error:', error);
      }
    }

    await post.save();

    res.json({
      message: 'Content regenerated successfully',
      post
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to regenerate content', error: error.message });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.deleteOne();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete post', error: error.message });
  }
});

module.exports = router;

