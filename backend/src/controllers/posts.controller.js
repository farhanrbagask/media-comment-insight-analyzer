const { validationResult } = require('express-validator');
const { success, error } = require('../utils/apiResponse');
const { validateUrl } = require('../utils/urlValidator');
const PostService = require('../services/PostService');
const AnalysisService = require('../services/AnalysisService');

/**
 * POST /api/posts/analyze
 * Validates the URL, checks for duplicates, starts analysis.
 */
const analyzePost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array()[0].msg, 'VALIDATION_ERROR', 422);
    }

    const { url } = req.body;

    // Platform detection + URL validation
    const validation = validateUrl(url);
    if (!validation.valid) {
      return error(res, validation.error, 'INVALID_URL', 400);
    }

    // Check if this post was already analyzed
    const existingPost = await PostService.findByPlatformPostId(
      validation.platform,
      validation.postId
    );

    if (existingPost) {
      const latestAnalysis = await AnalysisService.getLatestForPost(existingPost.id);
      return res.status(200).json({
        success: true,
        message: 'This post has already been analyzed.',
        data: {
          alreadyAnalyzed: true,
          post: existingPost,
          latestAnalysis,
        },
      });
    }

    // Start analysis pipeline (async — returns immediately with analysis record)
    const { post, analysis } = await AnalysisService.startAnalysis(url, validation);

    return success(
      res,
      { post, analysis },
      'Analysis started successfully.',
      202
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/posts/:id
 * Get a single post with its analyses.
 */
const getPost = async (req, res, next) => {
  try {
    const post = await PostService.findById(req.params.id);
    if (!post) {
      return error(res, 'Post not found.', 'NOT_FOUND', 404);
    }
    return success(res, post, 'Post retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { analyzePost, getPost };
