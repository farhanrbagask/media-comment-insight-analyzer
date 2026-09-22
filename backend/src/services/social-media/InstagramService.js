const axios = require('axios');
const env = require('../../config/env');

/**
 * InstagramService — fetches post data and comments using Instagram Graph API.
 *
 * Requirements:
 *   IG_ACCESS_TOKEN — a long-lived User or Page access token
 *   IG_USER_ID      — the Instagram Business/Creator Account user ID
 *
 * Permissions needed: instagram_basic, instagram_manage_comments (or pages_read_engagement)
 *
 * NOTE: The Graph API v18+ requires the media to be owned by the authenticated account
 * for comment access. Public post comment fetching requires special permissions.
 */

const GRAPH_BASE = 'https://graph.instagram.com/v18.0';

/**
 * Fetch a post and its comments from Instagram.
 * @param {string} url    - Original Instagram URL
 * @param {string} postId - Instagram shortcode (from URL)
 */
const fetchPost = async (url, postId) => {
  const { accessToken } = env.instagram;

  if (!accessToken) {
    throw Object.assign(
      new Error('Instagram API credentials are not configured. Set IG_ACCESS_TOKEN in .env'),
      { code: 'FETCH_FAILED', statusCode: 503 }
    );
  }

  try {
    // Step 1: Resolve shortcode to media ID via oEmbed (no auth required)
    const oembedResp = await axios.get('https://graph.facebook.com/v18.0/instagram_oembed', {
      params: { url, access_token: accessToken, fields: 'media_id' },
      timeout: 15000,
    });
    const mediaId = oembedResp.data.media_id;

    // Step 2: Fetch post metadata
    const mediaResp = await axios.get(`${GRAPH_BASE}/${mediaId}`, {
      params: {
        fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,username',
        access_token: accessToken,
      },
      timeout: 15000,
    });
    const media = mediaResp.data;

    // Step 3: Fetch comments (paginated)
    const comments = await _fetchAllComments(mediaId, accessToken);

    return {
      platform: 'instagram',
      postId: mediaId,
      author: media.username || null,
      caption: media.caption || null,
      publishedAt: media.timestamp || null,
      likeCount: media.like_count || 0,
      commentCount: media.comments_count || 0,
      thumbnailUrl: media.thumbnail_url || media.media_url || null,
      comments,
    };
  } catch (err) {
    if (err.response?.data?.error) {
      const igError = err.response.data.error;
      let message = igError.message || 'Instagram API error.';
      if (igError.code === 100) message = 'Post not found or is not accessible.';
      if (igError.code === 10)  message = 'Insufficient API permissions.';
      if (igError.code === 4)   message = 'Instagram API rate limit exceeded. Try again later.';
      if (igError.code === 190) message = 'Instagram access token is invalid or expired.';
      throw Object.assign(new Error(message), { code: 'FETCH_FAILED', statusCode: 503 });
    }
    if (!err.code || err.code === 'FETCH_FAILED') throw err;
    throw Object.assign(new Error('Unable to connect to Instagram API.'), { code: 'FETCH_FAILED', statusCode: 503 });
  }
};

const _fetchAllComments = async (mediaId, accessToken) => {
  const comments = [];
  let url = `${GRAPH_BASE}/${mediaId}/comments`;
  let params = {
    fields: 'id,text,username,timestamp,like_count',
    access_token: accessToken,
    limit: 100,
  };

  while (url) {
    const resp = await axios.get(url, { params, timeout: 15000 });
    const data = resp.data;

    (data.data || []).forEach(c => {
      comments.push({
        commentId: c.id,
        username: c.username || null,
        text: c.text || '',
        publishedAt: c.timestamp || null,
        likeCount: c.like_count || 0,
      });
    });

    url = data.paging?.next || null;
    params = {}; // next URL already includes all params
  }

  return comments;
};

module.exports = { fetchPost };
