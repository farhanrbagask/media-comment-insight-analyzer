const db = require('../config/db');

/**
 * PostService — CRUD operations for posts table.
 */

const findById = async (id) => {
  const { rows } = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
  return rows[0] || null;
};

const findByPlatformPostId = async (platform, platformPostId) => {
  const { rows } = await db.query(
    'SELECT * FROM posts WHERE platform = $1 AND platform_post_id = $2',
    [platform, platformPostId]
  );
  return rows[0] || null;
};

const create = async (postData) => {
  const {
    platform, platformPostId, url, author, caption,
    publishedAt, likeCount, commentCount, thumbnailUrl,
  } = postData;

  const { rows } = await db.query(
    `INSERT INTO posts
       (platform, platform_post_id, url, author, caption,
        published_at, like_count, comment_count, thumbnail_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [platform, platformPostId, url, author, caption,
     publishedAt, likeCount || 0, commentCount || 0, thumbnailUrl]
  );
  return rows[0];
};

const update = async (id, updates) => {
  const fields = [];
  const values = [];
  let idx = 1;

  const allowed = ['author', 'caption', 'published_at', 'like_count', 'comment_count', 'thumbnail_url'];
  for (const [key, val] of Object.entries(updates)) {
    if (allowed.includes(key)) {
      fields.push(`${key} = $${idx++}`);
      values.push(val);
    }
  }
  if (!fields.length) return findById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await db.query(
    `UPDATE posts SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] || null;
};

module.exports = { findById, findByPlatformPostId, create, update };
