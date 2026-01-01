const axios = require('axios');
const SocialAccount = require('../models/SocialAccount');
const imageService = require('./imageService');

class SocialMediaService {
  /**
   * Retry wrapper for API calls
   */
  async retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  /**
   * Post to LinkedIn with retry and graceful degradation
   */
  async postToLinkedIn(userId, content, imageUrl = null) {
    return this.retryOperation(async () => {
      return await this._postToLinkedIn(userId, content, imageUrl);
    });
  }

  async _postToLinkedIn(userId, content, imageUrl = null) {
    try {
      const account = await SocialAccount.findOne({ 
        user: userId, 
        platform: 'linkedin',
        isActive: true 
      });

      if (!account) {
        throw new Error('LinkedIn account not connected');
      }

      // LinkedIn API v2 endpoint
      const url = 'https://api.linkedin.com/v2/ugcPosts';
      
      const payload = {
        author: `urn:li:person:${account.accountId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      if (imageUrl) {
        try {
          // First upload image, then attach to post
          const imageUrn = await this.uploadLinkedInImage(account.accessToken, imageUrl);
          payload.specificContent['com.linkedin.ugc.ShareContent'].media = [{
            status: 'READY',
            media: imageUrn,
            title: {
              text: 'Social Media Post'
            }
          }];
        } catch (imageError) {
          console.warn('Image upload failed, posting text-only:', imageError.message);
          // Graceful degradation: post without image
          payload.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'NONE';
        }
      }

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${account.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      return {
        platform: 'linkedin',
        postId: response.data.id,
        url: `https://www.linkedin.com/feed/update/${response.data.id}`,
        status: 'success',
        postedAt: new Date()
      };
    } catch (error) {
      console.error('LinkedIn posting error:', error.response?.data || error.message);
      throw new Error(`LinkedIn posting failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Upload image to LinkedIn
   */
  async uploadLinkedInImage(accessToken, imageUrl) {
    // Simplified - in production, you'd need to:
    // 1. Download the image
    // 2. Upload to LinkedIn's upload endpoint
    // 3. Get the URN
    // This is a placeholder implementation
    return `urn:li:image:${Date.now()}`;
  }

  /**
   * Post to Facebook with retry
   */
  async postToFacebook(userId, content, imageUrl = null) {
    return this.retryOperation(async () => {
      return await this._postToFacebook(userId, content, imageUrl);
    });
  }

  async _postToFacebook(userId, content, imageUrl = null) {
    try {
      const account = await SocialAccount.findOne({ 
        user: userId, 
        platform: 'facebook',
        isActive: true 
      });

      if (!account) {
        throw new Error('Facebook account not connected');
      }

      const url = `https://graph.facebook.com/v18.0/${account.accountId}/feed`;
      
      const params = {
        message: content,
        access_token: account.accessToken
      };

      if (imageUrl) {
        try {
          params.link = imageUrl;
        } catch (imageError) {
          console.warn('Image attachment failed, posting text-only:', imageError.message);
          // Continue without image
        }
      }

      const response = await axios.post(url, null, { params });

      return {
        platform: 'facebook',
        postId: response.data.id,
        url: `https://www.facebook.com/${response.data.id}`,
        status: 'success',
        postedAt: new Date()
      };
    } catch (error) {
      console.error('Facebook posting error:', error.response?.data || error.message);
      throw new Error(`Facebook posting failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Post to Twitter/X with retry
   */
  async postToTwitter(userId, content, imageUrl = null) {
    return this.retryOperation(async () => {
      return await this._postToTwitter(userId, content, imageUrl);
    });
  }

  async _postToTwitter(userId, content, imageUrl = null) {
    try {
      const account = await SocialAccount.findOne({ 
        user: userId, 
        platform: 'twitter',
        isActive: true 
      });

      if (!account) {
        throw new Error('Twitter account not connected');
      }

      // Twitter API v2
      const url = 'https://api.twitter.com/2/tweets';
      
      const payload = {
        text: content
      };

      if (imageUrl) {
        try {
          // Upload media first, then attach media_id to tweet
          const mediaId = await this.uploadTwitterMedia(account.accessToken, imageUrl);
          payload.media = {
            media_ids: [mediaId]
          };
        } catch (imageError) {
          console.warn('Image upload failed, posting text-only:', imageError.message);
          // Continue without image
        }
      }

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${account.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        platform: 'twitter',
        postId: response.data.data.id,
        url: `https://twitter.com/i/web/status/${response.data.data.id}`,
        status: 'success',
        postedAt: new Date()
      };
    } catch (error) {
      console.error('Twitter posting error:', error.response?.data || error.message);
      throw new Error(`Twitter posting failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Upload media to Twitter
   */
  async uploadTwitterMedia(accessToken, imageUrl) {
    // Simplified - in production, implement full media upload flow
    return `media_${Date.now()}`;
  }

  /**
   * Post to Instagram with retry
   */
  async postToInstagram(userId, content, imageUrl = null) {
    return this.retryOperation(async () => {
      return await this._postToInstagram(userId, content, imageUrl);
    });
  }

  async _postToInstagram(userId, content, imageUrl = null) {
    try {
      const account = await SocialAccount.findOne({ 
        user: userId, 
        platform: 'instagram',
        isActive: true 
      });

      if (!account) {
        throw new Error('Instagram account not connected');
      }

      if (!imageUrl) {
        throw new Error('Instagram requires an image');
      }

      // Instagram Graph API
      // Step 1: Create media container
      const containerUrl = `https://graph.facebook.com/v18.0/${account.accountId}/media`;
      const containerParams = {
        image_url: imageUrl,
        caption: content,
        access_token: account.accessToken
      };

      const containerResponse = await axios.post(containerUrl, null, { params: containerParams });
      const creationId = containerResponse.data.id;

      // Step 2: Publish the media
      const publishUrl = `https://graph.facebook.com/v18.0/${account.accountId}/media_publish`;
      const publishParams = {
        creation_id: creationId,
        access_token: account.accessToken
      };

      const publishResponse = await axios.post(publishUrl, null, { params: publishParams });

      return {
        platform: 'instagram',
        postId: publishResponse.data.id,
        url: `https://www.instagram.com/p/${publishResponse.data.id}/`,
        status: 'success',
        postedAt: new Date()
      };
    } catch (error) {
      console.error('Instagram posting error:', error.response?.data || error.message);
      throw new Error(`Instagram posting failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Post to multiple platforms with platform-specific image variants
   */
  async postToPlatforms(userId, content, platforms, imageData = null) {
    const results = [];

    for (const platform of platforms) {
      try {
        // Get platform-specific image URL if available
        const platformImageUrl = imageService.getImageForPlatform(imageData, platform);
        
        let result;
        switch (platform) {
          case 'linkedin':
            result = await this.postToLinkedIn(userId, content, platformImageUrl);
            break;
          case 'facebook':
            result = await this.postToFacebook(userId, content, platformImageUrl);
            break;
          case 'twitter':
            result = await this.postToTwitter(userId, content, platformImageUrl);
            break;
          case 'instagram':
            result = await this.postToInstagram(userId, content, platformImageUrl);
            break;
          default:
            throw new Error(`Unsupported platform: ${platform}`);
        }
        results.push(result);
      } catch (error) {
        console.error(`Error posting to ${platform}:`, error);
        results.push({
          platform,
          status: 'failed',
          error: error.message,
          postedAt: new Date()
        });
      }
    }

    return results;
  }
}

module.exports = new SocialMediaService();

