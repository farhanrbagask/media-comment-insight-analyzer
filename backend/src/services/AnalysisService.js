const axios = require('axios');
const db = require('../config/db');
const PostService = require('./PostService');
const CommentService = require('./CommentService');

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
 * Start analysis from pre-parsed CSV comments (skips social-media fetching).
 * Called by the import confirm endpoint.
 *
 * @param {number} postId    - Existing post ID in DB
 * @param {Array}  comments  - Cleaned comment objects from CsvImportService
 * @returns {{ analysis: object }}
 */
const startFromComments = async (postId, comments) => {
  const analysis = await createAnalysisRecord(postId);

  // Mark previous analyses as not-latest
  await db.query(
    `UPDATE analyses SET is_latest = false WHERE post_id = $1 AND id != $2`,
    [postId, analysis.id]
  );

  // Fire-and-forget — client polls /api/analyses/:id for status
  _runPipelineFromComments(postId, analysis.id, comments).catch((err) => {
    console.error(`[Import pipeline] Error for analysis ${analysis.id}:`, err.message);
  });

  return { analysis };
};

/**
 * (Legacy) Start analysis by fetching from a social-media URL.
 * Still used by the re-analyze feature on existing DB posts.
 *
 * @param {string} url
 * @param {object} validation - { platform, postId }
 * @param {number} existingPostId
 */
const startAnalysis = async (url, validation, existingPostId = null) => {
  let post;
  let analysis;

  try {
    if (existingPostId) {
      post = await PostService.findById(existingPostId);
    } else {
      post = await PostService.create({
        platform: validation.platform,
        platformPostId: validation.postId,
        url,
      });
    }

    analysis = await createAnalysisRecord(post.id);

    await db.query(
      `UPDATE analyses SET is_latest = false WHERE post_id = $1 AND id != $2`,
      [post.id, analysis.id]
    );

    // Re-analyze: run ML on comments already stored in the DB
    _runPipelineFromDb(post, analysis.id).catch((err) => {
      console.error(`[Reanalyze pipeline] Error for analysis ${analysis.id}:`, err.message);
    });

    return { post, analysis };
  } catch (err) {
    throw err;
  }
};

/**
 * Shared helper — runs the ML + save pipeline given a list of raw comment texts.
 * Used by both the CSV import flow and the re-analyze (from DB) flow.
 *
 * @param {number} postId
 * @param {number} analysisId
 * @param {{ rawText: string, platformCommentId?: string, username?: string, publishedAt?: string }[]} commentObjects
 */
const _runMlAndSave = async (postId, analysisId, commentObjects) => {
  await updateStatus(analysisId, 'processing');

  const rawTexts = commentObjects.map(c => c.rawText);

  // Call ML Service
  const mlResponse = await axios.post(
    `${ML_SERVICE_URL}/analyze`,
    { comments: rawTexts },
    { timeout: 120_000 }
  );
  const mlData = mlResponse.data;

  // Build enriched comments
  const enrichedComments = commentObjects.map((c, i) => ({
    platformCommentId: c.platformCommentId || null,
    username:          c.username          || null,
    rawText:           c.rawText,
    processedText:     mlData.comments[i]?.processed_text || c.rawText,
    publishedAt:       c.publishedAt       || null,
    likeCount:         0,
    sentiment:         mlData.comments[i]?.sentiment || 'neutral',
    sentimentScore:    mlData.comments[i]?.score     || 0,
    topic:             mlData.comments[i]?.topic     || null,
  }));

  await CommentService.bulkInsert(postId, analysisId, enrichedComments);

  const total         = enrichedComments.length;
  const positiveCount = enrichedComments.filter(c => c.sentiment === 'positive').length;
  const neutralCount  = enrichedComments.filter(c => c.sentiment === 'neutral').length;
  const negativeCount = enrichedComments.filter(c => c.sentiment === 'negative').length;

  // Save keywords
  for (const kw of mlData.keywords ?? []) {
    await db.query(
      `INSERT INTO keywords (analysis_id, keyword, frequency, percentage) VALUES ($1,$2,$3,$4)`,
      [analysisId, kw.keyword, kw.frequency, kw.percentage || 0]
    );
  }

  // Save topics
  for (const t of mlData.topics ?? []) {
    await db.query(
      `INSERT INTO topics (analysis_id, topic, frequency, percentage) VALUES ($1,$2,$3,$4)`,
      [analysisId, t.topic, t.frequency, t.percentage || 0]
    );
  }

  // Mark analysis as completed
  await db.query(
    `UPDATE analyses SET
       status = 'completed',
       total_comments       = $1,
       positive_count       = $2,
       neutral_count        = $3,
       negative_count       = $4,
       positive_percentage  = $5,
       neutral_percentage   = $6,
       negative_percentage  = $7,
       generated_insight    = $8,
       updated_at           = NOW()
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
};

/**
 * Pipeline: CSV import path — comments come directly from CsvImportService.
 */
const _runPipelineFromComments = async (postId, analysisId, commentObjects) => {
  try {
    if (!commentObjects.length) {
      await updateStatus(analysisId, 'failed', 'No valid comments to analyze.');
      return;
    }
    await _runMlAndSave(postId, analysisId, commentObjects);
  } catch (err) {
    const message = err.response?.data?.detail || err.message || 'Pipeline failed.';
    await updateStatus(analysisId, 'failed', message);
    throw err;
  }
};

/**
 * Pipeline: Re-analyze path — load comments from the DB and re-run ML.
 * This keeps re-analyze working without needing the original CSV.
 */
const _runPipelineFromDb = async (post, analysisId) => {
  try {
    // Load all comments for the most recent completed analysis of this post
    const { rows } = await db.query(
      `SELECT raw_text, platform_comment_id, username, published_at
       FROM comments
       WHERE post_id = $1 AND is_skipped = false
       ORDER BY id ASC`,
      [post.id]
    );

    if (!rows.length) {
      await updateStatus(analysisId, 'failed', 'No stored comments found to re-analyze.');
      return;
    }

    const commentObjects = rows.map(r => ({
      rawText:           r.raw_text,
      platformCommentId: r.platform_comment_id,
      username:          r.username,
      publishedAt:       r.published_at,
    }));

    await _runMlAndSave(post.id, analysisId, commentObjects);
  } catch (err) {
    const message = err.response?.data?.detail || err.message || 'Re-analyze failed.';
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
  startFromComments,
};
