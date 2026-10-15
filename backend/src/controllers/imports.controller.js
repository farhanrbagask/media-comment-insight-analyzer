'use strict';
const { success, error } = require('../utils/apiResponse');
const CsvImportService   = require('../services/CsvImportService');
const PostService        = require('../services/PostService');
const AnalysisService    = require('../services/AnalysisService');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_PLATFORMS = ['instagram', 'tiktok'];

function validatePlatform(platform) {
  return VALID_PLATFORMS.includes(platform);
}

function validatePostUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/imports/preview
 *
 * Accepts a multipart/form-data request with:
 *   - file     : CSV file (required)
 *   - platform : 'instagram' | 'tiktok' (required)
 *   - post_url : Source post URL (required)
 *
 * Returns a preview of valid rows, skipped rows, cleaning summary,
 * and an importToken for the subsequent confirm step.
 */
const previewImport = async (req, res, next) => {
  try {
    // File is attached by multer as req.file
    if (!req.file) {
      return error(res, 'CSV file is required.', 'MISSING_FILE', 400);
    }

    const { platform, post_url: postUrl } = req.body;

    if (!platform || !validatePlatform(platform)) {
      return error(
        res,
        `Platform is required and must be one of: ${VALID_PLATFORMS.join(', ')}.`,
        'INVALID_PLATFORM',
        400
      );
    }

    if (!postUrl || !validatePostUrl(postUrl)) {
      return error(res, 'A valid post URL is required.', 'INVALID_URL', 400);
    }

    const filename = req.file.originalname;

    // Parse + clean the CSV
    const result = CsvImportService.parseAndClean(
      req.file.buffer,
      platform,
      postUrl,
      filename
    );

    if (result.summary.valid === 0) {
      return error(
        res,
        'No valid comments found in the CSV file after cleaning. ' +
        `All ${result.summary.totalRows} rows were skipped.`,
        'NO_VALID_COMMENTS',
        422
      );
    }

    return success(res, {
      importToken: result.importToken,
      preview:     result.preview,
      skipped:     result.skipped,
      summary:     result.summary,
    }, 'CSV parsed successfully. Review the summary and confirm to start analysis.');

  } catch (err) {
    // CsvImportService throws descriptive errors for format issues
    if (err.message.includes('CSV') || err.message.includes('column')) {
      return error(res, err.message, 'CSV_PARSE_ERROR', 422);
    }
    next(err);
  }
};

/**
 * POST /api/imports/confirm
 *
 * Accepts a JSON body with:
 *   - importToken : Token from the preview step (required)
 *
 * Saves the post to the database and starts the ML analysis pipeline.
 * Returns { postId, analysisId } immediately (pipeline runs async).
 */
const confirmImport = async (req, res, next) => {
  try {
    const { importToken } = req.body;

    if (!importToken || typeof importToken !== 'string') {
      return error(res, 'importToken is required.', 'MISSING_TOKEN', 400);
    }

    // Retrieve parsed data from in-memory store
    const importData = CsvImportService.getImportData(importToken);

    if (!importData) {
      return error(
        res,
        'Import session expired or not found. Please re-upload the CSV file.',
        'TOKEN_EXPIRED',
        410
      );
    }

    const { data: comments, summary } = importData;

    // Generate a stable platform_post_id from the URL
    // Using a hash so re-importing the same URL is detectable
    const crypto = require('crypto');
    const platformPostId = crypto
      .createHash('sha1')
      .update(`${summary.platform}:${summary.postUrl}`)
      .digest('hex')
      .slice(0, 40);

    // Check if this post URL was already imported
    const existingPost = await PostService.findByPlatformPostId(
      summary.platform,
      platformPostId
    );

    let post;
    if (existingPost) {
      post = existingPost;
    } else {
      // Create the post record
      post = await PostService.create({
        platform:         summary.platform,
        platformPostId,
        url:              summary.postUrl,
        importSource:     'csv',
        importedFilename: summary.filename,
      });
    }

    // Start the analysis pipeline with pre-supplied comments (skips fetching step)
    const { analysis } = await AnalysisService.startFromComments(post.id, comments);

    return success(
      res,
      { postId: post.id, analysisId: analysis.id },
      'Analysis started. You can track progress on the analysis page.',
      202
    );

  } catch (err) {
    next(err);
  }
};

module.exports = { previewImport, confirmImport };
