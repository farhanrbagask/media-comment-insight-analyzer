const axios = require('axios');
const env = require('../../config/env');

/**
 * TikTokService — fetches post data and comments using TikTok Research API.
 *
 * Requirements:
 *   TIKTOK_CLIENT_KEY    — TikTok Developer App client key
 *   TIKTOK_CLIENT_SECRET — TikTok Developer App client secret
 *
 * The Research API requires an approved Research API application.
 * Endpoint: POST https://open.tiktokapis.com/v2/research/video/comment/list/
 */

const TIKTOK_BASE = 'https://open.tiktokapis.com/v2';
let _cachedToken = null;
let _tokenExpiry = 0;

/**
 * Get or refresh the client credentials access token.
 */
const _getAccessToken = async () => {
  if (_cachedToken && Date.now() < _tokenExpiry - 60000) {
    return _cachedToken;
  }

  const { clientKey, clientSecret } = env.tiktok;
  if (!clientKey || !clientSecret) {
    throw Object.assign(
      new Error('TikTok API credentials are not configured. Set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET in .env'),
      { code: 'FETCH_FAILED', statusCode: 503 }
    );
  }

  const resp = await axios.post(
    'https://open.tiktokapis.com/v2/oauth/token/',
    new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
  );

  _cachedToken = resp.data.access_token;
  _tokenExpiry = Date.now() + (resp.data.expires_in * 1000);
  return _cachedToken;
};

/**
 * Extract video ID from TikTok URL.
 */
const _extractVideoId = (url) => {
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
};

/**
 * Fetch a TikTok video and its comments.
 * @param {string} url    - Original TikTok URL
 * @param {string} postId - Video ID (from URL)
 */
const fetchPost = async (url, postId) => {
  try {
    const token = await _getAccessToken();
    const videoId = _extractVideoId(url) || postId;

    // Fetch video info
    const videoResp = await axios.post(
      `${TIKTOK_BASE}/research/video/query/`,
      {
        query: { and: [{ operation: 'EQ', field_name: 'id', field_values: [videoId] }] },
        fields: 'id,author_name,video_description,create_time,like_count,comment_count,cover_image_url',
        max_count: 1,
      },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
    );

    const video = videoResp.data?.data?.videos?.[0] || {};

    // Fetch comments
    const comments = await _fetchAllComments(videoId, token);

    return {
      platform: 'tiktok',
      postId: videoId,
      author: video.author_name || null,
      caption: video.video_description || null,
      publishedAt: video.create_time ? new Date(video.create_time * 1000).toISOString() : null,
      likeCount: video.like_count || 0,
      commentCount: video.comment_count || 0,
      thumbnailUrl: video.cover_image_url || null,
      comments,
    };
  } catch (err) {
    if (err.code === 'FETCH_FAILED') throw err;
    const status = err.response?.data?.error?.code;
    let message = 'Unable to fetch TikTok video data.';
    if (status === 'rate_limit_exceeded') message = 'TikTok API rate limit exceeded. Try again later.';
    if (status === 'invalid_video_id')   message = 'TikTok video not found or not accessible.';
    throw Object.assign(new Error(message), { code: 'FETCH_FAILED', statusCode: 503 });
  }
};

const _fetchAllComments = async (videoId, token) => {
  const comments = [];
  let cursor = 0;
  let hasMore = true;

  while (hasMore && comments.length < 1000) { // cap at 1000 for safety
    const resp = await axios.post(
      `${TIKTOK_BASE}/research/video/comment/list/`,
      { video_id: videoId, max_count: 100, cursor },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
    );

    const data = resp.data?.data || {};
    (data.comments || []).forEach(c => {
      comments.push({
        commentId: String(c.id),
        username: c.author_name || null,
        text: c.text || '',
        publishedAt: c.create_time ? new Date(c.create_time * 1000).toISOString() : null,
        likeCount: c.like_count || 0,
      });
    });

    hasMore = data.has_more || false;
    cursor = data.cursor || 0;
  }

  return comments;
};

module.exports = { fetchPost };
