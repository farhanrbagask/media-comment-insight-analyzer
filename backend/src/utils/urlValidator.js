/**
 * URL validator — determines platform and extracts post ID from social media URLs.
 */

const PATTERNS = {
  instagram: [
    // Standard post: /p/POST_ID/
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/p\/([A-Za-z0-9_\-]+)\/?/,
    // Reel: /reel/REEL_ID/
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/reel\/([A-Za-z0-9_\-]+)\/?/,
    // TV: /tv/ID/
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/tv\/([A-Za-z0-9_\-]+)\/?/,
  ],
  tiktok: [
    // Standard: /@username/video/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.]+\/video\/(\d+)\/?/,
    // Short URL: vm.tiktok.com/XXXXX
    /(?:https?:\/\/)?vm\.tiktok\.com\/([A-Za-z0-9]+)\/?/,
  ],
};

/**
 * Validate a social media URL.
 * @param {string} url - The URL to validate
 * @returns {{ valid: boolean, platform: string|null, postId: string|null, error: string|null }}
 */
const validateUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return { valid: false, platform: null, postId: null, error: 'URL is required.' };
  }

  const trimmed = url.trim();

  // Basic URL format check
  try {
    new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
  } catch {
    return { valid: false, platform: null, postId: null, error: 'Invalid URL format.' };
  }

  // Check each platform
  for (const [platform, patterns] of Object.entries(PATTERNS)) {
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        return { valid: true, platform, postId: match[1], error: null };
      }
    }
  }

  return {
    valid: false,
    platform: null,
    postId: null,
    error: 'Unsupported platform. Only Instagram and TikTok URLs are supported.',
  };
};

module.exports = { validateUrl };
