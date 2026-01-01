const express = require('express');
const Post = require('../models/Post');
const Schedule = require('../models/Schedule');
const SocialAccount = require('../models/SocialAccount');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/dashboard/overview
// @desc    Get dashboard overview data
// @access  Private
router.get('/overview', async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Upcoming posts
    const upcomingToday = await Post.countDocuments({
      user: user._id,
      status: 'scheduled',
      scheduledTime: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    const upcomingWeek = await Post.countDocuments({
      user: user._id,
      status: 'scheduled',
      scheduledTime: { $gte: weekStart, $lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) }
    });

    const upcomingMonth = await Post.countDocuments({
      user: user._id,
      status: 'scheduled',
      scheduledTime: { $gte: monthStart }
    });

    // Recent posts
    const recentPosts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('topic status scheduledTime postedAt createdAt');

    // Active schedules
    const activeSchedules = await Schedule.countDocuments({
      user: user._id,
      isActive: true
    });

    // Connected accounts
    const connectedAccounts = await SocialAccount.countDocuments({
      user: user._id,
      isActive: true
    });

    // Usage stats
    const userData = await User.findById(user._id).select('usage subscription');

    res.json({
      upcomingPosts: {
        today: upcomingToday,
        week: upcomingWeek,
        month: upcomingMonth
      },
      recentPosts,
      activeSchedules,
      connectedAccounts,
      usage: userData.usage,
      subscription: userData.subscription
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard data', error: error.message });
  }
});

// @route   GET /api/dashboard/upcoming
// @desc    Get upcoming posts
// @access  Private
router.get('/upcoming', async (req, res) => {
  try {
    const { period = 'week', page = 1, limit = 20 } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now);
    }

    const posts = await Post.find({
      user: req.user._id,
      status: 'scheduled',
      scheduledTime: { $gte: startDate }
    })
      .sort({ scheduledTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('topic scheduledTime platforms status');

    const total = await Post.countDocuments({
      user: req.user._id,
      status: 'scheduled',
      scheduledTime: { $gte: startDate }
    });

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch upcoming posts', error: error.message });
  }
});

module.exports = router;

