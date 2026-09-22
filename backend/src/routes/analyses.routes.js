const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const analysesController = require('../controllers/analyses.controller');

// GET  /api/analyses         — list all analyses (paginated + filterable)
router.get('/', authMiddleware, analysesController.listAnalyses);

// GET  /api/analyses/:id     — analysis detail
router.get('/:id', authMiddleware, analysesController.getAnalysis);

// DELETE /api/analyses/:id   — delete analysis (with transaction)
router.delete('/:id', authMiddleware, analysesController.deleteAnalysis);

// POST /api/analyses/:id/reanalyze — re-fetch and re-analyze
router.post('/:id/reanalyze', authMiddleware, analysesController.reanalyze);

// GET  /api/analyses/:id/comments — paginated comments for an analysis
router.get('/:id/comments', authMiddleware, analysesController.getComments);

module.exports = router;
