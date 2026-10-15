'use strict';
const express = require('express');
const multer  = require('multer');
const router  = express.Router();

const { authMiddleware }                = require('../middleware/auth.middleware');
const { previewImport, confirmImport }  = require('../controllers/imports.controller');

// ─── Multer config ─────────────────────────────────────────────────────────────
// Store file in memory (buffer). CSV files are text; 10 MB is generous.

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain'];
    const ext = file.originalname.toLowerCase().endsWith('.csv');
    if (allowed.includes(file.mimetype) || ext) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are accepted.'));
    }
  },
});

// ─── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/imports/preview
 * Upload a CSV, parse and clean it, return summary + importToken.
 */
router.post(
  '/preview',
  authMiddleware,
  upload.single('file'),
  previewImport
);

/**
 * POST /api/imports/confirm
 * Confirm a previously previewed import, start the ML analysis pipeline.
 */
router.post(
  '/confirm',
  authMiddleware,
  confirmImport
);

module.exports = router;
