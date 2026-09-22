const db = require('../config/db');

/**
 * CommentService — CRUD operations for comments table.
 */

const bulkInsert = async (postId, analysisId, comments) => {
  if (!comments || comments.length === 0) return [];

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const inserted = [];
    for (const c of comments) {
      const { rows } = await client.query(
        `INSERT INTO comments
           (post_id, analysis_id, platform_comment_id, username,
            raw_text, processed_text, published_at, like_count,
            sentiment, sentiment_score, topic)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [
          postId, analysisId, c.platformCommentId, c.username,
          c.rawText, c.processedText, c.publishedAt, c.likeCount || 0,
          c.sentiment, c.sentimentScore, c.topic,
        ]
      );
      inserted.push(rows[0]);
    }
    await client.query('COMMIT');
    return inserted;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getCommentsForAnalysis = async (analysisId, options = {}) => {
  const {
    page = 1, limit = 50, sentiment, search,
    sortBy = 'created_at', sortOrder = 'desc',
  } = options;

  const offset = (page - 1) * limit;
  const conditions = ['c.analysis_id = $1'];
  const values = [analysisId];
  let idx = 2;

  if (sentiment) {
    conditions.push(`c.sentiment = $${idx++}`);
    values.push(sentiment);
  }
  if (search) {
    conditions.push(`c.raw_text ILIKE $${idx++}`);
    values.push(`%${search}%`);
  }

  const allowedSort = ['created_at', 'sentiment_score', 'like_count', 'published_at'];
  const safeSort = allowedSort.includes(sortBy) ? sortBy : 'created_at';
  const safeOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await db.query(
    `SELECT COUNT(*) FROM comments c ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataResult = await db.query(
    `SELECT c.* FROM comments c
     ${whereClause}
     ORDER BY c.${safeSort} ${safeOrder}
     LIMIT $${idx++} OFFSET $${idx}`,
    [...values, limit, offset]
  );

  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const deleteByAnalysisId = async (analysisId, client) => {
  const q = client || db;
  await q.query('DELETE FROM comments WHERE analysis_id = $1', [analysisId]);
};

module.exports = { bulkInsert, getCommentsForAnalysis, deleteByAnalysisId };
