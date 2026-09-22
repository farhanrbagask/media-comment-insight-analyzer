const { success } = require('../utils/apiResponse');
const DashboardService = require('../services/DashboardService');

/**
 * Build a common filter object from query params shared across dashboard routes.
 */
const buildFilters = (query) => ({
  platform: query.platform || null,
  dateFrom: query.dateFrom || null,
  dateTo: query.dateTo || null,
  sentiment: query.sentiment || null,
});

const getSummary = async (req, res, next) => {
  try {
    const filters = buildFilters(req.query);
    const data = await DashboardService.getSummary(filters);
    return success(res, data, 'Dashboard summary retrieved.');
  } catch (err) { next(err); }
};

const getSentiment = async (req, res, next) => {
  try {
    const filters = buildFilters(req.query);
    const data = await DashboardService.getSentimentDistribution(filters);
    return success(res, data, 'Sentiment distribution retrieved.');
  } catch (err) { next(err); }
};

const getTrends = async (req, res, next) => {
  try {
    const filters = buildFilters(req.query);
    const data = await DashboardService.getSentimentTrends(filters);
    return success(res, data, 'Sentiment trends retrieved.');
  } catch (err) { next(err); }
};

const getTopics = async (req, res, next) => {
  try {
    const filters = buildFilters(req.query);
    const limit = Math.min(parseInt(req.query.limit || '10'), 50);
    const data = await DashboardService.getTopTopics(filters, limit);
    return success(res, data, 'Top topics retrieved.');
  } catch (err) { next(err); }
};

const getKeywords = async (req, res, next) => {
  try {
    const filters = buildFilters(req.query);
    const limit = Math.min(parseInt(req.query.limit || '10'), 50);
    const data = await DashboardService.getTopKeywords(filters, limit);
    return success(res, data, 'Top keywords retrieved.');
  } catch (err) { next(err); }
};

const getPlatformDistribution = async (req, res, next) => {
  try {
    const filters = buildFilters(req.query);
    const data = await DashboardService.getPlatformDistribution(filters);
    return success(res, data, 'Platform distribution retrieved.');
  } catch (err) { next(err); }
};

const getNegativeOverview = async (req, res, next) => {
  try {
    const filters = buildFilters(req.query);
    const limit = Math.min(parseInt(req.query.limit || '5'), 20);
    const data = await DashboardService.getNegativeOverview(filters, limit);
    return success(res, data, 'Negative overview retrieved.');
  } catch (err) { next(err); }
};

const getRecentAnalyses = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '5'), 20);
    const data = await DashboardService.getRecentAnalyses(limit);
    return success(res, data, 'Recent analyses retrieved.');
  } catch (err) { next(err); }
};

module.exports = {
  getSummary,
  getSentiment,
  getTrends,
  getTopics,
  getKeywords,
  getPlatformDistribution,
  getNegativeOverview,
  getRecentAnalyses,
};
