const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');

// All dashboard routes are protected
router.use(authMiddleware);

router.get('/summary',   dashboardController.getSummary);
router.get('/sentiment', dashboardController.getSentiment);
router.get('/trends',    dashboardController.getTrends);
router.get('/topics',    dashboardController.getTopics);
router.get('/keywords',  dashboardController.getKeywords);
router.get('/platform',  dashboardController.getPlatformDistribution);
router.get('/negative',  dashboardController.getNegativeOverview);
router.get('/recent',    dashboardController.getRecentAnalyses);

module.exports = router;
