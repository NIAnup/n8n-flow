const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Optional sharp dependency for image resizing
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.warn('Sharp not installed. Image resizing will be limited.');
}

// Platform-specific image dimensions
const PLATFORM_DIMENSIONS = {
  linkedin: { width: 1200, height: 627 }, // LinkedIn recommended
  facebook: { width: 1200, height: 630 },  // Facebook recommended
  twitter: { width: 1200, height: 675 },  // Twitter/X recommended
  instagram: { width: 1080, height: 1080 } // Instagram square
};

class ImageService {
  /**
   * Download image from URL
   */
  async downloadImage(imageUrl) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }

  /**
   * Resize image for specific platform
   */
  async resizeForPlatform(imageBuffer, platform) {
    try {
      if (!sharp) {
        // If sharp is not available, return original buffer
        console.warn('Sharp not available, using original image size');
        return imageBuffer;
      }

      const dimensions = PLATFORM_DIMENSIONS[platform];
      if (!dimensions) {
        throw new Error(`Unknown platform: ${platform}`);
      }

      const resized = await sharp(imageBuffer)
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      return resized;
    } catch (error) {
      throw new Error(`Failed to resize image for ${platform}: ${error.message}`);
    }
  }

  /**
   * Save image to local storage
   */
  async saveImage(imageBuffer, filename) {
    try {
      const uploadsDir = path.join(__dirname, '../uploads/images');
      await fs.mkdir(uploadsDir, { recursive: true });
      
      const filePath = path.join(uploadsDir, filename);
      await fs.writeFile(filePath, imageBuffer);
      
      return `/uploads/images/${filename}`;
    } catch (error) {
      throw new Error(`Failed to save image: ${error.message}`);
    }
  }

  /**
   * Generate platform-specific image variants
   */
  async generatePlatformVariants(originalImageUrl) {
    try {
      // Download original image
      const imageBuffer = await this.downloadImage(originalImageUrl);
      
      const variants = {};
      const platforms = Object.keys(PLATFORM_DIMENSIONS);
      
      for (const platform of platforms) {
        try {
          const resized = await this.resizeForPlatform(imageBuffer, platform);
          const filename = `${Date.now()}-${platform}.jpg`;
          const url = await this.saveImage(resized, filename);
          variants[platform] = url;
        } catch (error) {
          console.error(`Error creating variant for ${platform}:`, error);
          // Fallback to original if resize fails
          variants[platform] = originalImageUrl;
        }
      }
      
      return variants;
    } catch (error) {
      throw new Error(`Failed to generate platform variants: ${error.message}`);
    }
  }

  /**
   * Get image URL for platform (with fallback)
   */
  getImageForPlatform(imageData, platform) {
    if (!imageData) return null;
    
    // Try platform-specific variant first
    if (imageData.platformVariants && imageData.platformVariants[platform]) {
      return imageData.platformVariants[platform];
    }
    
    // Fallback to original
    return imageData.url || null;
  }
}

module.exports = new ImageService();

