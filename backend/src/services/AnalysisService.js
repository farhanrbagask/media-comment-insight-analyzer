const axios = require('axios');
const db = require('../config/db');
const PostService = require('./PostService');
const CommentService = require('./CommentService');
const SocialMediaService = require('./social-media/SocialMediaService');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const updateStatus = async (analysisId, status, errorMessage = null) => {
  await db.query(
    `UPDATE analyses SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3`,
    [status, errorMessage, analysisId]
  );
};

const createAnalysisRecord = async (postId) => {
  const { rows } = await db.query(
    `INSERT INTO analyses (post_id, status) VALUES ($1, 'pending') RETURNING *`,
    [postId]
  );
  return rows[0];
};

// ─── Public API ───────────────────────────────────────────────────────────────

const findById = async (id) => {
  const { rows } = await db.query('SELECT * FROM analyses WHERE id = $1', [id]);
  return rows[0] || null;
};

const getLatestForPost = async (postId) => {
  const { rows } = await db.query(
    `SELECT * FROM analyses WHERE post_id = $1 AND is_latest = true ORDER BY created_at DESC LIMIT 1`,
    [postId]
  );
  return rows[0] || null;
};

const getAnalysisDetail = async (id) => {
  const { rows: analysisRows } = await db.query(
    `SELECT a.*, p.platform, p.url, p.author, p.caption, p.published_at as post_published_at,
            p.like_count as post_like_count, p.comment_count as post_comment_count, p.thumbnail_url
     FROM analyses a
     JOIN posts p ON p.id = a.post_id
     WHERE a.id = $1`,
    [id]
  );
  if (!analysisRows[0]) return null;

  const analysis = analysisRows[0];

  const { rows: keywords } = await db.query(
    `SELECT * FROM keywords WHERE analysis_id = $1 ORDER BY frequency DESC`,
    [id]
  );
  const { rows: topics } = await db.query(
    `SELECT * FROM topics WHERE analysis_id = $1 ORDER BY frequency DESC`,
    [id]
  );

  return { ...analysis, keywords, topics };
};

