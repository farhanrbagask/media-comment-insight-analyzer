const { success, error, paginated } = require('../utils/apiResponse');
const AnalysisService = require('../services/AnalysisService');
const CommentService = require('../services/CommentService');
const PostService = require('../services/PostService');

/**
 * GET /api/analyses
 * List all analyses with pagination, search, and filters.
 */
const listAnalyses = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      platform,
      status,
      sentiment,
      dateFrom,
      dateTo,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    const result = await AnalysisService.listAnalyses({
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      platform,
      status,
      sentiment,
      dateFrom,
      dateTo,
      search,
      sortBy,
      sortOrder,
    });

    return paginated(res, result.data, result.pagination, 'Analyses retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analyses/:id
 * Get full detail of a single analysis.
 */
const getAnalysis = async (req, res, next) => {
  try {
    const analysis = await AnalysisService.getAnalysisDetail(req.params.id);
    if (!analysis) {
      return error(res, 'Analysis not found.', 'NOT_FOUND', 404);
    }
    return success(res, analysis, 'Analysis retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/analyses/:id
 * Delete an analysis and all associated data (in a transaction).
 */
const deleteAnalysis = async (req, res, next) => {
  try {
    const deleted = await AnalysisService.deleteAnalysis(req.params.id);
    if (!deleted) {
      return error(res, 'Analysis not found.', 'NOT_FOUND', 404);
    }
    return success(res, null, 'Analysis deleted successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/analyses/:id/reanalyze
 * Fetch fresh data and run analysis again. Does not delete previous analysis.
 */
const reanalyze = async (req, res, next) => {
  try {
    const existingAnalysis = await AnalysisService.getAnalysisDetail(req.params.id);
    if (!existingAnalysis) {
      return error(res, 'Analysis not found.', 'NOT_FOUND', 404);
    }

    const post = await PostService.findById(existingAnalysis.post_id);
    const validation = { platform: post.platform, postId: post.platform_post_id };

    const { analysis } = await AnalysisService.startAnalysis(post.url, validation, post.id);

    return success(res, { analysis }, 'Re-analysis started successfully.', 202);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analyses/:id/comments
 * Get paginated comments for an analysis with filtering.
 */
const getComments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      sentiment,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    const analysisId = req.params.id;

    // Verify analysis exists
    const analysis = await AnalysisService.findById(analysisId);
    if (!analysis) {
      return error(res, 'Analysis not found.', 'NOT_FOUND', 404);
    }

    const result = await CommentService.getCommentsForAnalysis(analysisId, {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 200),
      sentiment,
      search,
      sortBy,
      sortOrder,
    });

    return paginated(res, result.data, result.pagination, 'Comments retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { listAnalyses, getAnalysis, deleteAnalysis, reanalyze, getComments };
