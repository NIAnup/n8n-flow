const express = require('express');
const SocialAccount = require('../models/SocialAccount');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/social/accounts
// @desc    Get user's connected social accounts
// @access  Private
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await SocialAccount.find({ 
      user: req.user._id,
      isActive: true 
    }).sort({ platform: 1 });

    res.json({ accounts });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch accounts', error: error.message });
  }
});

// @route   POST /api/social/accounts
// @desc    Connect a social account
// @access  Private
router.post('/accounts', async (req, res) => {
  try {
    const { platform, accountId, accountName, accessToken, refreshToken, tokenExpiresAt, profileData } = req.body;

    // Check if account already exists
    const existing = await SocialAccount.findOne({ 
      user: req.user._id, 
      platform 
    });

    if (existing) {
      // Update existing account
      existing.accountId = accountId;
      existing.accountName = accountName;
      existing.accessToken = accessToken;
      existing.refreshToken = refreshToken;
      existing.tokenExpiresAt = tokenExpiresAt ? new Date(tokenExpiresAt) : undefined;
      existing.profileData = profileData;
      existing.isActive = true;
      existing.lastSyncAt = new Date();
      await existing.save();

      return res.json({
        message: 'Account updated successfully',
        account: existing
      });
    }

    // Create new account
    const account = await SocialAccount.create({
      user: req.user._id,
      platform,
      accountId,
      accountName,
      accessToken,
      refreshToken,
      tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : undefined,
      profileData,
      lastSyncAt: new Date()
    });

    res.status(201).json({
      message: 'Account connected successfully',
      account
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to connect account', error: error.message });
  }
});

// @route   DELETE /api/social/accounts/:id
// @desc    Disconnect a social account
// @access  Private
router.delete('/accounts/:id', async (req, res) => {
  try {
    const account = await SocialAccount.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    account.isActive = false;
    await account.save();

    res.json({ message: 'Account disconnected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to disconnect account', error: error.message });
  }
});

// @route   GET /api/social/auth/:platform
// @desc    Get OAuth URL for platform
// @access  Private
router.get('/auth/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const redirectUri = `${process.env.FRONTEND_URL}/auth/${platform}/callback`;

    let authUrl = '';

    switch (platform) {
      case 'linkedin':
        authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${req.user._id}&scope=r_liteprofile%20r_emailaddress%20w_member_social`;
        break;
      case 'facebook':
        authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${req.user._id}&scope=pages_manage_posts,pages_read_engagement`;
        break;
      case 'twitter':
        authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${req.user._id}&scope=tweet.read%20tweet.write%20users.read%20offline.access`;
        break;
      case 'instagram':
        authUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${req.user._id}&scope=user_profile,user_media&response_type=code`;
        break;
      default:
        return res.status(400).json({ message: 'Invalid platform' });
    }

    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate auth URL', error: error.message });
  }
});

module.exports = router;

