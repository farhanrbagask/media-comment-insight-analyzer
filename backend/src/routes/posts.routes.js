const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth.middleware');
const postsController = require('../controllers/posts.controller');

// POST /api/posts/analyze — validate URL and start analysis
router.post(
  '/analyze',
  authMiddleware,
  [
    body('url')
      .trim()
      .notEmpty().withMessage('URL is required.')
      .isURL({ require_protocol: false }).withMessage('Please enter a valid URL.'),
  ],
  postsController.analyzePost
);

// GET /api/posts/:id — get post details
router.get('/:id', authMiddleware, postsController.getPost);

module.exports = router;