const listAnalyses = async (opts) => {
  const {
    page, limit, platform, status, sentiment,
    dateFrom, dateTo, search, sortBy, sortOrder,
  } = opts;

  const offset = (page - 1) * limit;
  const conditions = [];
  const values = [];
  let idx = 1;

  if (platform) { conditions.push(`p.platform = $${idx++}`); values.push(platform); }
  if (status)   { conditions.push(`a.status = $${idx++}`);   values.push(status); }
  if (dateFrom) { conditions.push(`a.created_at >= $${idx++}`); values.push(dateFrom); }
  if (dateTo)   { conditions.push(`a.created_at <= $${idx++}`); values.push(dateTo); }
  if (search)   {
    conditions.push(`(p.url ILIKE $${idx} OR p.author ILIKE $${idx} OR p.caption ILIKE $${idx})`);
    values.push(`%${search}%`); idx++;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const allowedSort = ['created_at', 'total_comments', 'positive_percentage'];
  const safeSort = allowedSort.includes(sortBy) ? `a.${sortBy}` : 'a.created_at';
  const safeOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const countResult = await db.query(
    `SELECT COUNT(*) FROM analyses a JOIN posts p ON p.id = a.post_id ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataResult = await db.query(
    `SELECT a.*, p.platform, p.url, p.author, p.thumbnail_url
     FROM analyses a JOIN posts p ON p.id = a.post_id
     ${whereClause}
     ORDER BY ${safeSort} ${safeOrder}
     LIMIT $${idx++} OFFSET $${idx}`,
    [...values, limit, offset]
  );

  return {
    data: dataResult.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const deleteAnalysis = async (id) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Reset is_latest for sibling analyses if needed
    const { rows: [analysis] } = await client.query('SELECT * FROM analyses WHERE id = $1', [id]);
    if (!analysis) { await client.query('ROLLBACK'); return false; }

    // Delete cascades to keywords, topics, and sets comments.analysis_id to NULL
    await client.query('DELETE FROM analyses WHERE id = $1', [id]);

    // If this was latest, promote the next newest
    if (analysis.is_latest) {
      await client.query(
        `UPDATE analyses SET is_latest = true
         WHERE id = (SELECT id FROM analyses WHERE post_id = $1 ORDER BY created_at DESC LIMIT 1)`,
        [analysis.post_id]
      );
    }

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Main orchestrator — runs the full analysis pipeline.
 * @param {string} url        - The post URL
 * @param {object} validation - { platform, postId }
 * @param {number} existingPostId - If re-analyzing, the post ID already in DB
 */
const startAnalysis = async (url, validation, existingPostId = null) => {
  let post;
  let analysis;

  try {
    // 1. Create or retrieve post record
    if (existingPostId) {
      post = await PostService.findById(existingPostId);
    } else {
      post = await PostService.create({
        platform: validation.platform,
        platformPostId: validation.postId,
        url,
      });
    }

    // 2. Create analysis record (pending)
    analysis = await createAnalysisRecord(post.id);

    // 3. Mark previous analyses as not-latest
    await db.query(
      `UPDATE analyses SET is_latest = false WHERE post_id = $1 AND id != $2`,
      [post.id, analysis.id]
    );

    // Run pipeline asynchronously (fire and forget — client polls status)
    _runPipeline(post, analysis.id, url, validation).catch((err) => {
      console.error(`Pipeline error for analysis ${analysis.id}:`, err.message);
    });

    return { post, analysis };
  } catch (err) {
    throw err;
  }
};

/**
 * Internal pipeline runner (async).
 */
const _runPipeline = async (post, analysisId, url, validation) => {
  try {
    // ── FETCHING ──────────────────────────────────────────────────────────────
    await updateStatus(analysisId, 'fetching');

    const fetchedData = await SocialMediaService.fetchPost(validation.platform, url, validation.postId);

    // Update post metadata with fresh data
    await PostService.update(post.id, {
      author: fetchedData.author,
      caption: fetchedData.caption,
      published_at: fetchedData.publishedAt,
      like_count: fetchedData.likeCount,
      comment_count: fetchedData.commentCount,
      thumbnail_url: fetchedData.thumbnailUrl,
    });

    await db.query(
      `UPDATE analyses SET fetched_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [analysisId]
    );

    const rawComments = fetchedData.comments || [];

    if (rawComments.length === 0) {
      await updateStatus(analysisId, 'failed', 'No comments found on this post.');
      return;
    }

    // ── PROCESSING ────────────────────────────────────────────────────────────
    await updateStatus(analysisId, 'processing');

    // Call ML service
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/analyze`, {
      comments: rawComments.map(c => c.text),
    }, { timeout: 120000 });

    const mlData = mlResponse.data;

    // ── SAVE RESULTS ──────────────────────────────────────────────────────────
    const enrichedComments = rawComments.map((c, i) => ({
      platformCommentId: c.commentId,
      username: c.username,
      rawText: c.text,
      processedText: mlData.comments[i]?.processed_text || c.text,
      publishedAt: c.publishedAt,
      likeCount: c.likeCount,
      sentiment: mlData.comments[i]?.sentiment || 'neutral',
      sentimentScore: mlData.comments[i]?.score || 0,
      topic: mlData.comments[i]?.topic || null,
    }));

    await CommentService.bulkInsert(post.id, analysisId, enrichedComments);

    // Aggregate sentiment statistics
    const total = enrichedComments.length;
    const positiveCount = enrichedComments.filter(c => c.sentiment === 'positive').length;
    const neutralCount  = enrichedComments.filter(c => c.sentiment === 'neutral').length;
    const negativeCount = enrichedComments.filter(c => c.sentiment === 'negative').length;

    // Save keywords
    if (mlData.keywords?.length) {
      for (const kw of mlData.keywords) {
        await db.query(
          `INSERT INTO keywords (analysis_id, keyword, frequency, percentage) VALUES ($1,$2,$3,$4)`,
          [analysisId, kw.keyword, kw.frequency, kw.percentage || 0]
        );
      }
    }

    // Save topics
    if (mlData.topics?.length) {
      for (const t of mlData.topics) {
        await db.query(
          `INSERT INTO topics (analysis_id, topic, frequency, percentage) VALUES ($1,$2,$3,$4)`,
          [analysisId, t.topic, t.frequency, t.percentage || 0]
        );
      }
    }

    // Update analysis record to completed
    await db.query(
      `UPDATE analyses SET
         status = 'completed',
         total_comments = $1,
         positive_count = $2, neutral_count = $3, negative_count = $4,
         positive_percentage = $5, neutral_percentage = $6, negative_percentage = $7,
         generated_insight = $8,
         updated_at = NOW()
       WHERE id = $9`,
      [
        total,
        positiveCount, neutralCount, negativeCount,
        total > 0 ? ((positiveCount / total) * 100).toFixed(2) : 0,
        total > 0 ? ((neutralCount  / total) * 100).toFixed(2) : 0,
        total > 0 ? ((negativeCount / total) * 100).toFixed(2) : 0,
        JSON.stringify(mlData.insight),
        analysisId,
      ]
    );

  } catch (err) {
    let message = err.message || 'Pipeline failed.';
    if (err.response?.data?.detail) message = err.response.data.detail;
    await updateStatus(analysisId, 'failed', message);
    throw err;
  }
};

module.exports = {
  findById,
  getLatestForPost,
  getAnalysisDetail,
  listAnalyses,
  deleteAnalysis,
  startAnalysis,
};
