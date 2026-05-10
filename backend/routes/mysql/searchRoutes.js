/**
 * Search Routes
 */

const express = require('express');
const searchController = require('../../controllers/mysql/searchController');
const { asyncHandler } = require('../../middleware/enhancedErrorHandler');
const { searchLimiter } = require('../../middleware/rateLimitMiddleware');

const router = express.Router();

// Search endpoints with rate limiting
router.get('/books', searchLimiter, asyncHandler(searchController.searchBooks));
router.get('/global', searchLimiter, asyncHandler(searchController.globalSearch));
router.get('/suggestions', searchLimiter, asyncHandler(searchController.getSearchSuggestions));
router.get('/popular', asyncHandler(searchController.getPopularSearchTerms));
router.get('/filters', asyncHandler(searchController.getFilterOptions));

module.exports = router;
