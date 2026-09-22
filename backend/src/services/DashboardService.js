const db = require('../config/db');

/**
 * DashboardService — aggregates stored analysis data for dashboard views.
 * Never fetches from Instagram/TikTok directly.
 */

const _buildWhereClause = (filters) => {
  const conditions = ["a.status = 'completed'"];
  const values = [];
  let idx = 1;

  if (filters.platform) {
    conditions.push(`p.platform = $${idx++}`);
    values.push(filters.platform);
  }
  if (filters.dateFrom) {
    conditions.push(`a.created_at >= $${idx++}`);
    values.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push(`a.created_at <= $${idx++}`);
    values.push(filters.dateTo);
  }

  return { clause: `WHERE ${conditions.join(' AND ')}`, values, nextIdx: idx };
};

const getSummary = async (filters) => {
  const { clause, values } = _buildWhereClause(filters);

  const { rows } = await db.query(
    `SELECT
       COUNT(DISTINCT a.id)::int              AS total_analyses,
       COUNT(DISTINCT a.post_id)::int         AS total_posts,
       COALESCE(SUM(a.total_comments), 0)::int AS total_comments,
       COALESCE(SUM(a.positive_count), 0)::int AS positive_comments,
       COALESCE(SUM(a.neutral_count),  0)::int AS neutral_comments,
       COALESCE(SUM(a.negative_count), 0)::int AS negative_comments
     FROM analyses a
     JOIN posts p ON p.id = a.post_id
     ${clause}`,
    values
  );

  return rows[0];
};

const getSentimentDistribution = async (filters) => {
  const { clause, values } = _buildWhereClause(filters);

  const { rows } = await db.query(
    `SELECT
       COALESCE(SUM(a.positive_count), 0)::int AS positive,
       COALESCE(SUM(a.neutral_count),  0)::int AS neutral,
       COALESCE(SUM(a.negative_count), 0)::int AS negative,
       COALESCE(SUM(a.total_comments), 0)::int AS total
     FROM analyses a
     JOIN posts p ON p.id = a.post_id
     ${clause}`,
    values
  );

  const { positive, neutral, negative, total } = rows[0];
  return {
    positive, neutral, negative, total,
    positive_pct: total > 0 ? +((positive / total) * 100).toFixed(2) : 0,
    neutral_pct:  total > 0 ? +((neutral  / total) * 100).toFixed(2) : 0,
    negative_pct: total > 0 ? +((negative / total) * 100).toFixed(2) : 0,
  };
};

const getSentimentTrends = async (filters) => {
  const { clause, values } = _buildWhereClause(filters);

  const { rows } = await db.query(
    `SELECT
       DATE_TRUNC('day', a.created_at) AS date,
       SUM(a.positive_count)::int AS positive,
       SUM(a.neutral_count)::int  AS neutral,
       SUM(a.negative_count)::int AS negative,
       SUM(a.total_comments)::int AS total
     FROM analyses a
     JOIN posts p ON p.id = a.post_id
     ${clause}
     GROUP BY DATE_TRUNC('day', a.created_at)
     ORDER BY date ASC`,
    values
  );

  return rows;
};

const getTopTopics = async (filters, limit = 10) => {
  const { clause, values, nextIdx } = _buildWhereClause(filters);

  const { rows } = await db.query(
    `SELECT t.topic, SUM(t.frequency)::int AS total_frequency
     FROM topics t
     JOIN analyses a ON a.id = t.analysis_id
     JOIN posts p ON p.id = a.post_id
     ${clause}
     GROUP BY t.topic
     ORDER BY total_frequency DESC
     LIMIT $${nextIdx}`,
    [...values, limit]
  );

  return rows;
};

const getTopKeywords = async (filters, limit = 10) => {
  const { clause, values, nextIdx } = _buildWhereClause(filters);

  const { rows } = await db.query(
    `SELECT k.keyword, SUM(k.frequency)::int AS total_frequency
     FROM keywords k
     JOIN analyses a ON a.id = k.analysis_id
     JOIN posts p ON p.id = a.post_id
     ${clause}
     GROUP BY k.keyword
     ORDER BY total_frequency DESC
     LIMIT $${nextIdx}`,
    [...values, limit]
  );

  return rows;
};

const getPlatformDistribution = async (filters) => {
  const { clause, values } = _buildWhereClause(filters);

  const { rows } = await db.query(
    `SELECT p.platform, COUNT(DISTINCT a.id)::int AS count
     FROM analyses a
     JOIN posts p ON p.id = a.post_id
     ${clause}
     GROUP BY p.platform`,
    values
  );

  return rows;
};

const getNegativeOverview = async (filters, limit = 5) => {
  const { clause, values, nextIdx } = _buildWhereClause(filters);

  const { rows } = await db.query(
    `SELECT a.id, a.negative_count, a.total_comments, a.negative_percentage,
            p.platform, p.url, p.author, p.thumbnail_url
     FROM analyses a
     JOIN posts p ON p.id = a.post_id
     ${clause}
     ORDER BY a.negative_count DESC
     LIMIT $${nextIdx}`,
    [...values, limit]
  );

  return rows;
};

const getRecentAnalyses = async (limit = 5) => {
  const { rows } = await db.query(
    `SELECT a.id, a.status, a.total_comments, a.positive_percentage,
            a.neutral_percentage, a.negative_percentage, a.created_at,
            p.platform, p.url, p.author, p.thumbnail_url
     FROM analyses a
     JOIN posts p ON p.id = a.post_id
     ORDER BY a.created_at DESC
     LIMIT $1`,
    [limit]
  );

  return rows;
};

module.exports = {
  getSummary,
  getSentimentDistribution,
  getSentimentTrends,
  getTopTopics,
  getTopKeywords,
  getPlatformDistribution,
  getNegativeOverview,
  getRecentAnalyses,
};
