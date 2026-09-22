const InstagramService = require('./InstagramService');
const TikTokService = require('./TikTokService');
const MockService = require('./MockService');

/**
 * SocialMediaService — routes fetch requests to the correct platform service.
 * Each platform service must implement:
 *   fetchPost(url, postId) → { platform, postId, author, caption, publishedAt,
 *                              likeCount, commentCount, thumbnailUrl, comments[] }
 */

const services = {
  instagram: InstagramService,
  tiktok: TikTokService,
};

/**
 * @param {string} platform - 'instagram' | 'tiktok'
 * @param {string} url
 * @param {string} postId
 */
const fetchPost = async (platform, url, postId) => {
  // Allow forcing mock mode via env for development/testing
  if (process.env.USE_MOCK_SERVICE === 'true') {
    console.warn('⚠️  Using MOCK social media service (USE_MOCK_SERVICE=true)');
    return MockService.fetchPost(platform, url, postId);
  }

  const service = services[platform];
  if (!service) {
    throw Object.assign(new Error(`Unsupported platform: ${platform}`), { code: 'UNSUPPORTED_PLATFORM' });
  }

  return service.fetchPost(url, postId);
};

module.exports = { fetchPost };
